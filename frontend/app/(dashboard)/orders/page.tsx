"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { ConfirmDeleteDialog } from "@/components/data-table/confirm-delete-dialog"
import {
  OrdersKpiCard,
  OrdersPanel,
  PeriodToggle,
  StatusFilters,
} from "@/components/features/orders"
import { ProductionPreviewPanel } from "@/components/features/orders/production-preview-panel"
import { FormField } from "@/components/data-table/form-field"
import { LineItemsEditor } from "@/components/forms/line-items-editor"
import { ResourceFormDialog } from "@/components/data-table/resource-form-dialog"
import { SelectField } from "@/components/forms/select-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useLineItemsField } from "@/hooks/use-line-items-field"
import {
  createResource,
  deleteResource,
  fetchResource,
  updateResource,
} from "@/lib/api"
import { getProductAvailableStock } from "@/lib/inventory-rows"
import type { InventoryEntry as InventoryRecord } from "@/lib/inventory-rows"
import {
  buildOrderViews,
  computeOrderKpis,
  filterOrdersByColumns,
  filterOrdersByPeriod,
  filterOrdersByStatus,
  formatOrderCurrency,
  formatOrderDisplayDate,
  getFilterCounts,
  sortOrders,
  type Order,
  type OrderFilterKey,
  type OrderSortColumn,
  type OrderSortDirection,
  type OrderView,
} from "@/lib/orders-dashboard"
import {
  normalizeOrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
} from "@/lib/order-status"
import {
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
import { getProductsForClient } from "@/lib/product-catalog"
import { getProductionRequirementPreview } from "@/lib/reserve-inventory"
import { useResourceSync } from "@/providers"

type OrderProduct = { productId: string; quantity: number }

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
  const [deleteTarget, setDeleteTarget] = React.useState<OrderView | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const [openRows, setOpenRows] = React.useState<Set<string>>(new Set())
  const [activeFilter, setActiveFilter] = React.useState<OrderFilterKey>("all")
  const [periodOffset, setPeriodOffset] = React.useState(0)
  const [columnFilters, setColumnFilters] = React.useState({
    order: "",
    client: "",
  })
  const [sortColumn, setSortColumn] = React.useState<OrderSortColumn | null>(
    null
  )
  const [sortDirection, setSortDirection] =
    React.useState<OrderSortDirection | null>(null)

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

  const orderViews = React.useMemo(
    () => buildOrderViews(data, clients, products, inventoryRecords),
    [data, clients, products, inventoryRecords]
  )

  const periodOrders = React.useMemo(
    () => filterOrdersByPeriod(orderViews, periodOffset),
    [orderViews, periodOffset]
  )

  const kpis = React.useMemo(
    () => computeOrderKpis(periodOrders),
    [periodOrders]
  )

  const filterCounts = React.useMemo(
    () => getFilterCounts(periodOrders),
    [periodOrders]
  )

  const visibleOrders = React.useMemo(() => {
    let result = filterOrdersByStatus(periodOrders, activeFilter)
    result = filterOrdersByColumns(result, columnFilters)
    return sortOrders(result, sortColumn, sortDirection)
  }, [periodOrders, activeFilter, columnFilters, sortColumn, sortDirection])

  const handleSort = (col: OrderSortColumn) => {
    if (sortColumn !== col) {
      setSortColumn(col)
      setSortDirection("asc")
    } else if (sortDirection === "asc") {
      setSortDirection("desc")
    } else {
      setSortColumn(null)
      setSortDirection(null)
    }
  }

  const toggleRow = (id: string) => {
    setOpenRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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

  const openEdit = (order: OrderView) => {
    setEditingId(order.id)
    setSaveError(null)
    setForm({
      clientId: order.order.clientId,
      orderDate: order.order.orderDate,
      productionDate: order.order.productionDate ?? "",
      deliveryDate: order.order.deliveryDate ?? "",
      status: normalizeOrderStatus(order.order.status) as OrderForm["status"],
      type: normalizeOrderType(order.order.type),
      products: order.order.products.map((p) => ({ ...p })),
      totalPrice: order.order.totalPrice,
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

  const getOrderLabel = (order: OrderView) =>
    `Order ${order.id} for ${order.clientName} (${formatOrderDisplayDate(order.orderDate)})`

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    await deleteResource("orders", deleteTarget.id)
    await refreshOrdersAndInventory()
    setDeletingId(null)
    setDeleteTarget(null)
    setOpenRows((prev) => {
      const next = new Set(prev)
      next.delete(deleteTarget.id)
      return next
    })
  }

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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-20 w-full max-w-xl rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-[88px] rounded-[20px]" />
          <Skeleton className="h-[88px] rounded-[20px]" />
          <Skeleton className="h-[88px] rounded-[20px]" />
          <Skeleton className="h-[88px] rounded-[20px]" />
        </div>
        <Skeleton className="h-[420px] rounded-[22px]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-fade-up">
        <h2
          className="mb-1.5 text-[28px] font-bold tracking-[-0.6px]"
          style={{ color: "var(--color-text-primary)" }}
        >
          Orders{" "}
          <span
            className="italic"
            style={{ color: "var(--color-cloud-deep)" }}
          >
            overview
          </span>
        </h2>
        <p
          className="max-w-2xl text-[13px] leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Click an order to expand line items. Orders with stock shortages or
          pending approval need manual attention.
        </p>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="animate-fade-up-d1">
          <OrdersKpiCard label="Total orders" value={kpis.totalOrders} />
        </div>
        <div className="animate-fade-up-d1">
          <OrdersKpiCard
            label="Pending approval"
            value={kpis.pendingCount}
            highlightColor={
              kpis.pendingCount > 0 ? "var(--color-amber-fg)" : undefined
            }
            pulse={kpis.pendingCount > 0}
          />
        </div>
        <div className="animate-fade-up-d2">
          <OrdersKpiCard
            label="Insufficient stock"
            value={kpis.blockedCount}
            highlightColor={
              kpis.blockedCount > 0 ? "var(--color-red-fg)" : undefined
            }
            pulse={kpis.blockedCount > 0}
          />
        </div>
        <div className="animate-fade-up-d2">
          <OrdersKpiCard
            label="Approved value"
            value={formatOrderCurrency(kpis.approvedValue)}
          />
        </div>
      </div>

      <div className="animate-fade-up-d2">
        <StatusFilters
          active={activeFilter}
          onChange={setActiveFilter}
          counts={filterCounts}
        />
      </div>

      <div className="animate-fade-up-d3 flex flex-wrap items-center justify-start gap-3">
        <PeriodToggle offset={periodOffset} onChange={setPeriodOffset} />
        <Button variant="neu" onClick={openCreate}>
          <PlusIcon />
          Add order
        </Button>
      </div>

      <div className="animate-fade-up-d3">
        <OrdersPanel
          orders={visibleOrders}
          openRows={openRows}
          onToggleRow={toggleRow}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          deletingId={deletingId}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />
      </div>

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        itemName={deleteTarget ? getOrderLabel(deleteTarget) : undefined}
        onConfirm={handleConfirmDelete}
        isDeleting={deletingId !== null}
      />

      <p
        className="mx-auto max-w-xl text-center text-[11px] leading-relaxed"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        Click a row to show order lines. Blocked orders highlight which products
        are short on stock.
      </p>

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
