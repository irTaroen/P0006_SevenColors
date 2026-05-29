"use client"

import * as React from "react"
import { createColumnHelper } from "@tanstack/react-table"
import { PackageIcon } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { EditableCell } from "@/components/data-table/editable-cell"
import { createResource, deleteResource, fetchResource, updateResource } from "@/lib/api"

type Component = { itemId: string; amount: number }

type Product = {
  id: string
  name: string
  components: Component[]
}

type Item = { id: string; name: string; unit: string }

const columnHelper = createColumnHelper<Product>()

const DEFAULT_PRODUCT: Omit<Product, "id"> = {
  name: "New Product",
  components: [],
}

export default function ProductsPage() {
  const [data, setData] = React.useState<Product[]>([])
  const [items, setItems] = React.useState<Item[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    Promise.all([
      fetchResource<Product>("products"),
      fetchResource<Item>("items"),
    ]).then(([products, itemList]) => {
      setData(products)
      setItems(itemList)
    }).finally(() => setIsLoading(false))
  }, [])

  const handleUpdate = React.useCallback(async (id: string, field: string, value: string) => {
    const updated = await updateResource<Product>("products", id, { [field]: value })
    setData((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)))
  }, [])

  const handleDelete = React.useCallback(async (id: string) => {
    await deleteResource("products", id)
    setData((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const handleAdd = React.useCallback(async () => {
    const created = await createResource<Product>("products", DEFAULT_PRODUCT)
    setData((prev) => [...prev, created])
  }, [])

  const resolveComponents = React.useCallback(
    (components: Component[]) => {
      if (!components?.length) return "—"
      return components
        .map((c) => {
          const item = items.find((i) => i.id === c.itemId)
          return `${item?.name ?? c.itemId} × ${c.amount}`
        })
        .join(", ")
    },
    [items],
  )

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
      columnHelper.accessor("components", {
        header: "Components",
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {resolveComponents(getValue())}
          </span>
        ),
      }),
    ],
    [handleUpdate, resolveComponents],
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-2">
        <PackageIcon className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold">Products</h1>
          <p className="text-xs text-muted-foreground">
            Each product is a combination of items. Click name to edit.
          </p>
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        onDelete={handleDelete}
        onAdd={handleAdd}
        addLabel="Add product"
      />
    </div>
  )
}
