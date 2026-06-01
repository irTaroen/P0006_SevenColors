"use client"

import Link from "next/link"
import { PencilIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  formatOrderCurrency,
  formatOrderDisplayDate,
  type OrderView,
} from "@/lib/orders-dashboard"

import { ActionButton } from "./action-button"
import { StatusBadge } from "./status-badge"
import { StockChip } from "./stock-chip"

export const ORDER_ROW_TEMPLATE =
  "20px minmax(0,1.3fr) minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr) minmax(0,0.7fr) minmax(0,1fr) minmax(0,1.6fr) 72px"

export const ITEM_ROW_TEMPLATE =
  "20px minmax(0,1.3fr) minmax(0,2.6fr) minmax(0,1fr) minmax(0,1fr) minmax(0,0.7fr) minmax(0,1fr) minmax(0,1.6fr) 72px"

export function OrderRow({
  order,
  open,
  onToggle,
  onEdit,
  onDelete,
  isDeleting,
}: {
  order: OrderView
  open: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  isDeleting?: boolean
}) {
  const showActionFooter =
    order.displayStatus === "stock_blocked" || order.status === "new"

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onToggle()
          }
        }}
        className="grid cursor-pointer items-center gap-0 rounded-xl px-2 py-4 text-[13px] transition-all outline-none"
        style={{
          gridTemplateColumns: ORDER_ROW_TEMPLATE,
          background: "var(--color-bg)",
          boxShadow: open ? "var(--shadow-inset-sm)" : "none",
        }}
      >
        <span
          className="flex items-center justify-center text-[10px] transition-transform"
          style={{
            color: "var(--color-text-tertiary)",
            transform: open ? "rotate(90deg)" : "rotate(0)",
          }}
        >
          ▶
        </span>

        <div className="min-w-0 pl-1">
          <div
            className="text-[13px] font-semibold tabular-nums"
            style={{ color: "var(--color-text-primary)" }}
          >
            {order.id}
          </div>
        </div>

        <div className="min-w-0 pr-2">
          <div
            className="truncate text-xs font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            {order.clientName}
          </div>
          <div
            className="text-[11px] tabular-nums"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {order.clientId}
          </div>
        </div>

        <div
          className="text-xs tabular-nums"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {formatOrderDisplayDate(order.orderDate)}
        </div>

        <div
          className="text-xs tabular-nums"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {formatOrderDisplayDate(order.deliveryDate)}
        </div>

        <div
          className="text-[13px] font-semibold tabular-nums"
          style={{ color: "var(--color-text-primary)" }}
        >
          {order.itemCount}
        </div>

        <div
          className="pr-3 text-right text-[13px] font-semibold tabular-nums"
          style={{ color: "var(--color-text-primary)" }}
        >
          {formatOrderCurrency(order.total)}
        </div>

        <div className="flex justify-start">
          <StatusBadge
            label={order.displayStatusLabel}
            colorKey={order.displayStatusColor}
          />
        </div>

        <div
          className="flex items-center justify-end gap-0.5"
          data-no-row-toggle
        >
          <Button
            variant="neu-icon"
            size="icon-sm"
            aria-label="Edit order"
            className="text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
          >
            <PencilIcon className="size-3.5" />
          </Button>
          <Button
            variant="neu-icon"
            size="icon-sm"
            aria-label="Delete order"
            disabled={isDeleting}
            className="text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      </div>

      {open && (
        <div className="mb-1 ml-[38px] mr-2 mt-2 pb-2">
          {order.lines.length === 0 ? (
            <p
              className="py-2 text-xs"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              No products on this order.
            </p>
          ) : (
            order.lines.map((line, i) => (
              <div
                key={`${order.id}-${line.productId}-${i}`}
                className="animate-slide-down grid items-center gap-0 px-2 py-2.5 text-xs"
                style={{
                  gridTemplateColumns: ITEM_ROW_TEMPLATE,
                  borderBottom:
                    i < order.lines.length - 1
                      ? "1px dashed var(--color-divider)"
                      : "none",
                  animationDelay: `${i * 30}ms`,
                }}
              >
                <span />
                <div
                  className="text-xs font-medium tabular-nums"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {line.productId}
                </div>
                <div
                  className="truncate pr-2 text-xs font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {line.name}
                </div>
                <div
                  className="text-xs tabular-nums"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  <span
                    className="text-[10px]"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    ×{" "}
                  </span>
                  {line.quantity}
                </div>
                <div
                  className="text-xs tabular-nums"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {formatOrderCurrency(line.unitPrice)}
                </div>
                <div
                  className="text-xs tabular-nums"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  {line.stockAvailable}
                </div>
                <div
                  className="pr-3 text-right text-xs font-semibold tabular-nums"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {formatOrderCurrency(line.lineTotal)}
                </div>
                <div className="flex justify-start">
                  <StockChip line={line} />
                </div>
                <span />
              </div>
            ))
          )}

          {showActionFooter && (
            <div
              className="neu-card-inset-sm mt-3 flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
            >
              <div
                className="text-[11px] leading-snug"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {order.displayStatus === "stock_blocked" ? (
                  <>
                    Order cannot be approved — review quantities or restock
                    short products via inventory.
                  </>
                ) : (
                  <>Order is pending approval.</>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                {order.displayStatus === "stock_blocked" && (
                  <Link href="/inventory" className="no-underline">
                    <ActionButton label="Restock inventory" variant="primary" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
