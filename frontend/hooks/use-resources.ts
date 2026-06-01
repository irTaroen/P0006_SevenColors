"use client"

import * as React from "react"

import { fetchResource } from "@/lib/api"
import type { DbResource } from "@/lib/db-sync"
import { useResourceSync } from "@/providers"

type ResourceLoaders<TResources extends Record<string, unknown[]>> = {
  [K in keyof TResources]: DbResource
}

export function useResources<TResources extends Record<string, unknown[]>>(
  loaders: ResourceLoaders<TResources>,
  options: { keepStaleOnError?: boolean } = {}
) {
  const entries = React.useMemo(
    () => Object.entries(loaders) as [keyof TResources, DbResource][],
    [loaders]
  )
  const keys = React.useMemo(() => entries.map(([key]) => key), [entries])
  const resources = React.useMemo(
    () => entries.map(([, resource]) => resource),
    [entries]
  )
  const syncToken = useResourceSync(...resources)
  const [data, setData] = React.useState<Partial<TResources>>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    let active = true
    Promise.all(entries.map(([, resource]) => fetchResource(resource)))
      .then((values) => {
        if (!active) return
        setError(null)
        setData(
          keys.reduce<Partial<TResources>>((next, key, index) => {
            next[key] = values[index] as TResources[typeof key]
            return next
          }, {})
        )
      })
      .catch((caught: unknown) => {
        if (!active) return
        setError(
          caught instanceof Error
            ? caught
            : new Error("Failed to load resources")
        )
        if (!options.keepStaleOnError) setData({})
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [entries, keys, options.keepStaleOnError, syncToken])

  return { data, isLoading, error }
}
