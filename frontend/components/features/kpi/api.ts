import { API_BASE } from "@/lib/api"

export type KpiCount = { total: number }

export type KpiData = {
  incomplete: KpiCount    // pending orders
  unapproved: KpiCount    // in-progress orders
  payroll: KpiCount       // products with no components
  overcapacity: KpiCount  // inventory entries with zero stock
  double: KpiCount        // items not used in any product
}

type Order     = { id: string; clientId: string; status: string; products: unknown[] }
type Product   = { id: string; components: { itemId: string }[] }
type Item      = { id: string }
type Inventory = { id: string; stock: number }

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
    incomplete:   { total: scopedOrders.filter((o) => o.status === "pending").length },
    unapproved:   { total: scopedOrders.filter((o) => o.status === "in_progress").length },
    payroll:      { total: products.filter((p) => !p.components?.length).length },
    overcapacity: { total: inventory.filter((e) => e.stock === 0).length },
    double:       { total: items.filter((i) => !usedItemIds.has(i.id)).length },
  }
}
