export type DbSyncState = {
  resources: Record<string, string>
}

export type DbResource = "clients" | "items" | "products" | "inventory" | "orders"

export async function fetchDbSync(): Promise<DbSyncState> {
  const res = await fetch("/api/db-sync", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch db sync state")
  return res.json()
}

export function getResourceSyncToken(
  resources: Record<string, string>,
  keys: DbResource[],
) {
  return keys.map((key) => resources[key] ?? "").join(":")
}
