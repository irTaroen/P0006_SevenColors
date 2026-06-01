import type { Low } from "lowdb"
import { json } from "milliparsec"
import { isItem, Service } from "json-server/lib/service.js"

import {
  getProductionRequirementPreview,
  InsufficientInventoryError,
  UnknownProductError,
  recalculateInventoryReservations,
  type InventoryEntry,
  type Order,
  type OrderLine,
  type Product,
} from "../lib/reserve-inventory.ts"

type Db = Low<{
  orders?: Order[]
  products?: Product[]
  inventory?: InventoryEntry[]
}>

function sendReservationError(res: { status: (code: number) => { json: (body: unknown) => void } }, error: unknown) {
  if (error instanceof InsufficientInventoryError) {
    res.status(409).json({
      error: error.message,
      shortages: error.shortages,
    })
    return true
  }

  if (error instanceof UnknownProductError) {
    res.status(400).json({
      error: error.message,
      orderId: error.orderId,
      productId: error.productId,
    })
    return true
  }

  return false
}

function cloneOrder(order: Order): Order {
  return {
    ...order,
    products: order.products.map((line) => ({ ...line })),
  }
}

function cloneInventoryEntry(entry: InventoryEntry): InventoryEntry {
  return { ...entry }
}

function nextNumericId(records: { id: string }[]) {
  const numericIds = records
    .map((record) => Number.parseInt(record.id, 10))
    .filter(Number.isFinite)
  return String((numericIds.length ? Math.max(...numericIds) : 0) + 1)
}

function findItemInventory(inventory: InventoryEntry[], itemId: string) {
  return inventory.find(
    (entry) =>
      entry.itemId === itemId &&
      (entry.type === "item" || (!entry.type && !entry.productId)),
  )
}

function findProductInventory(inventory: InventoryEntry[], productId: string) {
  return inventory.find(
    (entry) =>
      entry.productId === productId &&
      (entry.type === "product" || !entry.itemId),
  )
}

function normalizeInventoryReservations(inventory: InventoryEntry[]) {
  return inventory.map((entry) => ({
    ...entry,
    available: (entry.available ?? 0) + (entry.reserved ?? 0),
    reserved: 0,
  }))
}

function ensureProductInventory(inventory: InventoryEntry[], productId: string) {
  const existing = findProductInventory(inventory, productId)
  if (existing) return existing

  const created: InventoryEntry = {
    id: nextNumericId(inventory),
    type: "product",
    itemId: null,
    productId,
    available: 0,
    reserved: 0,
    inUse: 0,
    warehouse: "Finished Goods Warehouse",
  }
  inventory.push(created)
  return created
}

function getRawMaterialRequirements(lines: OrderLine[], products: Product[]) {
  const requirements = new Map<string, number>()

  for (const line of lines) {
    const product = products.find((entry) => entry.id === line.productId)
    if (!product) {
      throw new UnknownProductError("production", line.productId)
    }

    for (const component of product.components ?? []) {
      requirements.set(
        component.itemId,
        (requirements.get(component.itemId) ?? 0) + component.amount * line.quantity,
      )
    }
  }

  return requirements
}

