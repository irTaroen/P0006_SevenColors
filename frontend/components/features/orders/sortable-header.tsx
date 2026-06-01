"use client"

import { useState } from "react"

import type { OrderSortColumn, OrderSortDirection } from "@/lib/orders-dashboard"

export function SortableHeader({
  label,
  columnKey,
  sortColumn,
  sortDirection,
  onSort,
  align = "left",
}: {
  label: string
  columnKey: OrderSortColumn
  sortColumn: OrderSortColumn | null
  sortDirection: OrderSortDirection | null
  onSort: (column: OrderSortColumn) => void
  align?: "left" | "right"
}) {
  const [hover, setHover] = useState(false)
  const isActive = sortColumn === columnKey
  const arrow = isActive ? (sortDirection === "asc" ? "↑" : "↓") : ""

  return (
    <button
      type="button"
      onClick={() => onSort(columnKey)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="inline-flex w-full cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-[10px] tracking-wide uppercase outline-none transition-colors"
      style={{
        justifyContent: align === "right" ? "flex-end" : "flex-start",
        fontWeight: isActive ? 600 : 500,
        color: isActive
          ? "var(--color-cloud-deep)"
          : hover
            ? "var(--color-text-secondary)"
            : "var(--color-text-tertiary)",
        paddingRight: align === "right" ? 12 : 0,
      }}
    >
      {label}
      <span
        className="text-[11px] leading-none"
        style={{
          opacity: isActive ? 1 : hover ? 0.4 : 0,
          transition: "opacity 0.15s ease",
        }}
      >
        {arrow || "↕"}
      </span>
    </button>
  )
}
