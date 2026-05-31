"use client"

import * as React from "react"
import { createColumnHelper } from "@tanstack/react-table"
import { ShoppingCartIcon } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { ExpandedDetailColumn } from "@/components/data-table/expanded-detail-column"
import { FormField } from "@/components/data-table/form-field"
import { LineItemsEditor } from "@/components/data-table/line-items-editor"
import { ResourceFormDialog } from "@/components/data-table/resource-form-dialog"
import { SelectField } from "@/components/data-table/select-field"
import { Input } from "@/components/ui/input"
import { createResource, deleteResource, fetchResource, updateResource } from "@/lib/api"
import { computeOrderTotalPrice, formatPrice } from "@/lib/pricing"

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
  totalPrice: number
  products: OrderProduct[]
}

type Client = { id: string; name: string }
type Product = { id: string; name: string; sellPrice: number }

type OrderForm = Omit<Order, "id">

const columnHelper = createColumnHelper<Order>()

const EMPTY_FORM: OrderForm = {
  clientId: "",
  date: new Date().toISOString().split("T")[0],
  status: "pending",
  totalPrice: 0,
  products: [],
}

const ORDERS_TABLE_COLGROUP = (
  <colgroup>
    <col className="w-8" />
    <col style={{ width: "16%" }} />
    <col style={{ width: "12%" }} />
    <col style={{ width: "14%" }} />
    <col />
    <col style={{ width: "6.5rem" }} />
    <col className="w-[72px]" />
  </colgroup>
)

function buildOrderExpandedCells(
  lines: OrderProduct[],
  products: Product[],
): (React.ReactNode | null)[] {
  if (!lines.length) {
    return [
      null,
      null,
      null,
      <p className="text-xs text-muted-foreground">No products on this order.</p>,
      null,
    ]
  }

  const rows = lines.map((line, index) => {
    const product = products.find((p) => p.id === line.productId)
    const linePrice = (product?.sellPrice ?? 0) * line.quantity
    return {
      key: `${line.productId}-${index}`,
      name: product?.name ?? line.productId,
      quantity: line.quantity,
      linePrice,
    }
  })

  return [
    null,
    null,
    <ExpandedDetailColumn key="qty" label="Quantity" align="right">
      {rows.map((row) => (
        <span key={row.key} className="text-xs tabular-nums text-muted-foreground">
          {row.quantity}
        </span>
      ))}
    </ExpandedDetailColumn>,
    <ExpandedDetailColumn key="product" label="Product">
      {rows.map((row) => (
        <span key={row.key} className="block min-w-0 truncate text-xs font-medium">
          {row.name}
        </span>
      ))}
    </ExpandedDetailColumn>,
    <ExpandedDetailColumn key="price" label="Line price" align="right">
      {rows.map((row) => (
        <span key={row.key} className="text-xs tabular-nums text-muted-foreground">
          {formatPrice(row.linePrice)}
        </span>
      ))}
    </ExpandedDetailColumn>,
  ]
}

