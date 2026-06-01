import type { InventoryEntry } from "../types"

export type InventoryMovementKind =
  | "receipt"
  | "issue"
  | "adjust"
  | "reserve"
  | "unreserve"
  | "consume"
  | "unconsume"
  | "produce"
  | "ship"
  | "return"

export type InventoryMovement = {
  id: string
  ts: string
  warehouse?: string
  entityType: "item" | "product"
  itemId?: string | null
  productId?: string | null
  kind: InventoryMovementKind
  qty: number
  refType?: string
  refId?: string
  note?: string
}

type Key = `${"item" | "product"}:${string}:${string}`

function keyFor(m: InventoryMovement): Key {
  const warehouse = m.warehouse ?? ""
  const id = m.entityType === "product" ? (m.productId ?? "") : (m.itemId ?? "")
  return `${m.entityType}:${id}:${warehouse}`
}

function ensureEntry(map: Map<Key, InventoryEntry>, m: InventoryMovement) {
  const key = keyFor(m)
  const existing = map.get(key)
  if (existing) return existing
  const created: InventoryEntry = {
    id: `derived:${key}`,
    type: m.entityType,
    itemId: m.entityType === "item" ? (m.itemId ?? null) : null,
    productId: m.entityType === "product" ? (m.productId ?? null) : null,
    available: 0,
    reserved: 0,
    inUse: 0,
    warehouse: m.warehouse ?? "",
  }
  map.set(key, created)
  return created
}

export function applyMovement(entry: InventoryEntry, m: InventoryMovement) {
  const qty = Math.abs(m.qty)
  switch (m.kind) {
    case "receipt":
    case "adjust":
    case "produce":
    case "return":
      entry.available += qty
      break
    case "issue":
    case "ship":
      entry.available -= qty
      break
    case "reserve":
      entry.available -= qty
      entry.reserved += qty
      break
    case "unreserve":
      entry.available += qty
      entry.reserved -= qty
      break
    case "consume":
      entry.available -= qty
      entry.inUse += qty
      break
    case "unconsume":
      entry.available += qty
      entry.inUse -= qty
      break
    default:
      break
  }
}

export function computeInventoryFromMovements(
  movements: InventoryMovement[]
): InventoryEntry[] {
  const sorted = [...movements].sort((a, b) => a.ts.localeCompare(b.ts))
  const map = new Map<Key, InventoryEntry>()
  for (const m of sorted) {
    const entry = ensureEntry(map, m)
    applyMovement(entry, m)
  }
  return Array.from(map.values())
}

export function getMovementDeltas(current: InventoryEntry, desired: InventoryEntry) {
  return {
    available: (desired.available ?? 0) - (current.available ?? 0),
    reserved: (desired.reserved ?? 0) - (current.reserved ?? 0),
    inUse: (desired.inUse ?? 0) - (current.inUse ?? 0),
  }
}

