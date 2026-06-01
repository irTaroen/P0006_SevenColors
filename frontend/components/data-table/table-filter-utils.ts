import type { FilterFn } from "@tanstack/react-table"

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    filterText?: (row: TData) => string
    filterPlaceholder?: string
  }

  interface FilterFns {
    includesString: FilterFn<unknown>
  }
}

export const includesStringFilter: FilterFn<unknown> = (
  row,
  columnId,
  filterValue
) => {
  const query = String(filterValue ?? "")
    .trim()
    .toLowerCase()
  if (!query) return true

  const column = row
    .getAllCells()
    .find((cell) => cell.column.id === columnId)?.column
  const filterText = column?.columnDef.meta?.filterText

  let text: string
  if (filterText) {
    text = filterText(row.original)
  } else {
    const value = row.getValue(columnId)
    if (value == null) {
      text = ""
    } else if (typeof value === "object") {
      text = JSON.stringify(value)
    } else {
      text = String(value)
    }
  }

  return text.toLowerCase().includes(query)
}

export function isActiveFilter(value: unknown) {
  return Boolean(String(value ?? "").trim())
}

export function joinFilterText(
  values: Array<string | number | null | undefined>
) {
  return values
    .filter((value) => value !== null && value !== undefined)
    .join(" ")
}

export function formattedNumberFilterText(
  value: number | null | undefined,
  formatter: (value: number) => string
) {
  if (value === null || value === undefined) return ""
  return joinFilterText([formatter(value), value])
}
