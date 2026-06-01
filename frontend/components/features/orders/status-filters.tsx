"use client"

import type { SemanticColorKey } from "@/components/features/inventory/types"
import type { OrderFilterKey } from "@/lib/orders-dashboard"
import { STATUS_FILTER_OPTIONS } from "@/lib/orders-dashboard"

import { ORDER_COLOR_FG } from "./orders-kpi-card"

export function StatusFilters({
  active,
  onChange,
  counts,
}: {
  active: OrderFilterKey
  onChange: (key: OrderFilterKey) => void
  counts: Record<string, number>
}) {
  return (
    <div className="neu-card-inset-sm flex flex-wrap gap-1.5 rounded-full p-1.5">
      {STATUS_FILTER_OPTIONS.map((f) => {
        const isActive = active === f.key
        const fg = f.colorKey ? ORDER_COLOR_FG[f.colorKey] : undefined
        const count = counts[f.key] ?? 0

        return (
          <button
            key={f.key}
            type="button"
            onClick={() => onChange(f.key)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-none px-3.5 py-1.5 text-xs whitespace-nowrap transition-all outline-none"
            style={{
              background: isActive ? "var(--color-bg)" : "transparent",
              boxShadow: isActive ? "var(--shadow-raised-sm)" : "none",
              color: isActive
                ? (fg ?? "var(--color-text-primary)")
                : "var(--color-text-secondary)",
              fontWeight: isActive ? 600 : 500,
            }}
          >
            {f.colorKey && (
              <span
                className="size-1.5 rounded-full"
                style={{ background: ORDER_COLOR_FG[f.colorKey as SemanticColorKey] }}
              />
            )}
            {f.label}
            <span
              className="text-[10px] font-semibold tabular-nums opacity-70"
              style={{
                color: isActive
                  ? (fg ?? "var(--color-text-tertiary)")
                  : "var(--color-text-tertiary)",
              }}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
