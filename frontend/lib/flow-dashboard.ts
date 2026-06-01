import type { SemanticColorKey } from "@/components/features/inventory/types"
import {
  isOrderInMonth,
  resolveMonth,
  type OrderProduct,
} from "@/lib/orders-dashboard"
import { normalizeOrderStatus } from "@/lib/order-status"

export type FlowColorKey = SemanticColorKey | "cloudLight"

export type FlowOrder = {
  id: string
  clientId: string
  orderDate: string
  status: string
  type?: string
  sourceOrderId?: string
  products?: OrderProduct[]
}

export type FlowInventoryEntry = {
  type?: string
  itemId?: string | null
  productId?: string | null
  available?: number
  reserved?: number
  inUse?: number
}

export type FlowNode = {
  id: string
  label: string
  col: number
  colorKey: FlowColorKey
}

export type FlowLink = {
  source: string
  target: string
  value: number
}

export type FlowKpis = {
  unitsProcessed: number
  fulfillmentRate: number
  lossRate: number
}

export type FlowTrends = {
  unitsProcessed: number | null
  fulfillmentRate: number | null
  lossRate: number | null
}

export type FlowDashboardData = {
  nodes: FlowNode[]
  links: FlowLink[]
  kpis: FlowKpis
  trends: FlowTrends
  periodLabel: string
}

const FLOW_NODES: FlowNode[] = [
  { id: "raw_in", label: "Raw materials stock", col: 0, colorKey: "purple" },
  { id: "fin_in", label: "Finished product stock", col: 0, colorKey: "blue" },
  { id: "intake", label: "New intake", col: 0, colorKey: "cloudLight" },
  { id: "assembly", label: "Assembly", col: 1, colorKey: "purple" },
  { id: "direct", label: "Direct withdrawal", col: 1, colorKey: "blue" },
  { id: "expired", label: "Expired", col: 1, colorKey: "amber" },
  { id: "spilled", label: "Damaged / spilled", col: 1, colorKey: "orange" },
  { id: "shipped", label: "Shipped", col: 2, colorKey: "green" },
  { id: "cancelled", label: "Cancelled", col: 2, colorKey: "red" },
  { id: "wip", label: "WIP / reserve", col: 2, colorKey: "yellow" },
  { id: "delivered", label: "Delivered", col: 3, colorKey: "green" },
  { id: "returned", label: "Returned", col: 3, colorKey: "grey" },
  { id: "writeoff", label: "Write-off", col: 3, colorKey: "red" },
]

const PRODUCTION_STATUSES = new Set([
  "waiting_for_production",
  "in_progress",
  "produced",
])

const WIP_STATUSES = new Set([
  "approved",
  "waiting_for_production",
  "in_progress",
  "ready_for_shipping",
  "produced",
])

function sumOrderQuantities(order: FlowOrder) {
  return (order.products ?? []).reduce((sum, line) => sum + line.quantity, 0)
}

function orderUsesProduction(order: FlowOrder, internalOrders: FlowOrder[]) {
  const status = normalizeOrderStatus(order.status)
  if (PRODUCTION_STATUSES.has(status)) return true
  return internalOrders.some(
    (io) => io.sourceOrderId === order.id && io.type === "internal"
  )
}

function entryTotal(entry: FlowInventoryEntry) {
  return (entry.available ?? 0) + (entry.reserved ?? 0) + (entry.inUse ?? 0)
}

function inventoryItemTotal(entries: FlowInventoryEntry[]) {
  return entries
    .filter((e) => e.type === "item" || (!e.productId && e.itemId))
    .reduce((sum, e) => sum + entryTotal(e), 0)
}

function inventoryProductTotal(entries: FlowInventoryEntry[]) {
  return entries
    .filter((e) => e.type === "product" || !!e.productId)
    .reduce((sum, e) => sum + entryTotal(e), 0)
}

function splitProportional(total: number, parts: number[]): number[] {
  const sum = parts.reduce((a, b) => a + b, 0)
  if (total <= 0 || sum <= 0) return parts.map(() => 0)
  return parts.map((p) => (total * p) / sum)
}

