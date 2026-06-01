import { AlertTriangle } from "lucide-react"

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className="size-3 rounded-[3px]"
        style={{ background: color, boxShadow: "var(--shadow-inset-xs)" }}
      />
      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </span>
    </div>
  )
}

export function InventoryLegend() {
  return (
    <div className="neu-card-sm flex flex-wrap items-center gap-5 rounded-2xl px-5 py-3.5">
      <div
        className="text-[10px] font-semibold tracking-wide uppercase"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        Legend
      </div>
      <LegendDot color="var(--color-green-fg)" label="Available" />
      <LegendDot color="var(--color-blue-fg)" label="Reserved" />
      <LegendDot color="var(--color-amber-fg)" label="In use" />
      <div className="inline-flex items-center gap-2">
        <span
          className="inline-flex size-[18px] items-center justify-center rounded-full"
          style={{
            background: "var(--color-red-bg)",
            color: "var(--color-red-fg)",
            boxShadow: "var(--shadow-inset-xs)",
          }}
        >
          <AlertTriangle size={10} strokeWidth={2.5} />
        </span>
        <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
          Low or out of stock
        </span>
      </div>
    </div>
  )
}
