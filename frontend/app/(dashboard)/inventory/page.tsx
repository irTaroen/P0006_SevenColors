"use client"

import * as React from "react"
import { createColumnHelper } from "@tanstack/react-table"
import { ArchiveIcon } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { EditableCell } from "@/components/data-table/editable-cell"
import { createResource, deleteResource, fetchResource, updateResource } from "@/lib/api"

type InventoryEntry = {
  id: string
  itemId: string
  stock: number
  warehouse: string
}

type Item = { id: string; name: string; unit: string }

const columnHelper = createColumnHelper<InventoryEntry>()

const DEFAULT_ENTRY: Omit<InventoryEntry, "id"> = {
  itemId: "",
  stock: 0,
  warehouse: "Main Warehouse",
}

export default function InventoryPage() {
  const [data, setData] = React.useState<InventoryEntry[]>([])
  const [items, setItems] = React.useState<Item[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    Promise.all([
      fetchResource<InventoryEntry>("inventory"),
      fetchResource<Item>("items"),
    ]).then(([inventory, itemList]) => {
      setData(inventory)
      setItems(itemList)
    }).finally(() => setIsLoading(false))
  }, [])

  const handleUpdate = React.useCallback(async (id: string, field: string, value: string) => {
    const parsed = field === "stock" ? parseInt(value, 10) || 0 : value
    const updated = await updateResource<InventoryEntry>("inventory", id, { [field]: parsed })
    setData((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)))
  }, [])

  const handleDelete = React.useCallback(async (id: string) => {
    await deleteResource("inventory", id)
    setData((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const handleAdd = React.useCallback(async () => {
    const created = await createResource<InventoryEntry>("inventory", DEFAULT_ENTRY)
    setData((prev) => [...prev, created])
  }, [])

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("itemId", {
        header: "Item",
        cell: ({ getValue }) => {
          const item = items.find((i) => i.id === getValue())
          return (
            <span className="font-medium">
              {item?.name ?? getValue() ?? "—"}
            </span>
          )
        },
      }),
      columnHelper.accessor("stock", {
        header: "Stock",
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue()}
            type="number"
            onSave={(v) => handleUpdate(row.original.id, "stock", v)}
          />
        ),
      }),
      columnHelper.accessor("warehouse", {
        header: "Warehouse",
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue()}
            onSave={(v) => handleUpdate(row.original.id, "warehouse", v)}
          />
        ),
      }),
    ],
    [handleUpdate, items],
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-2">
        <ArchiveIcon className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold">Inventory</h1>
          <p className="text-xs text-muted-foreground">
            Stock levels per item. Click stock or warehouse to edit.
          </p>
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        onDelete={handleDelete}
        onAdd={handleAdd}
        addLabel="Add entry"
      />
    </div>
  )
}
