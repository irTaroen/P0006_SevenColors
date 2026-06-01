"use client"

import * as React from "react"

import {
  createResource,
  deleteResource,
  fetchResource,
  updateResource,
} from "@/lib/api"
import { useResourceSync } from "@/providers"
import type { DbResource } from "@/lib/db-sync"

type UseResourceCrudOptions<TEntity extends { id: string }, TForm> = {
  resource: DbResource
  emptyForm: TForm
  toForm: (entity: TEntity) => TForm
  toPayload?: (form: TForm) => Omit<TEntity, "id">
}

export function useResourceCrud<TEntity extends { id: string }, TForm>({
  resource,
  emptyForm,
  toForm,
  toPayload = (form) => form as unknown as Omit<TEntity, "id">,
}: UseResourceCrudOptions<TEntity, TForm>) {
  const [data, setData] = React.useState<TEntity[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<TForm>(emptyForm)
  const [isSaving, setIsSaving] = React.useState(false)
  const syncToken = useResourceSync(resource)

  React.useEffect(() => {
    let active = true
    fetchResource<TEntity>(resource)
      .then((rows) => {
        if (active) setData(rows)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [resource, syncToken])

  const openCreate = React.useCallback(() => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }, [emptyForm])

  const openEdit = React.useCallback(
    (entity: TEntity) => {
      setEditingId(entity.id)
      setForm(toForm(entity))
      setDialogOpen(true)
    },
    [toForm]
  )

  const handleSave = React.useCallback(async () => {
    setIsSaving(true)
    try {
      const payload = toPayload(form)
      if (editingId) {
        const updated = await updateResource<TEntity>(
          resource,
          editingId,
          payload as Partial<TEntity>
        )
        setData((prev) =>
          prev.map((entry) =>
            entry.id === editingId ? { ...entry, ...updated } : entry
          )
        )
      } else {
        const created = await createResource<TEntity>(resource, payload)
        setData((prev) => [...prev, created])
      }
      setDialogOpen(false)
    } finally {
      setIsSaving(false)
    }
  }, [editingId, form, resource, toPayload])

  const handleDelete = React.useCallback(
    async (id: string) => {
      await deleteResource(resource, id)
      setData((prev) => prev.filter((entry) => entry.id !== id))
    },
    [resource]
  )

  return {
    data,
    isLoading,
    dialogOpen,
    setDialogOpen,
    editingId,
    form,
    setForm,
    isSaving,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
  }
}
