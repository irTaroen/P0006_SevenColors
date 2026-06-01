"use client"

import { resolveMonth } from "@/lib/orders-dashboard"

export function PeriodToggle({
  offset,
  onChange,
}: {
  offset: number
  onChange: (offset: number) => void
}) {
  const options = [-1, 0, 1] as const

  return (
    <div className="neu-card-inset-sm inline-flex gap-0.5 rounded-full p-1">
      {options.map((value) => {
        const active = value === offset
        const { label, year } = resolveMonth(value)
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className="cursor-pointer rounded-full border-none px-3.5 py-1.5 text-xs whitespace-nowrap transition-all outline-none tabular-nums"
            style={{
              background: active ? "var(--color-bg)" : "transparent",
              boxShadow: active ? "var(--shadow-raised-sm)" : "none",
              color: active
                ? "var(--color-text-primary)"
                : "var(--color-text-secondary)",
              fontWeight: active ? 600 : 500,
            }}
          >
            {label} {year}
          </button>
        )
      })}
    </div>
  )
}
