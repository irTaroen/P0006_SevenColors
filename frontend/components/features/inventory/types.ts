import type { InventoryStockStatus } from "@/lib/inventory-status"
import type { InventoryEntry } from "@/lib/inventory-rows"

export type SemanticColorKey =
  | "amber"
  | "red"
  | "purple"
  | "orange"
  | "green"
  | "grey"
  | "yellow"
  | "blue"

export type InventoryBarItem = {
  id: string
  catalogId: string
  name: string
  type: "item" | "product"
  typeLabel: string
  available: number
  reserved: number
  inUse: number
  capacity: number
  minimumInventory: number
  unit?: string
  status: InventoryStockStatus
  entry: InventoryEntry
}

export type InventoryKpis = {
  totalAvailable: number
  totalReserved: number
  totalCapacity: number
  utilizationPct: number | null
}
