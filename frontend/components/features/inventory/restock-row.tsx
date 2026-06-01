import { AlertCircle } from "lucide-react"

import { formatInventoryNumber } from "@/lib/inventory-dashboard"
import { INVENTORY_STATUS_LABELS } from "@/lib/inventory-status"

import type { InventoryBarItem } from "./types"

export function RestockRow({ item }: { item: InventoryBarItem }) {
  const urgent = item.status === "out_of_stock"
  const fg = urgent ? "var(--color-red-fg)" : "var(--color-amber-fg)"
  const bg = urgent ? "var(--color-red-bg)" : "var(--color-amber-bg)"
  const statusLabel = INVENTORY_STATUS_LABELS[item.status]

  return (
    <div
      className="neu-card-sm grid items-center gap-3.5 rounded-[14px] px-4 py-3"
      style={{ gridTemplateColumns: "auto 1fr auto auto" }}
    >
      <div
        className="neu-card-inset-sm flex size-8 shrink-0 items-center justify-center rounded-[10px]"
        style={{ background: bg, color: fg }}
      >
        <AlertCircle size={16} strokeWidth={2.2} />
      </div>

      <div className="min-w-0">
        <div
          className="truncate text-xs leading-snug font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {item.name}
        </div>
        <div
          className="mt-0.5 text-[10px] leading-snug"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {item.catalogId} · {item.typeLabel}
        </div>
      </div>

      <div className="text-right">
        <div
          className="text-[13px] leading-none font-bold tabular-nums"
          style={{ color: fg }}
        >
          {formatInventoryNumber(item.available)}
          <span
            className="text-[10px] font-medium"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {" "}
            /{formatInventoryNumber(item.capacity)}
          </span>
        </div>
      </div>

      <div
        className="neu-card-inset-sm inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tabular-nums"
        style={{ background: bg, color: fg }}
      >
        <span
          className="size-1 rounded-full"
          style={{ background: fg }}
        />
        {statusLabel}
      </div>
    </div>
  )
}
