import type { DbResource, DbSyncState } from "@/domain/db-sync"

export type { DbResource, DbSyncState }

export async function fetchDbSync(): Promise<DbSyncState> {
  const res = await fetch("/api/db-sync", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch db sync state")
  return res.json()
}
