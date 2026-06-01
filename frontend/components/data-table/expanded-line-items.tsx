import { ExpandedDetailColumn } from "@/components/data-table/expanded-detail-column"

export type ExpandedLineItemColumn<T> = {
  key: string
  label: string
  align?: "left" | "right"
  render: (row: T) => React.ReactNode
}

export function renderExpandedLineItemColumn<T>(
  column: ExpandedLineItemColumn<T>,
  rows: T[]
) {
  return (
    <ExpandedDetailColumn
      key={column.key}
      label={column.label}
      align={column.align}
    >
      {rows.map((row, index) => (
        <span key={`${column.key}-${index}`}>{column.render(row)}</span>
      ))}
    </ExpandedDetailColumn>
  )
}