function upsertInternalProductionOrder(orders: Order[], sourceOrder: Order, lines: OrderLine[]) {
  const existing = orders.find(
    (order) =>
      order.type === "internal" &&
      order.sourceOrderId === sourceOrder.id &&
      order.status !== "cancelled" &&
      order.status !== "returned" &&
      order.status !== "produced",
  )

  const internalOrder = {
    clientId: sourceOrder.clientId,
    orderDate: sourceOrder.orderDate,
    productionDate: "",
    deliveryDate: "",
    status: "in_progress",
    type: "internal" as const,
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

function prepareApprovedExternalOrder(db: Db, order: Order) {
  if (order.type === "internal" || order.status !== "approved") return

  const products = db.data.products ?? []
  const preview = getProductionRequirementPreview(
    order.products,
    products,
    db.data.inventory ?? [],
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
    upsertInternalProductionOrder(db.data.orders ?? [], order, productionLines)
    order.status = "waiting_for_production"
    return
  }

  order.status = "ready_for_shipping"
}

function applyCompletedInternalProduction(db: Db) {
  const orders = db.data.orders ?? []
  const products = db.data.products ?? []
  const updatedInventory = normalizeInventoryReservations(db.data.inventory ?? [])

  for (const order of orders) {
    if (order.type !== "internal" || order.status !== "produced" || order.productionApplied) {
      continue
    }

    const requirements = getRawMaterialRequirements(order.products, products)
    const shortages: { itemId: string; required: number; available: number }[] = []

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
      const productEntry = ensureProductInventory(updatedInventory, line.productId)
      productEntry.available += line.quantity
    }

    order.productionApplied = true

    const sourceOrder = orders.find((entry) => entry.id === order.sourceOrderId)
    if (sourceOrder?.status === "waiting_for_production") {
      const preview = getProductionRequirementPreview(
        sourceOrder.products,
        products,
        updatedInventory,
      )
      if (!preview.hasProductShortages) {
        sourceOrder.status = "ready_for_shipping"
      }
    }
  }

  db.data.inventory = updatedInventory
}

async function persistOrderWorkflow(db: Db, changedOrderId?: string) {
  const changedOrder = changedOrderId
    ? db.data.orders?.find((order) => order.id === changedOrderId)
    : undefined
  if (changedOrder) {
    prepareApprovedExternalOrder(db, changedOrder)
  }

  applyCompletedInternalProduction(db)

  const result = recalculateInventoryReservations(
    db.data.orders ?? [],
    db.data.products ?? [],
    db.data.inventory ?? [],
  )

  db.data.inventory = result.inventory
  db.data.orders = result.orders
  await db.write()

  return result
}

const UNALLOCATED_ORDER_STATUSES = new Set(["new", "pending", "cancelled", "returned"])

function shouldRecalculateInventory(previousStatus: string | undefined, nextStatus: unknown) {
  const resolvedNextStatus = typeof nextStatus === "string" ? nextStatus : previousStatus
  const wasAllocated =
    typeof previousStatus === "string" && !UNALLOCATED_ORDER_STATUSES.has(previousStatus)
  const willBeAllocated =
    typeof resolvedNextStatus === "string" &&
    !UNALLOCATED_ORDER_STATUSES.has(resolvedNextStatus)

  return wasAllocated || willBeAllocated
}

export function registerOrderRoutes(app: import("@tinyhttp/app").App, db: Db) {
  const service = new Service(db)
  const parseJson = json()

  app.post("/orders", parseJson, async (req, res) => {
    if (!isItem(req.body)) {
      res.status(400).json({ error: "Body must be a JSON object" })
      return
    }

    const previousOrders = (db.data.orders ?? []).map(cloneOrder)
    const previousInventory = (db.data.inventory ?? []).map(cloneInventoryEntry)
    const created = await service.create("orders", req.body)
    if (!created) {
      res.status(404).json({ error: "Not Found" })
      return
    }

    if (!shouldRecalculateInventory(undefined, req.body.status)) {
      res.status(201).json(created)
      return
    }

    try {
      await persistOrderWorkflow(db, created.id)
      const order = db.data.orders?.find((entry) => entry.id === created.id)
      res.status(201).json(order ?? created)
    } catch (error) {
      db.data.orders = previousOrders
      db.data.inventory = previousInventory
      await db.write()
      if (sendReservationError(res, error)) return
      throw error
    }
  })

  app.patch("/orders/:id", parseJson, async (req, res) => {
    const { id = "" } = req.params

    if (!isItem(req.body)) {
      res.status(400).json({ error: "Body must be a JSON object" })
      return
    }

    const previous = db.data.orders?.find((order) => order.id === id)
    if (!previous) {
      res.status(404).json({ error: "Not Found" })
      return
    }

    const previousOrders = (db.data.orders ?? []).map(cloneOrder)
    const previousInventory = (db.data.inventory ?? []).map(cloneInventoryEntry)
    const shouldRecalculate = shouldRecalculateInventory(previous.status, req.body.status)
    const updated = await service.patchById("orders", id, req.body)
    if (!updated) {
      res.status(404).json({ error: "Not Found" })
      return
    }

    if (!shouldRecalculate) {
      res.json(updated)
      return
    }

    try {
      await persistOrderWorkflow(db, id)
      const order = db.data.orders?.find((entry) => entry.id === id)
      res.json(order ?? updated)
    } catch (error) {
      db.data.orders = previousOrders
      db.data.inventory = previousInventory
      await db.write()
      if (sendReservationError(res, error)) return
      throw error
    }
  })
}
