import type { OrderLineView } from "@/lib/orders-dashboard"

export function StockChip({ line }: { line: OrderLineView }) {
  if (line.stockOk) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-medium"
        style={{ color: "var(--color-green-fg)" }}
      >
        <span
          className="size-[5px] rounded-full"
          style={{ background: "var(--color-green-fg)" }}
        />
        In stock
      </span>
    )
  }

  return (
    <span
      className="neu-card-inset-sm inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] leading-snug font-semibold whitespace-nowrap"
      style={{
        background: "var(--color-red-bg)",
        color: "var(--color-red-fg)",
      }}
    >
      <span
        className="size-[5px] rounded-full"
        style={{ background: "var(--color-red-fg)" }}
      />
      Short {line.shortage}
    </span>
  )
}
