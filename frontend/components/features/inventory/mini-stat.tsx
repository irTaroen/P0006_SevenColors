function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div
        className="mb-0.5 text-[9px] font-semibold tracking-wide uppercase"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </div>
      <div
        className="text-sm font-bold tracking-[-0.2px] tabular-nums"
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </div>
    </div>
  )
}

export { MiniStat }
