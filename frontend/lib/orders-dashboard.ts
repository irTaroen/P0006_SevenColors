import type { SemanticColorKey } from "@/components/features/inventory/types"
import {
  getOrderStatusLabel,
  normalizeOrderStatus,
  ORDER_STATUSES,
} from "@/lib/order-status"
import { getProductAvailableStock } from "@/lib/inventory-rows"
import type { InventoryEntry } from "@/lib/inventory-rows"
import { computeOrderTotalPrice, formatPrice } from "@/lib/pricing"

export type OrderProduct = { productId: string; quantity: number }

export type Order = {
  id: string
  clientId: string
  orderDate: string
  productionDate: string
  deliveryDate: string
  status: string
  type: string
  totalPrice: number
  products: OrderProduct[]
}

export type Client = { id: string; name: string }
export type Product = {
  id: string
  name: string
  sellPrice: number
  unit?: string
}

export type OrderLineView = {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
  stockAvailable: number
  stockOk: boolean
  shortage: number
}

export type OrderView = {
  id: string
  clientId: string
  clientName: string
  orderDate: string
  deliveryDate: string
  status: string
  displayStatus: string
  displayStatusLabel: string
  displayStatusColor: SemanticColorKey
  hasStockShortage: boolean
  itemCount: number
  total: number
  lines: OrderLineView[]
  order: Order
}

export type OrderFilterKey =
  | "all"
  | "stock_blocked"
  | (typeof ORDER_STATUSES)[number]

export type OrderSortColumn =
  | "order"
  | "client"
  | "placed"
  | "delivery"
  | "items"
  | "total"
  | "status"

export type OrderSortDirection = "asc" | "desc"

export type OrderKpis = {
  totalOrders: number
  pendingCount: number
  blockedCount: number
  approvedValue: number
}

export const IN_PROGRESS_STATUSES = [
  "in_progress",
  "waiting_for_production",
  "ready_for_shipping",
  "produced",
] as const

export const APPROVED_PIPELINE_STATUSES = [
  "approved",
  ...IN_PROGRESS_STATUSES,
  "shipped",
  "delivered",
] as const

const STATUS_COLORS: Record<string, SemanticColorKey> = {
  new: "amber",
  approved: "green",
  waiting_for_production: "amber",
  in_progress: "blue",
  ready_for_shipping: "blue",
  produced: "purple",
  shipped: "purple",
  delivered: "grey",
  cancelled: "red",
  returned: "orange",
}

export function getStatusColorKey(status: string): SemanticColorKey {
  const key = normalizeOrderStatus(status)
  return STATUS_COLORS[key] ?? "grey"
}

