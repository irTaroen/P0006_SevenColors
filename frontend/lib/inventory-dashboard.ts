import type { InventoryBarItem, InventoryKpis } from "@/components/features/inventory/types"
import type { InventoryEntry } from "@/lib/inventory-rows"
import {
  getInventoryStockStatus,
  getInventoryTotal,
  type InventoryStockStatus,
} from "@/lib/inventory-status"

type CatalogItem = {
  id: string
  name: string
  unit: string
  minimumInventory?: number
}
type CatalogProduct = { id: string; name: string; unit: string }

function getEntryName(
  entry: InventoryEntry,
  items: CatalogItem[],
  products: CatalogProduct[]
) {
  if (entry.type === "product" || entry.productId) {
    return products.find((p) => p.id === entry.productId)?.name ?? entry.productId ?? "—"
  }
  return items.find((i) => i.id === entry.itemId)?.name ?? entry.itemId ?? "—"
}

function getEntryUnit(
  entry: InventoryEntry,
  items: CatalogItem[],
  products: CatalogProduct[]
) {
  if (entry.type === "product" || entry.productId) {
    return products.find((p) => p.id === entry.productId)?.unit
  }
  return items.find((i) => i.id === entry.itemId)?.unit
}

function getEntryMinimum(
  entry: InventoryEntry,
  items: CatalogItem[]
) {
  if (entry.type === "product" || entry.productId) return 0
  return items.find((i) => i.id === entry.itemId)?.minimumInventory ?? 0
}

function getCatalogId(entry: InventoryEntry) {
  if (entry.type === "product" || entry.productId) return entry.productId ?? "—"
  return entry.itemId ?? "—"
}

export function toBarItem(
  entry: InventoryEntry,
  items: CatalogItem[],
  products: CatalogProduct[]
): InventoryBarItem {
  const isProduct = entry.type === "product" || !!entry.productId
  const available = entry.available ?? 0
  const minimumInventory = getEntryMinimum(entry, items)

  return {
    id: entry.id,
    catalogId: getCatalogId(entry),
    name: getEntryName(entry, items, products),
    type: isProduct ? "product" : "item",
    typeLabel: isProduct ? "Product" : "Item",
    available,
    reserved: entry.reserved ?? 0,
    inUse: entry.inUse ?? 0,
    capacity: getInventoryTotal(entry),
    minimumInventory,
    unit: getEntryUnit(entry, items, products),
    status: getInventoryStockStatus(available, minimumInventory),
    entry,
  }
}

export function buildBarItems(
  rows: InventoryEntry[],
  items: CatalogItem[],
  products: CatalogProduct[]
): InventoryBarItem[] {
  return rows.map((row) => toBarItem(row, items, products))
}

export function splitByType(items: InventoryBarItem[]) {
  return {
    rawMaterials: items.filter((it) => it.type === "item"),
    finishedProducts: items.filter((it) => it.type === "product"),
  }
}

export function computeInventoryKpis(items: InventoryBarItem[]): InventoryKpis {
  const totalAvailable = items.reduce((s, it) => s + it.available, 0)
  const totalReserved = items.reduce((s, it) => s + it.reserved, 0)
  const totalCapacity = items.reduce((s, it) => s + it.capacity, 0)
  const utilizationPct =
    totalCapacity > 0
      ? Math.round(((totalAvailable + totalReserved) / totalCapacity) * 100)
      : null

  return { totalAvailable, totalReserved, totalCapacity, utilizationPct }
}

export function isLowStockStatus(status: InventoryStockStatus) {
  return status === "low" || status === "out_of_stock"
}

export function getLowStockItems(items: InventoryBarItem[]): InventoryBarItem[] {
  return items
    .filter((it) => isLowStockStatus(it.status))
    .sort((a, b) => {
      const ratioA = a.minimumInventory > 0 ? a.available / a.minimumInventory : a.available
      const ratioB = b.minimumInventory > 0 ? b.available / b.minimumInventory : b.available
      return ratioA - ratioB
    })
}

export function maxCapacityInGroup(items: InventoryBarItem[]) {
  if (items.length === 0) return 1
  return Math.max(...items.map((it) => it.capacity), 1)
}

export function formatInventoryNumber(value: number) {
  return value.toLocaleString("en-US")
}
