import Link from "next/link"
import { AlertCircle, ArrowRight, ShoppingCart } from "lucide-react"

import type { InventoryBarItem } from "./types"
import { RestockRow } from "./restock-row"

export function RestockPanel({ items }: { items: InventoryBarItem[] }) {
  if (items.length === 0) return null

  return (
    <div className="neu-card animate-fade-up-d4 flex flex-col gap-3.5 rounded-[22px] px-6 py-[22px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="neu-card-inset-sm flex size-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: "var(--color-red-bg)",
              color: "var(--color-red-fg)",
            }}
          >
            <AlertCircle size={18} strokeWidth={2.2} />
          </div>
          <div>
            <div
              className="text-[10px] font-semibold tracking-wide uppercase"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Restock needed
            </div>
            <h3
              className="text-lg font-bold tracking-[-0.3px]"
              style={{ color: "var(--color-text-primary)" }}
            >
              Low inventory
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div
            className="neu-card-inset-sm inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold"
            style={{
              background: "var(--color-red-bg)",
              color: "var(--color-red-fg)",
            }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{
                background: "var(--color-red-fg)",
                animation: "pulse-dot 2s ease-in-out infinite",
              }}
            />
            {items.length} {items.length === 1 ? "item" : "items"}
          </div>

          <Link
            href="/orders"
            className="neu-button inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold no-underline"
          >
            <ShoppingCart size={13} strokeWidth={2} />
            Place orders
            <ArrowRight size={13} strokeWidth={2} />
          </Link>
        </div>
      </div>

      <div
        className="pl-1 text-[11px] leading-normal"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        Items are flagged when available stock is at or below the configured
        minimum.{" "}
        <span style={{ color: "var(--color-red-fg)", fontWeight: 600 }}>
          Out of stock
        </span>{" "}
        items need immediate attention.
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-2.5">
        {items.map((item) => (
          <RestockRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
