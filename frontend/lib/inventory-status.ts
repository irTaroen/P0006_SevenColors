export type InventoryStockStatus = "in_stock" | "low" | "out_of_stock"

export const INVENTORY_STATUS_LABELS: Record<InventoryStockStatus, string> = {
  in_stock: "In stock",
  low: "Low inventory",
  out_of_stock: "Out of stock",
}

export const INVENTORY_STATUS_COLORS: Record<InventoryStockStatus, string> = {
  in_stock: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  low: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  out_of_stock: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export function getInventoryStockStatus(
  available: number,
  minimumInventory: number,
): InventoryStockStatus {
  if (available <= 0) return "out_of_stock"
  if (minimumInventory > 0 && available <= minimumInventory) return "low"
  return "in_stock"
}

export function getInventoryTotal(entry: {
  available: number
  reserved: number
  inUse: number
}) {
  return (entry.available ?? 0) + (entry.reserved ?? 0) + (entry.inUse ?? 0)
}
