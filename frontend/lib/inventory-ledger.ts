import type { InventoryEntry } from "@/domain/types"
import { nextNumericId } from "@/domain/inventory/lookup"

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

export type InventoryMovementRefType =
  | "purchase_order"
  | "production_order"
  | "sales_order"
  | "shipment"
  | "manual"

export type InventoryMovement = {
  id: string
  ts: string
  warehouse?: string
  entityType: "item" | "product"
  itemId?: string | null
  productId?: string | null
  kind: InventoryMovementKind
  qty: number
  refType?: InventoryMovementRefType
  refId?: string
  note?: string
}

type Key = `${"item" | "product"}:${string}:${string}`

function movementKey(m: InventoryMovement): Key {
  const warehouse = m.warehouse ?? ""
  const id =
    m.entityType === "product" ? (m.productId ?? "") : (m.itemId ?? "")
  return `${m.entityType}:${id}:${warehouse}`
}

function ensureEntry(
  map: Map<Key, InventoryEntry>,
  m: InventoryMovement
): InventoryEntry {
  const key = movementKey(m)
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

export function applyMovementToEntry(entry: InventoryEntry, m: InventoryMovement) {
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
    applyMovementToEntry(entry, m)
  }

  return Array.from(map.values()).map((entry) => ({
    ...entry,
    available: Math.round(entry.available * 1000) / 1000,
    reserved: Math.round(entry.reserved * 1000) / 1000,
    inUse: Math.round(entry.inUse * 1000) / 1000,
  }))
}

export function buildAdjustmentMovements({
  movementRecords,
  ts,
  entityType,
  itemId,
  productId,
  warehouse,
  current,
  desired,
  refType = "manual",
  refId,
  note,
}: {
  movementRecords: { id: string }[]
  ts: string
  entityType: "item" | "product"
  itemId?: string | null
  productId?: string | null
  warehouse?: string
  current: { available: number; reserved: number; inUse: number }
  desired: { available: number; reserved: number; inUse: number }
  refType?: InventoryMovementRefType
  refId?: string
  note?: string
}): Omit<InventoryMovement, "id">[] {
  const moves: Omit<InventoryMovement, "id">[] = []

  const deltaAvailable = (desired.available ?? 0) - (current.available ?? 0)
  const deltaReserved = (desired.reserved ?? 0) - (current.reserved ?? 0)
  const deltaInUse = (desired.inUse ?? 0) - (current.inUse ?? 0)

  if (deltaAvailable !== 0) {
    moves.push({
      ts,
      entityType,
      itemId: itemId ?? null,
      productId: productId ?? null,
      warehouse,
      kind: deltaAvailable > 0 ? "adjust" : "issue",
      qty: Math.abs(deltaAvailable),
      refType,
      refId,
      note: note ?? "Inventory adjustment (available)",
    })
  }

  if (deltaReserved !== 0) {
    moves.push({
      ts,
      entityType,
      itemId: itemId ?? null,
      productId: productId ?? null,
      warehouse,
      kind: deltaReserved > 0 ? "reserve" : "unreserve",
      qty: Math.abs(deltaReserved),
      refType,
      refId,
      note: note ?? "Inventory adjustment (reserved)",
    })
  }

  if (deltaInUse !== 0) {
    moves.push({
      ts,
      entityType,
      itemId: itemId ?? null,
      productId: productId ?? null,
      warehouse,
      kind: deltaInUse > 0 ? "consume" : "unconsume",
      qty: Math.abs(deltaInUse),
      refType,
      refId,
      note: note ?? "Inventory adjustment (inUse)",
    })
  }

  // Ensure stable IDs by ordering: available, reserved, inUse
  // Callers can assign IDs using nextMovementIds().
  return moves
}

export function nextMovementIds(
  movementRecords: { id: string }[],
  count: number
) {
  const ids: string[] = []
  const temp: { id: string }[] = [...movementRecords]
  for (let i = 0; i < count; i++) {
    const id = nextNumericId(temp)
    temp.push({ id })
    ids.push(id)
  }
  return ids
}

