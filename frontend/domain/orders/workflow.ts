import type { InventoryEntry, Order, OrderLine, Product } from "../types.ts"
import {
  ensureProductInventory,
  findItemInventory,
  normalizeInventoryReservations,
  nextNumericId,
} from "../inventory/lookup.ts"
import {
  computeInventoryFromMovements,
  getMovementDeltas,
  type InventoryMovement,
} from "../inventory/movements.ts"
import {
  getProductionRequirementPreview,
  getRawMaterialRequirements,
  InsufficientInventoryError,
  recalculateInventoryReservations,
} from "./reservation.ts"

export type OrderWorkflowData = {
  orders?: Order[]
  products?: Product[]
  inventory?: InventoryEntry[]
  inventoryMovements?: InventoryMovement[]
}

export type OrderWorkflowStore = {
  data: OrderWorkflowData
  write: () => Promise<void>
}

function upsertInternalProductionOrder(
  orders: Order[],
  sourceOrder: Order,
  lines: OrderLine[]
) {
  const existing = orders.find(
    (order) =>
      order.type === "internal" &&
      order.sourceOrderId === sourceOrder.id &&
      order.status !== "cancelled" &&
      order.status !== "returned" &&
      order.status !== "produced"
  )

  const internalOrder: Omit<Order, "id"> = {
    clientId: sourceOrder.clientId,
    orderDate: sourceOrder.orderDate,
    productionDate: "",
    deliveryDate: "",
    status: "in_progress",
    type: "internal",
    sourceOrderId: sourceOrder.id,
    totalPrice: 0,
    productionApplied: false,
    products: lines.map((line) => ({ ...line })),
  }

  if (existing) {
    Object.assign(existing, internalOrder)
    return existing
  }

  const created = {
    id: nextNumericId(orders),
    ...internalOrder,
  }
  orders.push(created)
  return created
}

export function prepareApprovedExternalOrder(
  data: OrderWorkflowData,
  order: Order
) {
  if (order.type === "internal" || order.status !== "approved") return

  const products = data.products ?? []
  const preview = getProductionRequirementPreview(
    order.products,
    products,
    data.inventory ?? []
  )

  if (preview.hasRawMaterialShortages) {
    throw new InsufficientInventoryError(preview.rawMaterialShortages)
  }

  const productionLines = preview.products
    .filter((requirement) => requirement.toProduce > 0)
    .map((requirement) => ({
      productId: requirement.productId,
      quantity: requirement.toProduce,
    }))

  if (productionLines.length > 0) {
    upsertInternalProductionOrder(data.orders ?? [], order, productionLines)
    order.status = "waiting_for_production"
    return
  }

  order.status = "ready_for_shipping"
}

export function applyCompletedInternalProduction(data: OrderWorkflowData) {
  const orders = data.orders ?? []
  const products = data.products ?? []
  const updatedInventory = normalizeInventoryReservations(data.inventory ?? [])
  const movements = data.inventoryMovements
  const now = new Date().toISOString()

  for (const order of orders) {
    if (
      order.type !== "internal" ||
      order.status !== "produced" ||
      order.productionApplied
    ) {
      continue
    }

    const requirements = getRawMaterialRequirements(order.products, products)
    const shortages: { itemId: string; required: number; available: number }[] =
      []

    for (const [itemId, required] of requirements) {
      const entry = findItemInventory(updatedInventory, itemId)
      const available = entry?.available ?? 0
      if (available < required) {
        shortages.push({ itemId, required, available })
      }
    }

    if (shortages.length > 0) {
      throw new InsufficientInventoryError(shortages)
    }

    for (const [itemId, required] of requirements) {
      const entry = findItemInventory(updatedInventory, itemId)
      if (entry) entry.available -= required
      if (movements && required > 0) {
        movements.push({
          id: nextNumericId(movements),
          ts: now,
          entityType: "item",
          itemId,
          productId: null,
          warehouse: entry?.warehouse ?? "",
          kind: "consume",
          qty: required,
          refType: "production_order",
          refId: order.id,
          note: "Raw material consumption",
        })
      }
    }

    for (const line of order.products) {
      const productEntry = ensureProductInventory(
        updatedInventory,
        line.productId
      )
      productEntry.available += line.quantity
      if (movements && line.quantity > 0) {
        movements.push({
          id: nextNumericId(movements),
          ts: now,
          entityType: "product",
          itemId: null,
          productId: line.productId,
          warehouse: productEntry.warehouse,
          kind: "produce",
          qty: line.quantity,
          refType: "production_order",
          refId: order.id,
          note: "Finished goods produced",
        })
      }
    }

    order.productionApplied = true

    const sourceOrder = orders.find((entry) => entry.id === order.sourceOrderId)
    if (sourceOrder?.status === "waiting_for_production") {
      const preview = getProductionRequirementPreview(
        sourceOrder.products,
        products,
        updatedInventory
      )
      if (!preview.hasProductShortages) {
        sourceOrder.status = "ready_for_shipping"
      }
    }
  }

  data.inventory = updatedInventory
}

