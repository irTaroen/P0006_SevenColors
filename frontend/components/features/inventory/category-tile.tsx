import { Check, AlertTriangle, type LucideIcon } from "lucide-react"

import { formatInventoryNumber, maxCapacityInGroup } from "@/lib/inventory-dashboard"

import { HorizontalBar } from "./horizontal-bar"
import { MiniStat } from "./mini-stat"
import type { InventoryBarItem, SemanticColorKey } from "./types"

const ACCENT_FG: Record<SemanticColorKey, string> = {
  amber: "var(--color-amber-fg)",
  red: "var(--color-red-fg)",
  purple: "var(--color-purple-fg)",
  orange: "var(--color-orange-fg)",
  green: "var(--color-green-fg)",
  grey: "var(--color-grey-fg)",
  yellow: "var(--color-yellow-fg)",
  blue: "var(--color-blue-fg)",
}

const ACCENT_BG: Record<SemanticColorKey, string> = {
  amber: "var(--color-amber-bg)",
  red: "var(--color-red-bg)",
  purple: "var(--color-purple-bg)",
  orange: "var(--color-orange-bg)",
  green: "var(--color-green-bg)",
  grey: "var(--color-grey-bg)",
  yellow: "var(--color-yellow-bg)",
  blue: "var(--color-blue-bg)",
}

export function CategoryTile({
  title,
  Icon,
  accentKey,
  items,
  onItemClick,
}: {
  title: string
  Icon: LucideIcon
  accentKey: SemanticColorKey
  items: InventoryBarItem[]
  onItemClick?: (item: InventoryBarItem) => void
}) {
  const maxCapacity = maxCapacityInGroup(items)
  const lowCount = items.filter(
    (it) => it.status === "low" || it.status === "out_of_stock"
  ).length

  const totalAvailable = items.reduce((s, it) => s + it.available, 0)
  const totalReserved = items.reduce((s, it) => s + it.reserved, 0)
  const totalCapacity = items.reduce((s, it) => s + it.capacity, 0)
  const tileUtilization =
    totalCapacity > 0
      ? Math.round(((totalAvailable + totalReserved) / totalCapacity) * 100)
      : 0

  return (
    <div className="neu-card flex h-full flex-col gap-3.5 rounded-[22px] px-6 py-[22px]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="neu-card-inset-sm flex size-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: ACCENT_BG[accentKey],
              color: ACCENT_FG[accentKey],
            }}
          >
            <Icon size={18} strokeWidth={2} />
          </div>
          <div>
            <div
              className="text-[10px] font-semibold tracking-wide uppercase"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Inventory
            </div>
            <h3
              className="text-lg leading-tight font-bold tracking-[-0.3px]"
              style={{ color: "var(--color-text-primary)" }}
            >
              {title}
            </h3>
          </div>
        </div>

        {lowCount > 0 ? (
          <div
            className="neu-card-inset-sm inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold whitespace-nowrap"
            style={{
              background: "var(--color-red-bg)",
              color: "var(--color-red-fg)",
            }}
          >
            <AlertTriangle size={11} strokeWidth={2.4} />
            {lowCount} low
          </div>
        ) : (
          <div
            className="neu-card-inset-sm inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold whitespace-nowrap"
            style={{
              background: "var(--color-green-bg)",
              color: "var(--color-green-fg)",
            }}
          >
            <Check size={11} strokeWidth={2.4} />
            On track
          </div>
        )}
      </div>

      <div className="neu-card-inset-sm grid grid-cols-3 gap-2 rounded-xl px-3.5 py-2.5">
        <MiniStat label="Items" value={items.length} />
        <MiniStat
          label="Units"
          value={formatInventoryNumber(totalAvailable + totalReserved)}
        />
        <MiniStat label="Utilization" value={`${tileUtilization}%`} />
      </div>

      <div
        className="grid items-center gap-3 px-1 pb-1 text-[10px] font-semibold tracking-wide uppercase"
        style={{
          gridTemplateColumns: "70px minmax(0,1.6fr) minmax(0,2.4fr) 84px 24px",
          color: "var(--color-text-tertiary)",
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        <span>ID</span>
        <span>Product</span>
        <span>Breakdown</span>
        <span className="text-right">Stock</span>
        <span />
      </div>

      <div className="flex flex-1 flex-col gap-0.5">
        {items.length === 0 ? (
          <div
            className="py-8 text-center text-xs"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            No items in this category.
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id}
              style={{
                borderBottom:
                  idx < items.length - 1
                    ? "1px solid var(--color-divider)"
                    : "none",
              }}
            >
              <HorizontalBar
                item={item}
                maxCapacity={maxCapacity}
                onClick={() => onItemClick?.(item)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
