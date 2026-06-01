"use client"

import { Input } from "@/components/ui/input"
import type { Column } from "@tanstack/react-table"

export function ColumnFilterInput<T>({ column }: { column: Column<T, unknown> }) {
  const value = (column.getFilterValue() as string) ?? ""
  const placeholder = column.columnDef.meta?.filterPlaceholder ?? "Filter…"

  return (
    <Input
      value={value}
      onChange={(e) => column.setFilterValue(e.target.value)}
      placeholder={placeholder}
      aria-label={`Filter ${column.id}`}
      data-no-row-toggle
      className="h-7 min-w-0 text-xs"
      onClick={(e) => e.stopPropagation()}
    />
  )
}
