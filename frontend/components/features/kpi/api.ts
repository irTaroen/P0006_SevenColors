import { API_BASE } from "@/lib/api"

export type KpiCount = { total: number }

export type KpiData = {
  totalOrders:    KpiCount  // all orders in scope
  totalProducing: KpiCount  // orders currently in progress
  totalInventory: KpiCount  // inventory entries with stock > 0
  totalSpill:     KpiCount  // items not used in any product
}

type Order     = { id: string; clientId: string; status: string; products: unknown[] }
type Product   = { id: string; components: { itemId: string }[] }
type Item      = { id: string }
type Inventory = { id: string; available: number }

export async function fetchKpiData(clientId?: string | null): Promise<KpiData> {
  const [orders, products, items, inventory] = await Promise.all([
    fetch(`${API_BASE}/orders`).then<Order[]>((r) => r.json()),
    fetch(`${API_BASE}/products`).then<Product[]>((r) => r.json()),
    fetch(`${API_BASE}/items`).then<Item[]>((r) => r.json()),
    fetch(`${API_BASE}/inventory`).then<Inventory[]>((r) => r.json()),
  ])

  const scopedOrders = clientId
    ? orders.filter((o) => o.clientId === clientId)
    : orders

  const usedItemIds = new Set(
    products.flatMap((p) => (p.components ?? []).map((c) => c.itemId)),
  )

  return {
    totalOrders:    { total: scopedOrders.length },
    totalProducing: { total: scopedOrders.filter((o) => o.status === "in_progress").length },
    totalInventory: { total: inventory.filter((e) => (e.available ?? 0) > 0).length },
    totalSpill:     { total: items.filter((i) => !usedItemIds.has(i.id)).length },
  }
}
