import type { SemanticColorKey } from "@/components/features/inventory/types"

import { ORDER_COLOR_FG } from "./orders-kpi-card"

const COLOR_BG: Record<SemanticColorKey, string> = {
  amber: "var(--color-amber-bg)",
  red: "var(--color-red-bg)",
  purple: "var(--color-purple-bg)",
  orange: "var(--color-orange-bg)",
  green: "var(--color-green-bg)",
  grey: "var(--color-grey-bg)",
  yellow: "var(--color-yellow-bg)",
  blue: "var(--color-blue-bg)",
}

export function StatusBadge({
  label,
  colorKey,
}: {
  label: string
  colorKey: SemanticColorKey
}) {
  return (
    <span
      className="neu-card-inset-sm inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] leading-snug font-semibold whitespace-nowrap"
      style={{
        background: COLOR_BG[colorKey],
        color: ORDER_COLOR_FG[colorKey],
      }}
    >
      <span
        className="size-[5px] shrink-0 rounded-full"
        style={{ background: ORDER_COLOR_FG[colorKey] }}
      />
      {label}
    </span>
  )
}