function buildLinksFromTotals(totals: Record<string, number>): FlowLink[] {
  const assembly = totals.assembly ?? 0
  const direct = totals.direct ?? 0
  const expired = totals.expired ?? 0
  const spilled = totals.spilled ?? 0
  const shipped = totals.shipped ?? 0
  const cancelled = totals.cancelled ?? 0
  const wip = totals.wip ?? 0
  const delivered = totals.delivered ?? 0
  const returned = totals.returned ?? 0
  const writeoff = totals.writeoff ?? 0
  const rawIn = totals.raw_in ?? 0
  const finIn = totals.fin_in ?? 0
  const intake = totals.intake ?? 0

  const links: FlowLink[] = []

  const rawOut = splitProportional(rawIn, [assembly, expired, spilled])
  links.push(
    { source: "raw_in", target: "assembly", value: rawOut[0] },
    { source: "raw_in", target: "expired", value: rawOut[1] },
    { source: "raw_in", target: "spilled", value: rawOut[2] }
  )

  const finOut = splitProportional(finIn, [direct, expired, spilled])
  links.push(
    { source: "fin_in", target: "direct", value: finOut[0] },
    { source: "fin_in", target: "expired", value: finOut[1] },
    { source: "fin_in", target: "spilled", value: finOut[2] }
  )

  const intakeOut = splitProportional(intake, [direct, assembly])
  links.push(
    { source: "intake", target: "direct", value: intakeOut[0] },
    { source: "intake", target: "assembly", value: intakeOut[1] }
  )

  const assemblyOut = splitProportional(assembly, [shipped, wip])
  links.push(
    { source: "assembly", target: "shipped", value: assemblyOut[0] },
    { source: "assembly", target: "wip", value: assemblyOut[1] }
  )

  const directOut = splitProportional(direct, [shipped, cancelled, wip])
  links.push(
    { source: "direct", target: "shipped", value: directOut[0] },
    { source: "direct", target: "cancelled", value: directOut[1] },
    { source: "direct", target: "wip", value: directOut[2] }
  )

  const shippedOut = splitProportional(shipped, [delivered, returned])
  links.push(
    { source: "shipped", target: "delivered", value: shippedOut[0] },
    { source: "shipped", target: "returned", value: shippedOut[1] }
  )

  links.push({ source: "cancelled", target: "writeoff", value: cancelled })

  const wipOut = splitProportional(wip, [delivered, writeoff])
  links.push(
    { source: "wip", target: "delivered", value: wipOut[0] },
    { source: "wip", target: "writeoff", value: wipOut[1] }
  )

  const lossToWriteoff = expired + spilled
  const expiredOut = splitProportional(lossToWriteoff, [expired, spilled])
  links.push(
    { source: "expired", target: "writeoff", value: expiredOut[0] },
    { source: "spilled", target: "writeoff", value: expiredOut[1] }
  )

  return links.filter((l) => l.value > 0)
}

function computeNodeTotals(
  externalOrders: FlowOrder[],
  internalOrders: FlowOrder[],
  inventory: FlowInventoryEntry[]
) {
  let assembly = 0
  let direct = 0
  let shipped = 0
  let cancelled = 0
  let wip = 0
  let delivered = 0
  let returned = 0

  for (const order of externalOrders) {
    const qty = sumOrderQuantities(order)
    if (qty <= 0) continue

    const status = normalizeOrderStatus(order.status)

    if (status === "cancelled") {
      cancelled += qty
      direct += qty
      continue
    }
    if (status === "returned") {
      returned += qty
      shipped += qty
      continue
    }
    if (status === "delivered") {
      delivered += qty
    } else if (status === "shipped") {
      shipped += qty
    } else if (WIP_STATUSES.has(status)) {
      wip += qty
    }

    if (orderUsesProduction(order, internalOrders)) {
      assembly += qty
    } else if (status !== "new") {
      direct += qty
    }
  }

  const writeoff = cancelled
  const rawIn = inventoryItemTotal(inventory)
  const finIn = inventoryProductTotal(inventory)
  const intake = 0
  const expired = 0
  const spilled = 0

  // Scale sources to match processing inflow when order flow exists
  const processingIn = assembly + direct + expired + spilled
  const sourceTotal = rawIn + finIn + intake
  let scaledRaw = rawIn
  let scaledFin = finIn
  let scaledIntake = intake

  if (processingIn > 0 && sourceTotal > 0 && sourceTotal !== processingIn) {
    const factor = processingIn / sourceTotal
    scaledRaw = rawIn * factor
    scaledFin = finIn * factor
    scaledIntake = intake * factor
  } else if (processingIn > 0 && sourceTotal === 0) {
    scaledRaw = processingIn * 0.35
    scaledFin = processingIn * 0.65
  }

  return {
    raw_in: scaledRaw,
    fin_in: scaledFin,
    intake: scaledIntake,
    assembly,
    direct,
    expired,
    spilled,
    shipped,
    cancelled,
    wip,
    delivered,
    returned,
    writeoff,
  }
}

