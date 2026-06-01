"use client"

import * as React from "react"
import { createColumnHelper } from "@tanstack/react-table"
import { ShoppingCartIcon } from "lucide-react"

import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { DataTable } from "@/components/data-table/data-table"
import { ExpandedDetailColumn } from "@/components/data-table/expanded-detail-column"
import { FormField } from "@/components/data-table/form-field"
import { LineItemsEditor } from "@/components/forms/line-items-editor"
import { ResourceFormDialog } from "@/components/data-table/resource-form-dialog"
import { SelectField } from "@/components/forms/select-field"
import { Input } from "@/components/ui/input"
import { useLineItemsField } from "@/hooks/use-line-items-field"
import {
  createResource,
  deleteResource,
  fetchResource,
  updateResource,
} from "@/lib/api"
import { useResourceSync } from "@/providers"
import {
  getOrderStatusColor,
  getOrderStatusLabel,
  normalizeOrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
} from "@/lib/order-status"
import {
  getOrderTypeLabel,
  normalizeOrderType,
  ORDER_TYPE_LABELS,
  ORDER_TYPES,
  type OrderType,
} from "@/lib/order-type"
import {
  computeOrderTotalCost,
  computeOrderTotalPrice,
  formatPrice,
} from "@/lib/pricing"
import { getProductAvailableStock } from "@/lib/inventory-rows"
import type { InventoryEntry as InventoryRecord } from "@/lib/inventory-rows"
import { getProductsForClient } from "@/lib/product-catalog"
import {
  getProductionRequirementPreview,
  type ProductionRequirementPreview,
} from "@/lib/reserve-inventory"

type OrderProduct = { productId: string; quantity: number }

type Order = {
  id: string
  clientId: string
  orderDate: string
  productionDate: string
  deliveryDate: string
  status: string
  type: OrderType
  sourceOrderId?: string
  productionApplied?: boolean
  totalPrice: number
  products: OrderProduct[]
}

type Client = { id: string; name: string }
type Item = { id: string; name: string; unit: string; buyPrice: number }
type Product = {
  id: string
  name: string
  sellPrice: number
  unit: string
  clientId: string | null
  components: { itemId: string; amount: number }[]
}

type OrderForm = Omit<Order, "id">

const columnHelper = createColumnHelper<Order>()

const EMPTY_FORM: OrderForm = {
  clientId: "",
  orderDate: new Date().toISOString().split("T")[0],
  productionDate: "",
  deliveryDate: "",
  status: "new",
  type: "external",
  totalPrice: 0,
  products: [],
}

function formatOrderDate(value?: string) {
  return value?.trim() ? value : "—"
}

const ORDERS_TABLE_COLGROUP = (
  <colgroup>
    <col className="w-8" />
    <col style={{ width: "14%" }} />
    <col style={{ width: "10%" }} />
    <col style={{ width: "9%" }} />
    <col style={{ width: "9%" }} />
    <col style={{ width: "9%" }} />
    <col style={{ width: "12%" }} />
    <col />
    <col style={{ width: "6.5rem" }} />
    <col className="w-[72px]" />
  </colgroup>
)

