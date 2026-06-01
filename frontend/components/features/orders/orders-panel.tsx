"use client"

import type {
  OrderFilterKey,
  OrderSortColumn,
  OrderSortDirection,
  OrderView,
} from "@/lib/orders-dashboard"

import { ColumnFilter } from "./column-filter"
import { OrderRow, ORDER_ROW_TEMPLATE } from "./order-row"
import { SortableHeader } from "./sortable-header"

export function OrdersPanel({
  orders,
  openRows,
  onToggleRow,
  onEdit,
  onDelete,
  deletingId,
  sortColumn,
  sortDirection,
  onSort,
  columnFilters,
  onColumnFiltersChange,
}: {
  orders: OrderView[]
  openRows: Set<string>
  onToggleRow: (id: string) => void
  onEdit: (order: OrderView) => void
  onDelete: (order: OrderView) => void
  deletingId?: string | null
  sortColumn: OrderSortColumn | null
  sortDirection: OrderSortDirection | null
  onSort: (column: OrderSortColumn) => void
  columnFilters: { order: string; client: string }
  onColumnFiltersChange: (filters: { order: string; client: string }) => void
}) {
  return (
    <div
      className="neu-card flex flex-col overflow-hidden rounded-[22px]"
      style={{ height: "60vh", minHeight: 420 }}
    >
      <div
        className="z-2 shrink-0 px-4 pt-3 pb-2.5"
        style={{
          background: "var(--color-bg)",
          boxShadow: "0 4px 8px -6px var(--color-shade)",
        }}
      >
        <div
          className="grid items-center gap-0 px-2 pt-2 pb-1.5"
          style={{ gridTemplateColumns: ORDER_ROW_TEMPLATE }}
        >
          <span />
          <SortableHeader
            label="Order"
            columnKey="order"
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <SortableHeader
            label="Client"
            columnKey="client"
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <SortableHeader
            label="Placed"
            columnKey="placed"
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <SortableHeader
            label="Production"
            columnKey="production"
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <SortableHeader
            label="Delivery"
            columnKey="delivery"
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <SortableHeader
            label="Items"
            columnKey="items"
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <SortableHeader
            label="Total"
            columnKey="total"
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={onSort}
            align="right"
          />
          <SortableHeader
            label="Status"
            columnKey="status"
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <span />
        </div>

        <div
          className="grid items-center gap-0 px-2 pt-1 pb-1.5"
          style={{ gridTemplateColumns: ORDER_ROW_TEMPLATE }}
        >
          <span />
          <div className="pr-2">
            <ColumnFilter
              value={columnFilters.order}
              onChange={(order) =>
                onColumnFiltersChange({ ...columnFilters, order })
              }
              placeholder="Search order…"
            />
          </div>
          <div className="pr-2">
            <ColumnFilter
              value={columnFilters.client}
              onChange={(client) =>
                onColumnFiltersChange({ ...columnFilters, client })
              }
              placeholder="Search client…"
            />
          </div>
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="flex-1 overflow-x-hidden overflow-y-auto px-4 pt-1.5 pb-4">
        {orders.length === 0 ? (
          <div
            className="px-5 py-16 text-center text-[13px]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            No orders found — adjust filters or period.
          </div>
        ) : (
          <div className="flex flex-col">
            {orders.map((order, idx) => (
              <div
                key={order.id}
                style={{
                  borderBottom:
                    idx < orders.length - 1
                      ? "1px solid var(--color-divider)"
                      : "none",
                }}
              >
                <OrderRow
                  order={order}
                  open={openRows.has(order.id)}
                  onToggle={() => onToggleRow(order.id)}
                  onEdit={() => onEdit(order)}
                  onDelete={() => onDelete(order)}
                  isDeleting={deletingId === order.id}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
