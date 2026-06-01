"use client"

import { NeuInput } from "@/components/ui/input"
import type { Column } from "@tanstack/react-table"

export function ColumnFilterInput<T>({
  column,
}: {
  column: Column<T, unknown>
}) {
  const value = (column.getFilterValue() as string) ?? ""
  const placeholder = column.columnDef.meta?.filterPlaceholder ?? "Filter…"

  return (
    <NeuInput
      value={value}
      onChange={(e) => column.setFilterValue(e.target.value)}
      placeholder={placeholder}
      aria-label={`Filter ${column.id}`}
      data-no-row-toggle
      className="h-7 min-w-0 px-3 py-0.5 text-xs"
      onClick={(e) => e.stopPropagation()}
    />
  )
}