function computeKpis(links: FlowLink[]): FlowKpis {
  const sourceIds = new Set(["raw_in", "fin_in", "intake"])
  const unitsProcessed = links
    .filter((l) => sourceIds.has(l.source))
    .reduce((s, l) => s + l.value, 0)

  const delivered = links
    .filter((l) => l.target === "delivered")
    .reduce((s, l) => s + l.value, 0)

  const writeoff = links
    .filter((l) => l.target === "writeoff")
    .reduce((s, l) => s + l.value, 0)

  const fulfillmentRate =
    unitsProcessed > 0 ? (delivered / unitsProcessed) * 100 : 0
  const lossRate = unitsProcessed > 0 ? (writeoff / unitsProcessed) * 100 : 0

  return {
    unitsProcessed: Math.round(unitsProcessed),
    fulfillmentRate: Math.round(fulfillmentRate * 10) / 10,
    lossRate: Math.round(lossRate * 10) / 10,
  }
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

function filterExternalOrders(orders: FlowOrder[], clientId?: string | null) {
  return orders.filter((o) => {
    if (o.type === "internal") return false
    if (clientId && o.clientId !== clientId) return false
    return true
  })
}

function filterInternalOrders(orders: FlowOrder[], clientId?: string | null) {
  return orders.filter((o) => {
    if (o.type !== "internal") return false
    if (clientId && o.clientId !== clientId) return false
    return true
  })
}

function filterOrdersInPeriod(orders: FlowOrder[], periodOffset: number, now = new Date()) {
  const { month, yearNum } = resolveMonth(periodOffset, now)
  return orders.filter((o) => isOrderInMonth(o.orderDate, month, yearNum))
}

export function buildFlowDashboard(
  orders: FlowOrder[],
  inventory: FlowInventoryEntry[],
  periodOffset: number,
  clientId?: string | null,
  now = new Date()
): FlowDashboardData {
  const external = filterExternalOrders(orders, clientId)
  const internal = filterInternalOrders(orders, clientId)
  const periodExternal = filterOrdersInPeriod(external, periodOffset, now)
  const periodInternal = filterOrdersInPeriod(internal, periodOffset, now)

  const totals = computeNodeTotals(periodExternal, periodInternal, inventory)
  const links = buildLinksFromTotals(totals)
  const activeNodeIds = new Set<string>()
  for (const link of links) {
    activeNodeIds.add(link.source)
    activeNodeIds.add(link.target)
  }
  const nodes = FLOW_NODES.filter((n) => activeNodeIds.has(n.id))
  const kpis = computeKpis(links)

  const prevTotals = computeNodeTotals(
    filterOrdersInPeriod(external, periodOffset - 1, now),
    filterOrdersInPeriod(internal, periodOffset - 1, now),
    inventory
  )
  const prevLinks = buildLinksFromTotals(prevTotals)
  const prevKpis = computeKpis(prevLinks)

  const { label, year } = resolveMonth(periodOffset, now)

  return {
    nodes,
    links,
    kpis,
    trends: {
      unitsProcessed: pctChange(kpis.unitsProcessed, prevKpis.unitsProcessed),
      fulfillmentRate: pctChange(kpis.fulfillmentRate, prevKpis.fulfillmentRate),
      lossRate: pctChange(kpis.lossRate, prevKpis.lossRate),
    },
    periodLabel: `${label} ${year}`,
  }
}

export function formatFlowNumber(value: number) {
  return value.toLocaleString("en-US")
}

export const FLOW_COLUMN_HEADERS = [
  "Source",
  "Processing",
  "Fulfillment",
  "Outcome",
] as const

export const FLOW_LEGEND_ITEMS: { colorKey: FlowColorKey; label: string }[] = [
  { colorKey: "purple", label: "Raw materials / assembly" },
  { colorKey: "blue", label: "Finished product / direct withdrawal" },
  { colorKey: "cloudLight", label: "New intake" },
  { colorKey: "amber", label: "Expired" },
  { colorKey: "orange", label: "Damaged / spilled" },
  { colorKey: "green", label: "Shipped / delivered" },
  { colorKey: "yellow", label: "WIP / reserve" },
  { colorKey: "red", label: "Cancelled / write-off" },
  { colorKey: "grey", label: "Returned" },
]
