import type { InventoryEntry } from "../types.ts"

export function findItemInventory<T extends InventoryEntry>(
  inventory: T[],
  itemId: string
) {
  return inventory.find(
    (entry) =>
      entry.itemId === itemId &&
      (entry.type === "item" || (!entry.type && !entry.productId))
  )
}

export function findProductInventory<T extends InventoryEntry>(
  inventory: T[],
  productId: string
) {
  return inventory.find(
    (entry) =>
      entry.productId === productId &&
      (entry.type === "product" || !entry.itemId)
  )
}

export function normalizeInventoryReservations<T extends InventoryEntry>(
  inventory: T[]
) {
  return inventory.map((entry) => ({
    ...entry,
    available: (entry.available ?? 0) + (entry.reserved ?? 0),
    reserved: 0,
  }))
}

export function nextNumericId(records: { id: string }[]) {
  const numericIds = records
    .map((record) => Number.parseInt(record.id, 10))
    .filter(Number.isFinite)
  return String((numericIds.length ? Math.max(...numericIds) : 0) + 1)
}

export function ensureProductInventory(
  inventory: InventoryEntry[],
  productId: string
) {
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
