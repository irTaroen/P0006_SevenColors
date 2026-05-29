"use client"

import * as React from "react"
import { createColumnHelper } from "@tanstack/react-table"
import { BoxIcon } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { EditableCell } from "@/components/data-table/editable-cell"
import { createResource, deleteResource, fetchResource, updateResource } from "@/lib/api"

type Item = {
  id: string
  name: string
  unit: string
  unitPrice: number
}

const columnHelper = createColumnHelper<Item>()

const DEFAULT_ITEM: Omit<Item, "id"> = {
  name: "New Item",
  unit: "pcs",
  unitPrice: 0,
}

export default function ItemsPage() {
  const [data, setData] = React.useState<Item[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    fetchResource<Item>("items")
      .then(setData)
      .finally(() => setIsLoading(false))
  }, [])

  const handleUpdate = React.useCallback(async (id: string, field: string, value: string) => {
    const parsed = field === "unitPrice" ? parseFloat(value) || 0 : value
    const updated = await updateResource<Item>("items", id, { [field]: parsed })
    setData((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)))
  }, [])

  const handleDelete = React.useCallback(async (id: string) => {
    await deleteResource("items", id)
    setData((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const handleAdd = React.useCallback(async () => {
    const created = await createResource<Item>("items", DEFAULT_ITEM)
    setData((prev) => [...prev, created])
  }, [])

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue()}
            onSave={(v) => handleUpdate(row.original.id, "name", v)}
          />
        ),
      }),
      columnHelper.accessor("unit", {
        header: "Unit",
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue()}
            onSave={(v) => handleUpdate(row.original.id, "unit", v)}
          />
        ),
      }),
      columnHelper.accessor("unitPrice", {
        header: "Unit Price",
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue()}
            type="number"
            onSave={(v) => handleUpdate(row.original.id, "unitPrice", v)}
          />
        ),
      }),
    ],
    [handleUpdate],
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-2">
        <BoxIcon className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold">Items</h1>
          <p className="text-xs text-muted-foreground">Click any cell to edit in place.</p>
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        onDelete={handleDelete}
        onAdd={handleAdd}
        addLabel="Add item"
      />
    </div>
  )
}