export function formatOrderDisplayDate(value?: string) {
  if (!value?.trim()) return "—"
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function resolveMonth(offset: number, now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  return {
    label: d.toLocaleDateString("en-US", { month: "long" }),
    year: d.getFullYear(),
    month: d.getMonth(),
    yearNum: d.getFullYear(),
  }
}

export function isOrderInMonth(orderDate: string, month: number, year: number) {
  if (!orderDate?.trim()) return false
  const parsed = new Date(`${orderDate}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return false
  return parsed.getMonth() === month && parsed.getFullYear() === year
}

function buildLineView(
  line: OrderProduct,
  products: Product[],
  inventory: Omit<InventoryEntry, "persisted">[]
): OrderLineView {
  const product = products.find((p) => p.id === line.productId)
  const available = getProductAvailableStock(inventory, line.productId)
  const shortage = Math.max(0, line.quantity - available)
  const unitPrice = product?.sellPrice ?? 0

  return {
    productId: line.productId,
    name: product?.name ?? line.productId,
    quantity: line.quantity,
    unitPrice,
    lineTotal: unitPrice * line.quantity,
    stockAvailable: available,
    stockOk: shortage === 0,
    shortage,
  }
}

export function buildOrderView(
  order: Order,
  clients: Client[],
  products: Product[],
  inventory: Omit<InventoryEntry, "persisted">[]
): OrderView {
  const client = clients.find((c) => c.id === order.clientId)
  const lines = (order.products ?? []).map((line) =>
    buildLineView(line, products, inventory)
  )
  const hasStockShortage = lines.some((line) => !line.stockOk)
  const normalizedStatus = normalizeOrderStatus(order.status)
  const showStockBlocked =
    hasStockShortage &&
    (normalizedStatus === "new" || normalizedStatus === "approved")

  const displayStatus = showStockBlocked ? "stock_blocked" : normalizedStatus
  const displayStatusLabel = showStockBlocked
    ? "Insufficient stock"
    : getOrderStatusLabel(normalizedStatus)
  const displayStatusColor: SemanticColorKey = showStockBlocked
    ? "red"
    : getStatusColorKey(normalizedStatus)

  const total =
    order.totalPrice ?? computeOrderTotalPrice(order.products ?? [], products)

  return {
    id: order.id,
    clientId: order.clientId,
    clientName: client?.name ?? order.clientId ?? "—",
    orderDate: order.orderDate,
    deliveryDate: order.deliveryDate,
    status: normalizedStatus,
    displayStatus,
    displayStatusLabel,
    displayStatusColor,
    hasStockShortage,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    total,
    lines,
    order,
  }
}

export function buildOrderViews(
  orders: Order[],
  clients: Client[],
  products: Product[],
  inventory: Omit<InventoryEntry, "persisted">[]
): OrderView[] {
  return orders.map((order) =>
    buildOrderView(order, clients, products, inventory)
  )
}

export function computeOrderKpis(orders: OrderView[]): OrderKpis {
  const pendingCount = orders.filter((o) => o.status === "new").length
  const blockedCount = orders.filter((o) => o.hasStockShortage).length
  const approvedValue = orders
    .filter((o) =>
      APPROVED_PIPELINE_STATUSES.includes(
        o.status as (typeof APPROVED_PIPELINE_STATUSES)[number]
      )
    )
    .reduce((sum, o) => sum + o.total, 0)

  return {
    totalOrders: orders.length,
    pendingCount,
    blockedCount,
    approvedValue,
  }
}

export function getFilterCounts(orders: OrderView[]): Record<string, number> {
  const counts: Record<string, number> = { all: orders.length, stock_blocked: 0 }
  for (const status of ORDER_STATUSES) {
    counts[status] = 0
  }
  for (const order of orders) {
    if (order.hasStockShortage) counts.stock_blocked += 1
    if (counts[order.status] !== undefined) counts[order.status] += 1
  }
  return counts
}

export function filterOrdersByStatus(
  orders: OrderView[],
  filter: OrderFilterKey
): OrderView[] {
  if (filter === "all") return orders
  if (filter === "stock_blocked") {
    return orders.filter((o) => o.hasStockShortage)
  }
  return orders.filter((o) => o.status === filter)
}

export function filterOrdersByPeriod(
  orders: OrderView[],
  periodOffset: number,
  now = new Date()
) {
  const { month, yearNum } = resolveMonth(periodOffset, now)
  return orders.filter((o) => isOrderInMonth(o.orderDate, month, yearNum))
}

export function filterOrdersByColumns(
  orders: OrderView[],
  filters: { order: string; client: string }
) {
  const orderQ = filters.order.trim().toLowerCase()
  const clientQ = filters.client.trim().toLowerCase()

  return orders.filter((o) => {
    if (orderQ && !o.id.toLowerCase().includes(orderQ)) return false
    if (
      clientQ &&
      !o.clientName.toLowerCase().includes(clientQ) &&
      !o.clientId.toLowerCase().includes(clientQ)
    ) {
      return false
    }
    return true
  })
}

function sortKey(order: OrderView, column: OrderSortColumn): string | number {
  switch (column) {
    case "order":
      return order.id
    case "client":
      return order.clientName.toLowerCase()
    case "placed":
      return order.orderDate || ""
    case "delivery":
      return order.deliveryDate || ""
    case "items":
      return order.itemCount
    case "total":
      return order.total
    case "status":
      return order.displayStatus
    default:
      return 0
  }
}

export function sortOrders(
  orders: OrderView[],
  column: OrderSortColumn | null,
  direction: OrderSortDirection | null
) {
  if (!column || !direction) return orders
  return [...orders].sort((a, b) => {
    const av = sortKey(a, column)
    const bv = sortKey(b, column)
    if (av < bv) return direction === "asc" ? -1 : 1
    if (av > bv) return direction === "asc" ? 1 : -1
    return 0
  })
}

export function formatOrderCurrency(value: number) {
  return formatPrice(value)
}

export { formatPrice }

export const STATUS_FILTER_OPTIONS: {
  key: OrderFilterKey
  label: string
  colorKey?: SemanticColorKey
}[] = [
  { key: "all", label: "All" },
  { key: "new", label: "Pending approval", colorKey: "amber" },
  { key: "stock_blocked", label: "Insufficient stock", colorKey: "red" },
  { key: "approved", label: "Approved", colorKey: "green" },
  { key: "in_progress", label: "In progress", colorKey: "blue" },
  { key: "waiting_for_production", label: "Waiting for production", colorKey: "amber" },
  { key: "ready_for_shipping", label: "Ready for shipping", colorKey: "blue" },
  { key: "produced", label: "Produced", colorKey: "purple" },
  { key: "shipped", label: "Shipped", colorKey: "purple" },
  { key: "delivered", label: "Delivered", colorKey: "grey" },
]
