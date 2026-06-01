import type { Low } from "lowdb"
import { json } from "milliparsec"
import { isItem, Service } from "json-server/lib/service.js"

import {
  InsufficientInventoryError,
  UnknownProductError,
} from "../domain/orders/reservation.ts"
import {
  type InventoryEntry,
  type Order,
  type Product,
} from "../domain/types.ts"
import { shouldRecalculateInventory } from "../domain/orders/allocation-rules.ts"
import { persistOrderWorkflow } from "../domain/orders/workflow.ts"
import type { InventoryMovement } from "../domain/inventory/movements.ts"

type Db = Low<{
  orders?: Order[]
  products?: Product[]
  inventory?: InventoryEntry[]
  inventory_movements?: InventoryMovement[]
}>

function sendReservationError(
  res: { status: (code: number) => { json: (body: unknown) => void } },
  error: unknown
) {
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

function cloneMovement(entry: InventoryMovement): InventoryMovement {
  return { ...entry }
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
    const previousMovements = (db.data.inventory_movements ?? []).map(cloneMovement)
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
      const store = {
        data: {
          orders: db.data.orders,
          products: db.data.products,
          inventory: db.data.inventory,
          inventoryMovements: db.data.inventory_movements,
        },
        write: async () => {
          db.data.orders = store.data.orders
          db.data.inventory = store.data.inventory
          db.data.inventory_movements = store.data.inventoryMovements
          await db.write()
        },
      }
      await persistOrderWorkflow(store, created.id)
      const order = db.data.orders?.find((entry) => entry.id === created.id)
      res.status(201).json(order ?? created)
    } catch (error) {
      db.data.orders = previousOrders
      db.data.inventory = previousInventory
      db.data.inventory_movements = previousMovements
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
    const previousMovements = (db.data.inventory_movements ?? []).map(cloneMovement)
    const shouldRecalculate = shouldRecalculateInventory(
      previous.status,
      req.body.status
    )
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
      const store = {
        data: {
          orders: db.data.orders,
          products: db.data.products,
          inventory: db.data.inventory,
          inventoryMovements: db.data.inventory_movements,
        },
        write: async () => {
          db.data.orders = store.data.orders
          db.data.inventory = store.data.inventory
          db.data.inventory_movements = store.data.inventoryMovements
          await db.write()
        },
      }
      await persistOrderWorkflow(store, id)
      const order = db.data.orders?.find((entry) => entry.id === id)
      res.json(order ?? updated)
    } catch (error) {
      db.data.orders = previousOrders
      db.data.inventory = previousInventory
      db.data.inventory_movements = previousMovements
      await db.write()
      if (sendReservationError(res, error)) return
      throw error
    }
  })
}