export default function OrdersPage() {
  const [data, setData] = React.useState<Order[]>([])
  const [clients, setClients] = React.useState<Client[]>([])
  const [products, setProducts] = React.useState<Product[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<OrderForm>(EMPTY_FORM)
  const [isSaving, setIsSaving] = React.useState(false)

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

  const openCreate = () => {
    setEditingId(null)
    setForm({
      ...EMPTY_FORM,
      clientId: clients[0]?.id ?? "",
      date: new Date().toISOString().split("T")[0],
    })
    setDialogOpen(true)
  }

  const openEdit = (order: Order) => {
    setEditingId(order.id)
    setForm({
      clientId: order.clientId,
      date: order.date,
      status: order.status,
      products: order.products.map((p) => ({ ...p })),
      totalPrice: order.totalPrice,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        ...form,
        totalPrice: computeOrderTotalPrice(form.products, products),
      }
      if (editingId) {
        const updated = await updateResource<Order>("orders", editingId, payload)
        setData((prev) => prev.map((o) => (o.id === editingId ? { ...o, ...updated } : o)))
      } else {
        const created = await createResource<Order>("orders", payload)
        setData((prev) => [...prev, created])
      }
      setDialogOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = React.useCallback(async (id: string) => {
    await deleteResource("orders", id)
    setData((prev) => prev.filter((o) => o.id !== id))
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

  const productOptions = products.map((p) => ({ id: p.id, label: p.name }))

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
        cell: ({ getValue }) => getValue(),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => {
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
          <span
            className="block min-w-0 truncate text-xs text-muted-foreground"
            title={resolveProducts(getValue())}
          >
            {resolveProducts(getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("totalPrice", {
        header: () => <span className="block text-right">Total price</span>,
        cell: ({ row, getValue }) => (
          <span className="block text-right tabular-nums font-medium">
            {formatPrice(getValue() ?? computeOrderTotalPrice(row.original.products, products))}
          </span>
        ),
      }),
    ],
    [clients, resolveProducts, products],
  )

  const renderExpandedRowCells = React.useCallback(
    (order: Order) => buildOrderExpandedCells(order.products, products),
    [products],
  )

  const getOrderLabel = (order: Order) => {
    const client = clients.find((c) => c.id === order.clientId)
    return `Order for ${client?.name ?? order.clientId} (${order.date})`
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-2">
        <ShoppingCartIcon className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold">Orders</h1>
          <p className="text-xs text-muted-foreground">
            Customer orders. Click a row to expand its line items; use the edit icon to change details.
          </p>
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        onDelete={handleDelete}
        onAddClick={openCreate}
        onEdit={openEdit}
        addLabel="Add order"
        getRowLabel={getOrderLabel}
        colgroup={ORDERS_TABLE_COLGROUP}
        renderExpandedRowCells={renderExpandedRowCells}
      />

      <ResourceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingId ? "Edit order" : "Add order"}
        description={editingId ? "Update this order and save your changes." : "Fill in the details for the new order."}
        onSubmit={handleSave}
        submitLabel={editingId ? "Save changes" : "Create order"}
        isSubmitting={isSaving}
        className="sm:max-w-lg"
      >
        <FormField label="Client" htmlFor="order-client">
          <SelectField
            id="order-client"
            value={form.clientId}
            onChange={(clientId) => setForm((f) => ({ ...f, clientId }))}
            required
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </SelectField>
        </FormField>
        <FormField label="Date" htmlFor="order-date">
          <Input
            id="order-date"
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required
          />
        </FormField>
        <FormField label="Status" htmlFor="order-status">
          <SelectField
            id="order-status"
            value={form.status}
            onChange={(status) => setForm((f) => ({ ...f, status }))}
            required
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
        </FormField>
        <LineItemsEditor
          items={form.products}
          options={productOptions}
          getOptionId={(p) => p.productId}
          getQuantity={(p) => p.quantity}
          setOptionId={(index, productId) =>
            setForm((f) => ({
              ...f,
              products: f.products.map((p, i) => (i === index ? { ...p, productId } : p)),
            }))
          }
          setQuantity={(index, quantity) =>
            setForm((f) => ({
              ...f,
              products: f.products.map((p, i) => (i === index ? { ...p, quantity } : p)),
            }))
          }
          addItem={() =>
            setForm((f) => ({
              ...f,
              products: [
                ...f.products,
                { productId: products[0]?.id ?? "", quantity: 1 },
              ],
            }))
          }
          removeItem={(index) =>
            setForm((f) => ({
              ...f,
              products: f.products.filter((_, i) => i !== index),
            }))
          }
          optionLabel="Product"
          quantityLabel="Quantity"
        />
        <FormField label="Total price" htmlFor="order-total-price">
          <Input
            id="order-total-price"
            value={formatPrice(computeOrderTotalPrice(form.products, products))}
            readOnly
            className="tabular-nums bg-muted/40"
          />
        </FormField>
      </ResourceFormDialog>
    </div>
  )
}
