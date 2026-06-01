import type { SemanticColorKey } from "@/components/features/inventory/types"

const COLOR_FG: Record<SemanticColorKey, string> = {
  amber: "var(--color-amber-fg)",
  red: "var(--color-red-fg)",
  purple: "var(--color-purple-fg)",
  orange: "var(--color-orange-fg)",
  green: "var(--color-green-fg)",
  grey: "var(--color-grey-fg)",
  yellow: "var(--color-yellow-fg)",
  blue: "var(--color-blue-fg)",
}

export function OrdersKpiCard({
  label,
  value,
  highlightColor,
  pulse,
}: {
  label: string
  value: number | string
  highlightColor?: string
  pulse?: boolean
}) {
  return (
    <div className="neu-card rounded-[20px] px-[22px] py-[18px]">
      <div
        className="mb-2 flex items-center gap-1.5 text-[11px] font-medium"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {label}
        {pulse && (
          <span
            className="size-1.5 rounded-full"
            style={{
              background: highlightColor ?? "var(--color-amber-fg)",
              animation: "pulse-dot 2s ease-in-out infinite",
            }}
          />
        )}
      </div>
      <div
        className="text-[28px] leading-none font-bold tracking-[-0.5px] tabular-nums"
        style={{ color: highlightColor ?? "var(--color-text-primary)" }}
      >
        {value}
      </div>
    </div>
  )
}

export { COLOR_FG as ORDER_COLOR_FG }
