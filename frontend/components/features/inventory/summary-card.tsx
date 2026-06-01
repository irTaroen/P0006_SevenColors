import type { LucideIcon } from "lucide-react"

import type { SemanticColorKey } from "./types"

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

export function SummaryCard({
  Icon,
  label,
  value,
  suffix,
  colorKey,
  sublabel,
}: {
  Icon: LucideIcon
  label: string
  value: number | string
  suffix?: string
  colorKey: SemanticColorKey
  sublabel?: string
}) {
  return (
    <div
      className="neu-card flex h-full min-h-[92px] items-center gap-4 rounded-[20px] px-[22px] py-[18px]"
    >
      <div
        className="neu-card-inset-sm flex size-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: COLOR_BG[colorKey], color: COLOR_FG[colorKey] }}
      >
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div
          className="text-[28px] leading-none font-bold tracking-[-0.5px] tabular-nums"
          style={{ color: "var(--color-text-primary)" }}
        >
          {typeof value === "number" ? value.toLocaleString("en-US") : value}
          {suffix && (
            <span
              className="text-sm font-medium"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {" "}
              {suffix}
            </span>
          )}
        </div>
        <div
          className="text-[11px] leading-snug font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {label}
        </div>
        <div
          className="min-h-[13px] text-[10px] leading-snug tabular-nums"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          {sublabel || "\u00A0"}
        </div>
      </div>
    </div>
  )
}
