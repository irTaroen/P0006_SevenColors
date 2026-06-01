import { formattedNumberFilterText } from "@/components/data-table/table-filter-utils"

export function nullableText(value: string | null | undefined) {
  return value?.trim() ? value : "—"
}

export function priceFilterText(
  value: number | null | undefined,
  formatter: (value: number) => string
) {
  return formattedNumberFilterText(value, formatter)
}

export function StatusBadge({
  label,
  className,
}: {
  label: string
  className: string
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  )
}
