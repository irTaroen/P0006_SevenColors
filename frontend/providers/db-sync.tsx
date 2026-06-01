"use client"

import * as React from "react"

import { fetchDbSync, type DbResource } from "@/lib/db-sync"

type DbSyncContextValue = {
  resources: Record<string, string>
}

const DbSyncContext = React.createContext<DbSyncContextValue>({ resources: {} })

const POLL_INTERVAL_MS = 2000

export function DbSyncProvider({ children }: { children: React.ReactNode }) {
  const [resources, setResources] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    let active = true

    const poll = async () => {
      try {
        const state = await fetchDbSync()
        if (!active) return
        setResources(state.resources)
      } catch {
        // API may still be starting
      }
    }

    poll()
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  return (
    <DbSyncContext.Provider value={{ resources }}>{children}</DbSyncContext.Provider>
  )
}

export function useResourceSync(...keys: DbResource[]) {
  const { resources } = React.useContext(DbSyncContext)
  return keys.map((key) => resources[key] ?? "").join(":")
}
