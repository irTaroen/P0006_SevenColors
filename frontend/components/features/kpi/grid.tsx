"use client"

import { useQuery } from "@tanstack/react-query"
import { useActiveClient } from "@/providers"
import { Loader2 } from "lucide-react"
import { KpiCard } from "./card"
import { fetchKpiData } from "./api"

type Props = {
  activeFilter: string | null
  onFilterChange: (column: string) => void
  rowCount?: number
  clientCount?: number
}

const KPI_CARDS = [
  { checkKey: "checkCompleet",       title: "Pending orders",             zeroText: "No pending orders",               dataKey: "incomplete"   as const },
  { checkKey: "checkGeaccordeerd",   title: "Orders in progress",         zeroText: "No orders in progress",           dataKey: "unapproved"   as const },
  { checkKey: "checkPayroll",        title: "Products without components", zeroText: "All products have components",    dataKey: "payroll"      as const },
  { checkKey: "checkWithinCapacity", title: "Out-of-stock items",         zeroText: "All items are in stock",          dataKey: "overcapacity" as const },
  { checkKey: "checkNietDubbel",     title: "Unused items",               zeroText: "All items are used in a product", dataKey: "double"       as const },
]

export function KpiSection({ activeFilter, onFilterChange, rowCount = 0, clientCount = 0 }: Props) {
  const { activeClientId } = useActiveClient()

  const { data, isPending, isError } = useQuery({
    queryKey: ["kpi-data", activeClientId],
    queryFn: () => fetchKpiData(activeClientId),
  })

  if (isError) {
    return (
      <p className="px-9 text-sm text-destructive">
        Failed to load KPI data. Make sure the JSON server is running on port 3001.
      </p>
    )
  }

  if (isPending) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Loader2 className="size-5 animate-spin" style={{ color: "var(--k-text-tertiary)" }} />
      </div>
    )
  }

  const activeCard = KPI_CARDS.find((c) => c.checkKey === activeFilter)

  return (
    <section className="pb-6">
      <div className="grid grid-cols-5 gap-4">
        {KPI_CARDS.map((card) => (
          <KpiCard
            key={card.checkKey}
            checkKey={card.checkKey}
            title={card.title}
            zeroText={card.zeroText}
            value={data?.[card.dataKey]?.total ?? 0}
            onClick={() => onFilterChange(card.checkKey)}
            isActive={activeFilter === card.checkKey}
          />
        ))}
      </div>

      {/* Status / filter bar */}
      <div
        style={{
          marginTop: 14,
          padding: "10px 18px",
          background: "var(--k-bg)",
          boxShadow: "var(--k-shadow-inset-sm)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 13,
          color: "var(--k-text-secondary)",
          minHeight: 48,
          transition: "all 0.2s ease",
        }}
      >
        {activeFilter && activeCard ? (
          <>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "var(--k-cloud-deep)",
                  boxShadow: "0 0 6px var(--k-cloud-mid)",
                  flexShrink: 0,
                }}
              />
              Filtered by:{" "}
              <b style={{ color: "var(--k-cloud-deep)", fontWeight: 500 }}>{activeCard.title}</b>
              <span style={{ color: "var(--k-text-tertiary)" }}>· {rowCount} results</span>
            </span>
            <button
              onClick={() => onFilterChange(activeFilter)}
              style={{
                background: "var(--k-bg)",
                boxShadow: "var(--k-shadow-raised-xs)",
                border: "none", outline: "none",
                padding: "4px 12px", borderRadius: 99,
                fontSize: 12, color: "var(--k-text-secondary)", cursor: "pointer",
              }}
            >
              Clear ✕
            </button>
          </>
        ) : (
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                background: "var(--k-green-fg)",
                boxShadow: "0 0 6px var(--k-green-fg)",
              }}
            />
            <b style={{ color: "var(--k-text-primary)", fontWeight: 500 }}>{clientCount}</b>{" "}clients
            <span style={{ color: "var(--k-text-tertiary)" }}>·</span>
            <b style={{ color: "var(--k-text-primary)", fontWeight: 500 }}>{rowCount}</b>{" "}orders
          </span>
        )}
      </div>
    </section>
  )
}