export async function persistOrderWorkflow(
  store: OrderWorkflowStore,
  changedOrderId?: string
) {
  if (store.data.inventoryMovements) {
    store.data.inventory = computeInventoryFromMovements(store.data.inventoryMovements)
  }

  const changedOrder = changedOrderId
    ? store.data.orders?.find((order) => order.id === changedOrderId)
    : undefined
  if (changedOrder) {
    prepareApprovedExternalOrder(store.data, changedOrder)
  }

  applyCompletedInternalProduction(store.data)

  if (store.data.inventoryMovements) {
    const before = computeInventoryFromMovements(store.data.inventoryMovements)
    const result = recalculateInventoryReservations(
      store.data.orders ?? [],
      store.data.products ?? [],
      before
    )

    const now = new Date().toISOString()

    const keyOf = (e: InventoryEntry) =>
      `${e.type ?? (e.productId ? "product" : "item")}:${e.itemId ?? ""}:${e.productId ?? ""}:${e.warehouse}`

    const beforeMap = new Map(before.map((e) => [keyOf(e), e]))

    for (const afterEntry of result.inventory) {
      const beforeEntry =
        beforeMap.get(keyOf(afterEntry)) ??
        ({
          ...afterEntry,
          available: 0,
          reserved: 0,
          inUse: 0,
        } as InventoryEntry)

      const deltas = getMovementDeltas(beforeEntry, afterEntry)
      const entityType = (afterEntry.type ??
        (afterEntry.productId ? "product" : "item")) as "item" | "product"

      if (deltas.reserved !== 0) {
        store.data.inventoryMovements.push({
          id: nextNumericId(store.data.inventoryMovements),
          ts: now,
          entityType,
          itemId: entityType === "item" ? afterEntry.itemId : null,
          productId: entityType === "product" ? (afterEntry.productId ?? null) : null,
          warehouse: afterEntry.warehouse,
          kind: deltas.reserved > 0 ? "reserve" : "unreserve",
          qty: Math.abs(deltas.reserved),
          refType: "sales_order",
          refId: changedOrderId,
          note: "Reservation reconciliation",
        })
      }

      if (deltas.inUse !== 0) {
        store.data.inventoryMovements.push({
          id: nextNumericId(store.data.inventoryMovements),
          ts: now,
          entityType,
          itemId: entityType === "item" ? afterEntry.itemId : null,
          productId: entityType === "product" ? (afterEntry.productId ?? null) : null,
          warehouse: afterEntry.warehouse,
          kind: deltas.inUse > 0 ? "consume" : "unconsume",
          qty: Math.abs(deltas.inUse),
          refType: "sales_order",
          refId: changedOrderId,
          note: "Usage reconciliation",
        })
      }
    }

    store.data.inventory = computeInventoryFromMovements(store.data.inventoryMovements)
    store.data.orders = result.orders
    await store.write()
    return { inventory: store.data.inventory, orders: result.orders }
  }

  const result = recalculateInventoryReservations(
    store.data.orders ?? [],
    store.data.products ?? [],
    store.data.inventory ?? []
  )

  store.data.inventory = result.inventory
  store.data.orders = result.orders
  await store.write()

  return result
}
