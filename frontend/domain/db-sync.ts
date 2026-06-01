import { createHash } from "node:crypto"

export type DbSyncState = {
  resources: Record<string, string>
}

export type DbResource =
  | "clients"
  | "items"
  | "products"
  | "inventory"
  | "inventory_movements"
  | "orders"

export function hashResource(value: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
    .slice(0, 12)
}

export function computeDbSyncState(data: Record<string, unknown>): DbSyncState {
  const resources: Record<string, string> = {}

  for (const [key, value] of Object.entries(data)) {
    if (key === "$schema") continue
    resources[key] = hashResource(value)
  }

  return { resources }
}
