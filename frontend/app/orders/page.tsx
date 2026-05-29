"use client"

import * as React from "react"
import { createColumnHelper } from "@tanstack/react-table"
import { ShoppingCartIcon } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { EditableCell } from "@/components/data-table/editable-cell"
import { createResource, deleteResource, fetchResource, updateResource } from "@/lib/api"

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  delivered: "Delivered",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
}

type OrderProduct = { productId: string; quantity: number }

type Order = {
  id: string
  clientId: string
  date: string
  status: string
  products: OrderProduct[]
}

type Client = { id: string; name: string }
type Product = { id: string; name: string }

const columnHelper = createColumnHelper<Order>()

const DEFAULT_ORDER: Omit<Order, "id"> = {
  clientId: "",
  date: new Date().toISOString().split("T")[0],
  status: "pending",
  products: [],
}

export default function OrdersPage() {
  const [data, setData] = React.useState<Order[]>([])
  const [clients, setClients] = React.useState<Client[]>([])
  const [products, setProducts] = React.useState<Product[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    Promise.all([
      fetchResource<Order>("orders"),
      fetchResource<Client>("clients"),
      fetchResource<Product>("products"),
    ]).then(([orders, clientList, productList]) => {
      setData(orders)
      setClients(clientList)
      setProducts(productList)
    }).finally(() => setIsLoading(false))
  }, [])

  const handleUpdate = React.useCallback(async (id: string, field: string, value: string) => {
    const updated = await updateResource<Order>("orders", id, { [field]: value })
    setData((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)))
  }, [])

  const handleDelete = React.useCallback(async (id: string) => {
    await deleteResource("orders", id)
    setData((prev) => prev.filter((o) => o.id !== id))
  }, [])

  const handleAdd = React.useCallback(async () => {
    const created = await createResource<Order>("orders", DEFAULT_ORDER)
    setData((prev) => [...prev, created])
  }, [])

  const resolveProducts = React.useCallback(
    (orderProducts: OrderProduct[]) => {
      if (!orderProducts?.length) return "—"
      return orderProducts
        .map((op) => {
          const p = products.find((x) => x.id === op.productId)
          return `${p?.name ?? op.productId} ×${op.quantity}`
        })
        .join(", ")
    },
    [products],
  )

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("clientId", {
        header: "Client",
        cell: ({ getValue }) => {
          const client = clients.find((c) => c.id === getValue())
          return <span className="font-medium">{client?.name ?? getValue() ?? "—"}</span>
        },
      }),
      columnHelper.accessor("date", {
        header: "Date",
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue()}
            type="date"
            onSave={(v) => handleUpdate(row.original.id, "date", v)}
          />
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row, getValue }) => {
          const status = getValue()
          return (
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? "bg-muted text-muted-foreground"}`}
            >
              {STATUS_LABELS[status] ?? status}
            </span>
          )
        },
      }),
      columnHelper.accessor("products", {
        header: "Products",
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {resolveProducts(getValue())}
          </span>
        ),
      }),
    ],
    [handleUpdate, clients, resolveProducts],
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-2">
        <ShoppingCartIcon className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold">Orders</h1>
          <p className="text-xs text-muted-foreground">Click date to edit.</p>
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        onDelete={handleDelete}
        onAdd={handleAdd}
        addLabel="Add order"
      />
    </div>
  )
}
