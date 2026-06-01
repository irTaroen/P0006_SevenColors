import type { FlowColorKey } from "@/lib/flow-dashboard"
import { FLOW_LEGEND_ITEMS } from "@/lib/flow-dashboard"

import { flowNodeColor } from "./sankey-layout"

function LegendItem({
  colorKey,
  label,
}: {
  colorKey: FlowColorKey
  label: string
}) {
  const color = flowNodeColor(colorKey)
  return (
    <div
      className="inline-flex items-center gap-2 text-xs"
      style={{ color: "var(--color-text-secondary)" }}
    >
      <span
        className="neu-card-inset-sm size-3.5 shrink-0 rounded"
        style={{ background: color.fg }}
      />
      {label}
    </div>
  )
}

export function FlowLegend() {
  return (
    <div
      className="mt-6 flex flex-wrap gap-4 border-t pt-[18px]"
      style={{ borderColor: "var(--color-divider)" }}
    >
      {FLOW_LEGEND_ITEMS.map((item) => (
        <LegendItem key={item.label} {...item} />
      ))}
    </div>
  )
}

export function FlowColumnHeaders() {
  const headers = ["Source", "Processing", "Fulfillment", "Outcome"]
  return <FlowColumnHeadersWith headers={headers} />
}

export function FlowColumnHeadersWith({ headers }: { headers: string[] }) {
  const paddingLeft = 40
  const paddingRight = 180
  return (
    <div
      className="mb-[18px] grid"
      style={{
        gridTemplateColumns: `repeat(${headers.length}, 1fr)`,
        paddingLeft,
        paddingRight,
      }}
    >
      {headers.map((label, i) => (
        <div
          key={label}
          className="text-[10px] font-semibold tracking-[0.08em] uppercase"
          style={{
            color: "var(--color-text-tertiary)",
            textAlign: i === headers.length - 1 ? "right" : "left",
          }}
        >
          {label}
        </div>
      ))}
    </div>
  )
}
