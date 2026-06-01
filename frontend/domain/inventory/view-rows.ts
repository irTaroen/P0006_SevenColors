import type { InventoryEntry as BaseInventoryEntry } from "../types.ts"
import { findItemInventory, findProductInventory } from "./lookup.ts"

export type InventoryEntry = BaseInventoryEntry & {
  persisted: boolean
}

type CatalogItem = {
  id: string
  name: string
  unit: string
  minimumInventory?: number
}
type CatalogProduct = { id: string; name: string; unit: string }

function virtualItemRow(item: CatalogItem): InventoryEntry {
  return {
    id: `virtual:item:${item.id}`,
    type: "item",
    itemId: item.id,
    productId: null,
    available: 0,
    reserved: 0,
    inUse: 0,
    warehouse: "",
    persisted: false,
  }
}

function virtualProductRow(product: CatalogProduct): InventoryEntry {
  return {
    id: `virtual:product:${product.id}`,
    type: "product",
    itemId: null,
    productId: product.id,
    available: 0,
    reserved: 0,
    inUse: 0,
    warehouse: "",
    persisted: false,
  }
}

/** One row per catalog item and product, merged with persisted inventory stock. */
export function buildInventoryRows(
  items: CatalogItem[],
  products: CatalogProduct[],
  inventory: BaseInventoryEntry[]
): InventoryEntry[] {
  const itemRows = items.map((item) => {
    const record = findItemInventory(inventory, item.id)
    if (!record) return virtualItemRow(item)
    return {
      ...record,
      type: "item" as const,
      itemId: item.id,
      productId: null,
      available: record.available ?? 0,
      reserved: record.reserved ?? 0,
      inUse: record.inUse ?? 0,
      warehouse: record.warehouse ?? "",
      persisted: true,
    }
  })

  const productRows = products.map((product) => {
    const record = findProductInventory(inventory, product.id)
    if (!record) return virtualProductRow(product)
    return {
      ...record,
      type: "product" as const,
      itemId: null,
      productId: product.id,
      available: record.available ?? 0,
      reserved: record.reserved ?? 0,
      inUse: record.inUse ?? 0,
      warehouse: record.warehouse ?? "",
      persisted: true,
    }
  })

  return [...itemRows, ...productRows]
}

export function isVirtualInventoryId(id: string) {
  return id.startsWith("virtual:")
}

export function getProductAvailableStock(
  inventory: BaseInventoryEntry[],
  productId: string
): number {
  return findProductInventory(inventory, productId)?.available ?? 0
}
