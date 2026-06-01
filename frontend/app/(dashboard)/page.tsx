"use client"

import * as React from "react"
import { Layers, LayoutDashboardIcon, PackageOpen, Truck } from "lucide-react"

import { OverviewPageHeader } from "@/components/dashboard/page-header"
import { SummaryCard } from "@/components/features/inventory"
import { SankeyDiagram } from "@/components/features/flow"
import { PeriodToggle } from "@/components/features/orders/period-toggle"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchResource } from "@/lib/api"
import { buildPaintFlowDashboard } from "@/lib/paint-flow-dashboard"
import { useActiveClient, useResourceSync } from "@/providers"

type Order = {
  id: string
  clientId: string
  orderDate: string
  status: string
  type?: string
  products: { productId: string; quantity: number }[]
}
type Product = { id: string; name: string; components?: { itemId: string; amount: number }[] }
type Item = { id: string; name: string; supplier?: string }

export default function Page() {
  const { activeClientId } = useActiveClient()
  const [orders, setOrders] = React.useState<Order[]>([])
  const [products, setProducts] = React.useState<Product[]>([])
  const [items, setItems] = React.useState<Item[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [periodOffset, setPeriodOffset] = React.useState(0)
  const syncToken = useResourceSync("orders", "products", "items")

  React.useEffect(() => {
    Promise.all([
      fetchResource<Order>("orders"),
      fetchResource<Product>("products"),
      fetchResource<Item>("items"),
    ])
      .then(([orderList, productList, itemList]) => {
        setOrders(orderList)
        setProducts(productList)
        setItems(itemList)
      })
      .catch(() => {
        // Keep showing the last loaded data if a refresh fails.
      })
      .finally(() => setIsLoading(false))
  }, [syncToken])

  const flow = React.useMemo(
    () =>
      buildPaintFlowDashboard({
        orders,
        products,
        items,
        periodOffset,
        activeClientId,
      }),
    [orders, products, items, periodOffset, activeClientId]
  )

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <Skeleton className="h-20 w-full max-w-xl rounded-2xl" />
          <Skeleton className="h-10 w-64 rounded-full" />
        </div>
        <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-[92px] rounded-[20px]" />
          <Skeleton className="h-[92px] rounded-[20px]" />
          <Skeleton className="h-[92px] rounded-[20px]" />
        </div>
        <Skeleton className="min-h-0 flex-1 rounded-[22px]" />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 items-start justify-between gap-4">
        <OverviewPageHeader
          icon={LayoutDashboardIcon}
          title="Order"
          titleAccent="flow"
          descriptionClassName="hidden sm:block"
          description={
            <>
              Paint production and sales flow — how demand splits into ship-from-stock vs
              make-to-order, and converges on shipments. All values in product units for{" "}
              {flow.periodLabel}.
            </>
          }
        />
        <div className="animate-fade-up shrink-0">
          <PeriodToggle offset={periodOffset} onChange={setPeriodOffset} />
        </div>
      </div>

      <div className="shrink-0 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="animate-fade-up-d1">
          <SummaryCard
            Icon={Layers}
            label="Total demand"
            value={Math.round(flow.kpis.totalDemandUnits)}
            colorKey="blue"
          />
        </div>
        <div className="animate-fade-up-d2">
          <SummaryCard
            Icon={Truck}
            label="Ship-from-stock"
            value={Math.round(flow.kpis.shipFromStockUnits)}
            colorKey="green"
          />
        </div>
        <div className="animate-fade-up-d3">
          <SummaryCard
            Icon={PackageOpen}
            label="Make-to-order"
            value={Math.round(flow.kpis.makeToOrderUnits)}
            colorKey="amber"
          />
        </div>
      </div>

      <div className="animate-fade-up-d3 neu-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] p-4">
        <SankeyDiagram
          nodes={flow.nodes}
          links={flow.links}
          headers={flow.headers}
        />
      </div>
    </div>
  )
}