function buildOrderExpandedCells(
  lines: OrderProduct[],
  products: Product[]
): (React.ReactNode | null)[] {
  if (!lines.length) {
    return [
      null,
      null,
      null,
      null,
      null,
      null,
      <p key="empty-order-products" className="text-xs text-muted-foreground">
        No products on this order.
      </p>,
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
    null,
    null,
    null,
    <ExpandedDetailColumn key="qty" label="Quantity" align="right">
      {rows.map((row) => (
        <span
          key={row.key}
          className="text-xs text-muted-foreground tabular-nums"
        >
          {row.quantity}
        </span>
      ))}
    </ExpandedDetailColumn>,
    <ExpandedDetailColumn key="product" label="Product">
      {rows.map((row) => (
        <span
          key={row.key}
          className="block min-w-0 truncate text-xs font-medium"
        >
          {row.name}
        </span>
      ))}
    </ExpandedDetailColumn>,
    <ExpandedDetailColumn key="price" label="Line price" align="right">
      {rows.map((row) => (
        <span
          key={row.key}
          className="text-xs text-muted-foreground tabular-nums"
        >
          {formatPrice(row.linePrice)}
        </span>
      ))}
    </ExpandedDetailColumn>,
  ]
}

function ProductionPreviewPanel({
  preview,
  getProductLabel,
  getProductUnit,
  getItemLabel,
  getItemUnit,
}: {
  preview: ProductionRequirementPreview
  getProductLabel: (productId: string) => string
  getProductUnit: (productId: string) => string | undefined
  getItemLabel: (itemId: string) => string
  getItemUnit: (itemId: string) => string | undefined
}) {
  if (!preview.hasProductShortages) return null

  return (
    <div className="neu-card-inset-sm rounded-2xl p-4 text-sm">
      <div className="mb-3">
        <p className="font-medium">Production required</p>
        <p className="text-xs text-muted-foreground">
          Finished product stock is short. These barrels need to be produced
          before the customer order can continue.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {preview.products
          .filter((requirement) => requirement.toProduce > 0)
          .map((requirement, index) => {
            const unit = getProductUnit(requirement.productId)
            return (
              <div
                key={`${requirement.productId}-${index}`}
                className="space-y-1"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">
                    {getProductLabel(requirement.productId)}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {requirement.available} / {requirement.required}
                    {unit ? ` ${unit}` : ""} in stock
                  </span>
                </div>
                <p className="text-xs text-destructive tabular-nums">
                  Produce {requirement.toProduce}
                  {unit ? ` ${unit}` : ""}.
                </p>
              </div>
            )
          })}
      </div>
      {preview.itemRequirements.length ? (
        <div className="mt-4 border-t border-border/60 pt-3">
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Raw materials needed
          </p>
          <div className="flex flex-col gap-2">
            {preview.itemRequirements.map((requirement) => {
              const unit = getItemUnit(requirement.itemId)
              const insufficient = requirement.available < requirement.required
              return (
                <div
                  key={requirement.itemId}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span>{getItemLabel(requirement.itemId)}</span>
                  <span
                    className={`tabular-nums ${
                      insufficient
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    Need {requirement.required}
                    {unit ? ` ${unit}` : ""}, have {requirement.available}
                    {unit ? ` ${unit}` : ""}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function OrdersPage() {
  const [data, setData] = React.useState<Order[]>([])
  const [clients, setClients] = React.useState<Client[]>([])
  const [products, setProducts] = React.useState<Product[]>([])
  const [items, setItems] = React.useState<Item[]>([])
  const [inventoryRecords, setInventoryRecords] = React.useState<
    Omit<InventoryRecord, "persisted">[]
  >([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<OrderForm>(EMPTY_FORM)
  const [isSaving, setIsSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const syncToken = useResourceSync(
    "orders",
    "clients",
    "products",
    "items",
    "inventory"
  )

  const refreshOrdersAndInventory = React.useCallback(async () => {
    const [orders, inventory] = await Promise.all([
      fetchResource<Order>("orders"),
      fetchResource<Omit<InventoryRecord, "persisted">>("inventory"),
    ])
    setData(orders)
    setInventoryRecords(inventory)
  }, [])

  React.useEffect(() => {
    Promise.all([
      fetchResource<Order>("orders"),
      fetchResource<Client>("clients"),
      fetchResource<Product>("products"),
      fetchResource<Item>("items"),
      fetchResource<Omit<InventoryRecord, "persisted">>("inventory"),
    ])
      .then(([orders, clientList, productList, itemList, inventory]) => {
        setData(orders)
        setClients(clientList)
        setProducts(productList)
        setItems(itemList)
        setInventoryRecords(inventory)
      })
      .catch(() => {
        // Keep showing the last loaded data if a refresh fails.
      })
      .finally(() => setIsLoading(false))
  }, [syncToken])

  const openCreate = () => {
    setEditingId(null)
    setSaveError(null)
    setForm({
      ...EMPTY_FORM,
      clientId: clients[0]?.id ?? "",
      orderDate: new Date().toISOString().split("T")[0],
    })
    setDialogOpen(true)
  }

  const openEdit = (order: Order) => {
    setEditingId(order.id)
    setSaveError(null)
    setForm({
      clientId: order.clientId,
      orderDate: order.orderDate,
      productionDate: order.productionDate ?? "",
      deliveryDate: order.deliveryDate ?? "",
      status: normalizeOrderStatus(order.status) as OrderForm["status"],
      type: normalizeOrderType(order.type),
      products: order.products.map((p) => ({ ...p })),
      totalPrice: order.totalPrice,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const payload = {
        ...form,
        totalPrice: computeOrderTotalPrice(form.products, products),
      }
      if (editingId) {
        await updateResource<Order>("orders", editingId, payload)
      } else {
        await createResource<Order>("orders", payload)
      }
      await refreshOrdersAndInventory()
      setDialogOpen(false)
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save order"
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = React.useCallback(
    async (id: string) => {
      await deleteResource("orders", id)
      await refreshOrdersAndInventory()
    },
    [refreshOrdersAndInventory]
  )

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
    [products]
  )

  const productOptions = React.useMemo(() => {
    const available = getProductsForClient(products, form.clientId)
    return available.map((p) => ({ id: p.id, label: p.name }))
  }, [products, form.clientId])

  const defaultProductId = productOptions[0]?.id ?? ""
  const setOrderProducts = React.useCallback(
    (updater: (products: OrderProduct[]) => OrderProduct[]) => {
      setForm((f) => ({ ...f, products: updater(f.products) }))
    },
    []
  )
  const orderProductLines = useLineItemsField(
    form.products,
    setOrderProducts,
    React.useCallback(
      () => ({ productId: defaultProductId, quantity: 1 }),
      [defaultProductId]
    )
  )

  const sanitizeOrderProducts = React.useCallback(
    (lines: OrderProduct[], clientId: string) => {
      const available = getProductsForClient(products, clientId)
      const allowedIds = new Set(available.map((p) => p.id))
      const fallbackId = available[0]?.id ?? ""

      return lines
        .map((line) =>
          allowedIds.has(line.productId)
            ? line
            : fallbackId
              ? { ...line, productId: fallbackId }
              : null
        )
        .filter((line): line is OrderProduct => line !== null)
    },
    [products]
  )

  const getProductStock = React.useCallback(
    (productId: string) => {
      if (!productId) return null
      const product = products.find((p) => p.id === productId)
      return {
        available: getProductAvailableStock(inventoryRecords, productId),
        unit: product?.unit,
      }
    },
    [inventoryRecords, products]
  )

  const productionPreview = React.useMemo(() => {
    if (form.type !== "external" || !form.products.length) return null

    try {
      return getProductionRequirementPreview(
        form.products,
        products,
        inventoryRecords
      )
    } catch {
      return null
    }
  }, [form.products, form.type, inventoryRecords, products])

  const getItemLabel = React.useCallback(
    (itemId: string) =>
      items.find((item) => item.id === itemId)?.name ?? itemId,
    [items]
  )

  const getItemUnit = React.useCallback(
    (itemId: string) => items.find((item) => item.id === itemId)?.unit,
    [items]
  )

  const getProductLabel = React.useCallback(
    (productId: string) =>
      products.find((product) => product.id === productId)?.name ?? productId,
    [products]
  )

  const getProductUnit = React.useCallback(
    (productId: string) =>
      products.find((product) => product.id === productId)?.unit,
    [products]
  )

  const orderTotalSell = React.useMemo(
    () => computeOrderTotalPrice(form.products, products),
    [form.products, products]
  )

  const orderTotalCost = React.useMemo(
    () => computeOrderTotalCost(form.products, products, items),
    [form.products, products, items]
  )

  const orderTotalProfit = orderTotalSell - orderTotalCost

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("clientId", {
        header: "Client",
        meta: {
          filterText: (row) =>
            clients.find((c) => c.id === row.clientId)?.name ??
            row.clientId ??
            "",
        },
        cell: ({ getValue }) => {
          const client = clients.find((c) => c.id === getValue())
          return (
            <span className="font-medium">
              {client?.name ?? getValue() ?? "—"}
            </span>
          )
        },
      }),
      columnHelper.accessor("type", {
        header: "Type",
        meta: {
          filterText: (row) => getOrderTypeLabel(row.type),
        },
        cell: ({ getValue }) => (
          <span className="text-xs font-medium capitalize">
            {getOrderTypeLabel(getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("orderDate", {
        header: "Order date",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground tabular-nums">
            {formatOrderDate(getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("productionDate", {
        header: "Production date",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground tabular-nums">
            {formatOrderDate(getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("deliveryDate", {
        header: "Delivery date",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground tabular-nums">
            {formatOrderDate(getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        meta: {
          filterText: (row) => getOrderStatusLabel(row.status),
        },
        cell: ({ getValue }) => {
          const status = getValue()
          return (
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getOrderStatusColor(status)}`}
            >
              {getOrderStatusLabel(status)}
            </span>
          )
        },
      }),
      columnHelper.accessor("products", {
        header: "Products",
        meta: {
          filterText: (row) => resolveProducts(row.products),
        },
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
        meta: {
          filterText: (row) => {
            const total =
              row.totalPrice ?? computeOrderTotalPrice(row.products, products)
            return `${formatPrice(total)} ${total}`
          },
        },
        cell: ({ row, getValue }) => (
          <span className="block text-right font-medium tabular-nums">
            {formatPrice(
              getValue() ??
                computeOrderTotalPrice(row.original.products, products)
            )}
          </span>
        ),
      }),
    ],
    [clients, resolveProducts, products]
  )

  const renderExpandedRowCells = React.useCallback(
    (order: Order) => buildOrderExpandedCells(order.products, products),
    [products]
  )

  const getOrderLabel = (order: Order) => {
    const client = clients.find((c) => c.id === order.clientId)
    return `Order for ${client?.name ?? order.clientId} (${formatOrderDate(order.orderDate)})`
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <DashboardPageHeader
        icon={ShoppingCartIcon}
        title="Orders"
        description="Customer orders. Click a row to expand its line items; use the edit icon to change details."
      />

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
        description={
          editingId
            ? "Update this order and save your changes."
            : "Fill in the details for the new order."
        }
        onSubmit={handleSave}
        submitLabel={editingId ? "Save changes" : "Create order"}
        isSubmitting={isSaving}
        className="sm:max-w-2xl"
      >
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Client" htmlFor="order-client">
            <SelectField
              id="order-client"
              value={form.clientId}
              onChange={(clientId) =>
                setForm((f) => ({
                  ...f,
                  clientId,
                  products: sanitizeOrderProducts(f.products, clientId),
                }))
              }
              required
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </SelectField>
          </FormField>
          <FormField label="Type" htmlFor="order-type">
            <SelectField
              id="order-type"
              value={form.type}
              onChange={(type) =>
                setForm((f) => ({ ...f, type: normalizeOrderType(type) }))
              }
              required
            >
              {ORDER_TYPES.map((value) => (
                <option key={value} value={value}>
                  {ORDER_TYPE_LABELS[value]}
                </option>
              ))}
            </SelectField>
          </FormField>
          <FormField label="Status" htmlFor="order-status">
            <SelectField
              id="order-status"
              value={form.status}
              onChange={(status) => setForm((f) => ({ ...f, status }))}
              required
            >
              {ORDER_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {ORDER_STATUS_LABELS[value]}
                </option>
              ))}
            </SelectField>
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Order date" htmlFor="order-date">
            <Input
              id="order-date"
              type="date"
              value={form.orderDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, orderDate: e.target.value }))
              }
              required
            />
          </FormField>
          <FormField label="Production date" htmlFor="order-production-date">
            <Input
              id="order-production-date"
              type="date"
              value={form.productionDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, productionDate: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Delivery date" htmlFor="order-delivery-date">
            <Input
              id="order-delivery-date"
              type="date"
              value={form.deliveryDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, deliveryDate: e.target.value }))
              }
            />
          </FormField>
        </div>
        <LineItemsEditor
          items={form.products}
          options={productOptions}
          getOptionId={(p) => p.productId}
          getQuantity={(p) => p.quantity}
          setOptionId={(index, productId) =>
            orderProductLines.setLine(index, (product) => ({
              ...product,
              productId,
            }))
          }
          setQuantity={(index, quantity) =>
            orderProductLines.setLine(index, (product) => ({
              ...product,
              quantity,
            }))
          }
          addItem={orderProductLines.addItem}
          removeItem={orderProductLines.removeItem}
          optionLabel="Product"
          quantityLabel="Quantity"
          getAvailableStock={getProductStock}
        />
        {productionPreview ? (
          <ProductionPreviewPanel
            preview={productionPreview}
            getProductLabel={getProductLabel}
            getProductUnit={getProductUnit}
            getItemLabel={getItemLabel}
            getItemUnit={getItemUnit}
          />
        ) : null}
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Total costs" htmlFor="order-total-cost">
            <Input
              id="order-total-cost"
              value={formatPrice(orderTotalCost)}
              readOnly
              className="bg-muted/40 tabular-nums"
            />
          </FormField>
          <FormField label="Total sales" htmlFor="order-total-sell">
            <Input
              id="order-total-sell"
              value={formatPrice(orderTotalSell)}
              readOnly
              className="bg-muted/40 tabular-nums"
            />
          </FormField>
          <FormField label="Profit" htmlFor="order-total-profit">
            <Input
              id="order-total-profit"
              value={formatPrice(orderTotalProfit)}
              readOnly
              className="bg-muted/40 tabular-nums"
            />
          </FormField>
        </div>
        {saveError ? (
          <p className="text-sm text-destructive">{saveError}</p>
        ) : null}
      </ResourceFormDialog>
    </div>
  )
}
