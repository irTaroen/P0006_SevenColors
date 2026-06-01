"use client"

import * as React from "react"

export function useEntityLookup<TEntity extends { id: string }>(
  entities: TEntity[]
) {
  const byId = React.useMemo(
    () => new Map(entities.map((entity) => [entity.id, entity])),
    [entities]
  )

  return React.useCallback(
    (id: string | null | undefined) => {
      return id ? byId.get(id) : undefined
    },
    [byId]
  )
}
