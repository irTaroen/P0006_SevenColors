import type { FlowColorKey, FlowLink, FlowNode } from "@/lib/flow-dashboard"
import { resolveMonth } from "@/lib/orders-dashboard"

type Order = {
  id: string
  clientId: string
  orderDate: string
  status: string
  type?: string
  products: { productId: string; quantity: number }[]
}

type Item = { id: string; name: string; supplier?: string }
type Product = {
  id: string
  name: string
  components?: { itemId: string; amount: number }[]
}

export type PaintFlowKpis = {
  totalDemandUnits: number
  shipFromStockUnits: number
  makeToOrderUnits: number
}

export type PaintFlowDashboard = {
  nodes: FlowNode[]
  links: FlowLink[]
  headers: string[]
  kpis: PaintFlowKpis
  periodLabel: string
}

function isOrderInMonth(orderDate: string, month: number, year: number) {
  if (!orderDate?.trim()) return false
  const parsed = new Date(`${orderDate}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return false
  return parsed.getMonth() === month && parsed.getFullYear() === year
}

function orderLineDemand(order: Order) {
  return (order.products ?? []).reduce((sum, line) => sum + (line.quantity ?? 0), 0)
}

function requiresProduction(status: string) {
  return (
    status === "waiting_for_production" ||
    status === "in_progress" ||
    status === "produced"
  )
}

function topN<T>(arr: T[], n: number, score: (t: T) => number) {
  return [...arr].sort((a, b) => score(b) - score(a)).slice(0, n)
}

export function buildPaintFlowDashboard({
  orders,
  products,
  items,
  periodOffset,
  activeClientId,
  now = new Date(),
}: {
  orders: Order[]
  products: Product[]
  items: Item[]
  periodOffset: number
  activeClientId?: string | null
  now?: Date
}): PaintFlowDashboard {
  const { month, yearNum, label, year } = resolveMonth(periodOffset, now)

  const periodOrders = (orders ?? []).filter((o) => {
    if (activeClientId && o.clientId !== activeClientId) return false
    return isOrderInMonth(o.orderDate, month, yearNum)
  })

  const scopedOrders = periodOrders.filter((o) => o.type !== "internal")
  const internalOrders = periodOrders.filter((o) => o.type === "internal")
  const productById = new Map((products ?? []).map((p) => [p.id, p]))
  const itemById = new Map((items ?? []).map((i) => [i.id, i]))

  const demandByProduct = new Map<string, number>()
  let totalDemandUnits = 0
  let shipFromStockUnits = 0
  let makeToOrderUnits = 0

  for (const order of scopedOrders) {
    const qty = orderLineDemand(order)
    totalDemandUnits += qty

    const mto = requiresProduction(order.status)
    if (mto) makeToOrderUnits += qty
    else shipFromStockUnits += qty

    for (const line of order.products ?? []) {
      demandByProduct.set(
        line.productId,
        (demandByProduct.get(line.productId) ?? 0) + (line.quantity ?? 0)
      )
    }
  }

  // Allocate produced units across BOM items so Raw->Production stays in "product units".
  // This keeps the Sankey width consistent across stages, while still showing which items
  // contributed to production.
  const allocatedRawUnitsByItem = new Map<string, number>()
  for (const order of internalOrders) {
    for (const line of order.products ?? []) {
      const producedUnits = line.quantity ?? 0
      if (producedUnits <= 0) continue
      const product = productById.get(line.productId)
      const components = product?.components ?? []
      const totalAmount = components.reduce((s, c) => s + (c.amount ?? 0), 0)
      if (!totalAmount) continue

      for (const c of components) {
        const share = (c.amount ?? 0) / totalAmount
        if (!Number.isFinite(share) || share <= 0) continue
        allocatedRawUnitsByItem.set(
          c.itemId,
          (allocatedRawUnitsByItem.get(c.itemId) ?? 0) + producedUnits * share
        )
      }
    }
  }

  // Nodes
  const headers = [
    "Raw materials",
    "Production",
    "Finished goods",
    "Fulfillment path",
    "Shipments",
  ]

  const topRawItems = topN(
    Array.from(allocatedRawUnitsByItem.entries()),
    6,
    ([, v]) => v
  ).map(([itemId]) => itemId)

  const topProducts = topN(
    (products ?? []).filter((p) => demandByProduct.has(p.id)),
    6,
    (p) => demandByProduct.get(p.id) ?? 0
  )

  const nodes: FlowNode[] = [
    ...topRawItems.map((itemId) => {
      const item = itemById.get(itemId)
      return {
        id: `item:${itemId}`,
        label: item?.name ?? itemId,
        col: 0,
        colorKey: "purple" as FlowColorKey,
      }
    }),
    { id: "production", label: "Production", col: 1, colorKey: "purple" },
    ...topProducts.map((p) => ({
      id: `product:${p.id}`,
      label: p.name ?? p.id,
      col: 2,
      colorKey: "blue" as FlowColorKey,
    })),
    {
      id: "ship_from_stock",
      label: "Ship-from-stock",
      col: 3,
      colorKey: "green" as FlowColorKey,
    },
    {
      id: "make_to_order",
      label: "Make-to-order",
      col: 3,
      colorKey: "amber" as FlowColorKey,
    },
    { id: "shipments", label: "Shipments", col: 4, colorKey: "green" },
  ]

  const links: FlowLink[] = []

  // Raw materials -> production: derived from internal production BOM allocation
  for (const itemId of topRawItems) {
    const value = allocatedRawUnitsByItem.get(itemId) ?? 0
    if (value > 0) {
      links.push({ source: `item:${itemId}`, target: "production", value })
    }
  }

  // Production -> finished goods (top products), proportional to demand
  const mtoByProduct = new Map<string, number>()
  for (const order of scopedOrders) {
    if (!requiresProduction(order.status)) continue
    for (const line of order.products ?? []) {
      mtoByProduct.set(
        line.productId,
        (mtoByProduct.get(line.productId) ?? 0) + (line.quantity ?? 0)
      )
    }
  }

  // Include internal production orders so they appear in the flow.
  for (const order of internalOrders) {
    for (const line of order.products ?? []) {
      mtoByProduct.set(
        line.productId,
        (mtoByProduct.get(line.productId) ?? 0) + (line.quantity ?? 0)
      )
    }
  }

  for (const p of topProducts) {
    const qty = mtoByProduct.get(p.id) ?? 0
    if (qty > 0) links.push({ source: "production", target: `product:${p.id}`, value: qty })
  }

  // Finished goods -> ship-from-stock (stock demand) + make-to-order path
  const stockByProduct = new Map<string, number>()
  for (const order of scopedOrders) {
    if (requiresProduction(order.status)) continue
    for (const line of order.products ?? []) {
      stockByProduct.set(
        line.productId,
        (stockByProduct.get(line.productId) ?? 0) + (line.quantity ?? 0)
      )
    }
  }

  for (const p of topProducts) {
    const stockQty = stockByProduct.get(p.id) ?? 0
    const mtoQty = mtoByProduct.get(p.id) ?? 0
    if (stockQty > 0) {
      links.push({ source: `product:${p.id}`, target: "ship_from_stock", value: stockQty })
    }
    if (mtoQty > 0) {
      links.push({ source: `product:${p.id}`, target: "make_to_order", value: mtoQty })
    }
  }

  // Fulfillment paths -> shipments
  if (shipFromStockUnits > 0) {
    links.push({
      source: "ship_from_stock",
      target: "shipments",
      value: shipFromStockUnits,
    })
  }
  if (makeToOrderUnits > 0) {
    links.push({
      source: "make_to_order",
      target: "shipments",
      value: makeToOrderUnits,
    })
  }

  const activeIds = new Set<string>()
  for (const l of links) {
    if (l.value > 0) {
      activeIds.add(l.source)
      activeIds.add(l.target)
    }
  }

  return {
    headers,
    nodes: nodes.filter((n) => activeIds.has(n.id)),
    links: links.filter((l) => l.value > 0),
    kpis: { totalDemandUnits, shipFromStockUnits, makeToOrderUnits },
    periodLabel: `${label} ${year}`,
  }
}

