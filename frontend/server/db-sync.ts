import { createHash } from "node:crypto"
import { watch } from "chokidar"

import type { Low } from "lowdb"

export type DbSyncState = {
  resources: Record<string, string>
}

type DbObserver = {
  onReadEnd: (data: Record<string, unknown> | null) => void
  onWriteStart: () => void
  onWriteEnd: () => void
}

function hashResource(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 12)
}

export function computeDbSyncState(data: Record<string, unknown>): DbSyncState {
  const resources: Record<string, string> = {}

  for (const [key, value] of Object.entries(data)) {
    if (key === "$schema") continue
    resources[key] = hashResource(value)
  }

  return { resources }
}

export function registerDbSync(
  app: import("@tinyhttp/app").App,
  db: Low<Record<string, unknown>>,
  observer: DbObserver,
  dbFile: string,
) {
  let syncState = computeDbSyncState(db.data)

  const refreshSyncState = () => {
    syncState = computeDbSyncState(db.data)
  }

  const previousOnReadEnd = observer.onReadEnd
  observer.onReadEnd = (data) => {
    previousOnReadEnd(data)
    if (data) refreshSyncState()
  }

  let writing = false
  const previousOnWriteStart = observer.onWriteStart
  const previousOnWriteEnd = observer.onWriteEnd

  observer.onWriteStart = () => {
    previousOnWriteStart()
    writing = true
  }

  observer.onWriteEnd = () => {
    previousOnWriteEnd()
    writing = false
    refreshSyncState()
  }

  if (process.env.NODE_ENV !== "production") {
    watch(dbFile).on("change", () => {
      if (writing) return

      db.read().catch((error) => {
        if (error instanceof SyntaxError) {
          console.error(`Error parsing ${dbFile}: ${error.message}`)
          return
        }
        console.error(error)
      })
    })
  }

  app.get("/db-sync", (_req, res) => {
    res.json(syncState)
  })
}
