import type { InventoryEntry, Order, OrderLine, Product } from "../types.ts"
import {
  ensureProductInventory,
  findItemInventory,
  normalizeInventoryReservations,
  nextNumericId,
} from "../inventory/lookup.ts"
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
    }

    for (const line of order.products) {
      const productEntry = ensureProductInventory(
        updatedInventory,
        line.productId
      )
      productEntry.available += line.quantity
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
  const changedOrder = changedOrderId
    ? store.data.orders?.find((order) => order.id === changedOrderId)
    : undefined
  if (changedOrder) {
    prepareApprovedExternalOrder(store.data, changedOrder)
  }

  applyCompletedInternalProduction(store.data)

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
