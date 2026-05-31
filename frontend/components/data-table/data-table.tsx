"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { ChevronRightIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { ConfirmDeleteDialog } from "@/components/data-table/confirm-delete-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<T extends { id: string }> {
  data: T[]
  columns: ColumnDef<T, any>[]
  isLoading?: boolean
  onDelete: (id: string) => Promise<void>
  onAddClick?: () => void
  onEdit?: (row: T) => void
  addLabel?: string
  getRowLabel?: (row: T) => string
  /** Full-width expanded panel (legacy). Prefer renderExpandedRowCells for column alignment. */
  renderExpandedRow?: (row: T) => React.ReactNode
  /** One cell per data column, aligned with the table header row. */
  renderExpandedRowCells?: (row: T) => (React.ReactNode | null | undefined)[]
  colgroup?: React.ReactNode
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  isLoading,
  onDelete,
  onAddClick,
  onEdit,
  addLabel = "Add row",
  getRowLabel,
  renderExpandedRow,
  renderExpandedRowCells,
  colgroup,
}: DataTableProps<T>) {
  const [deleting, setDeleting] = React.useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<T | null>(null)
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set())
  const expandable = Boolean(renderExpandedRow ?? renderExpandedRowCells)
  const expandedCellClassName = "whitespace-normal align-top bg-muted/30 p-2"
  const totalColumns = columns.length + (expandable ? 1 : 0) + 1

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleRowClick = (e: React.MouseEvent, id: string) => {
    const target = e.target as HTMLElement
    if (target.closest("button, input, select, textarea, [data-no-row-toggle]")) {
      return
    }
    toggleExpanded(id)
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(deleteTarget.id)
    await onDelete(deleteTarget.id)
    setDeleting(null)
    setDeleteTarget(null)
  }

  return (
    <div className="flex flex-col gap-3">
      {onAddClick && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={onAddClick}>
            <PlusIcon className="size-3.5" />
            {addLabel}
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border">
        <Table>
          {colgroup}
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {expandable && <TableHead className="w-8" />}
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
                <TableHead className="w-[72px]" />
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {expandable && (
                    <TableCell>
                      <Skeleton className="size-4" />
                    </TableCell>
                  )}
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                  <TableCell />
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={totalColumns} className="h-20 text-center text-muted-foreground">
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const isExpanded = expandedIds.has(row.original.id)

                return (
                  <React.Fragment key={row.id}>
                    <TableRow
                      className={expandable ? "cursor-pointer" : undefined}
                      aria-expanded={expandable ? isExpanded : undefined}
                      onClick={expandable ? (e) => handleRowClick(e, row.original.id) : undefined}
                    >
                      {expandable && (
                        <TableCell className="w-8 px-1 text-muted-foreground">
                          <ChevronRightIcon
                            className={`size-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                            aria-hidden
                          />
                        </TableCell>
                      )}
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                      <TableCell>
                        <div className="flex items-center justify-end gap-0.5">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Edit row"
                              onClick={(e) => {
                                e.stopPropagation()
                                onEdit(row.original)
                              }}
                              className="text-muted-foreground"
                            >
                              <PencilIcon className="size-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={deleting === row.original.id}
                            aria-label="Delete row"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteTarget(row.original)
                            }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandable && isExpanded && renderExpandedRowCells && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell className="w-8 bg-muted/30" />
                        {renderExpandedRowCells(row.original).map((cell, index) => (
                          <TableCell key={index} className={expandedCellClassName}>
                            {cell}
                          </TableCell>
                        ))}
                        <TableCell className="w-[72px] bg-muted/30" />
                      </TableRow>
                    )}
                    {expandable && isExpanded && !renderExpandedRowCells && renderExpandedRow && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={totalColumns} className="whitespace-normal bg-muted/30 p-0">
                          {renderExpandedRow(row.original)}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          {table.getRowModel().rows.length} record{table.getRowModel().rows.length !== 1 ? "s" : ""}
        </p>
      )}

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        itemName={deleteTarget ? getRowLabel?.(deleteTarget) : undefined}
        onConfirm={handleConfirmDelete}
        isDeleting={deleting !== null}
      />
    </div>
  )
}
