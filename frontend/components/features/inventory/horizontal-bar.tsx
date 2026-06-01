"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"

import { formatInventoryNumber } from "@/lib/inventory-dashboard"

import type { InventoryBarItem } from "./types"

type Segment = "available" | "reserved" | "inUse"

const SEGMENT_COLORS: Record<Segment, string> = {
  available: "var(--color-green-fg)",
  reserved: "var(--color-blue-fg)",
  inUse: "var(--color-amber-fg)",
}

const SEGMENT_LABELS: Record<Segment, string> = {
  available: "Available",
  reserved: "Reserved",
  inUse: "In use",
}

export function HorizontalBar({
  item,
  maxCapacity,
  onClick,
}: {
  item: InventoryBarItem
  maxCapacity: number
  onClick?: () => void
}) {
  const [hover, setHover] = useState<Segment | null>(null)

  const barHeight = 22
  const radius = 6
  const isCritical = item.status === "out_of_stock"
  const isLow = item.status === "low" || isCritical

  const capacityPct =
    maxCapacity > 0 ? (item.capacity / maxCapacity) * 100 : 0
  const availablePct =
    maxCapacity > 0 ? (item.available / maxCapacity) * 100 : 0
  const reservedPct =
    maxCapacity > 0 ? (item.reserved / maxCapacity) * 100 : 0
  const inUsePct = maxCapacity > 0 ? (item.inUse / maxCapacity) * 100 : 0
  const usedPct = availablePct + reservedPct + inUsePct

  const tooltipValue =
    hover === "available"
      ? item.available
      : hover === "reserved"
        ? item.reserved
        : hover === "inUse"
          ? item.inUse
          : 0

  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full cursor-pointer items-center gap-3 rounded-[10px] border-none bg-transparent px-1 py-2 text-left outline-none transition-colors"
      style={{
        gridTemplateColumns: "70px minmax(0,1.6fr) minmax(0,2.4fr) 84px 24px",
      }}
    >
      <div
        className="truncate text-[11px] font-semibold tabular-nums"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {item.catalogId}
      </div>

      <div
        className="truncate text-xs font-medium"
        style={{ color: "var(--color-text-primary)" }}
      >
        {item.name}
      </div>

      <div
        className="relative flex w-full items-center"
        style={{ height: barHeight + 8 }}
      >
        <div
          className="absolute inset-x-0"
          style={{
            top: 4,
            height: barHeight,
            background: "var(--color-bg)",
            boxShadow: "var(--shadow-inset-xs)",
            borderRadius: radius,
          }}
        />

        {item.capacity > 0 && (
          <div
            className="pointer-events-none absolute"
            style={{
              top: 4,
              left: 0,
              width: `${capacityPct}%`,
              height: barHeight,
              border: "1px dashed var(--color-divider)",
              borderRadius: radius,
              opacity: 0.7,
            }}
          />
        )}

        {usedPct > 0 && (
          <div
            className="absolute flex overflow-hidden"
            style={{
              top: 4,
              left: 0,
              width: `${usedPct}%`,
              height: barHeight,
              borderRadius: radius,
              transition: "width 0.4s ease",
            }}
          >
            {availablePct > 0 && (
              <div
                onMouseEnter={() => setHover("available")}
                onMouseLeave={() => setHover(null)}
                style={{
                  width: `${(availablePct / usedPct) * 100}%`,
                  background: SEGMENT_COLORS.available,
                  height: "100%",
                  opacity: hover && hover !== "available" ? 0.4 : 1,
                  transition: "opacity 0.2s ease",
                }}
              />
            )}
            {reservedPct > 0 && (
              <div
                onMouseEnter={() => setHover("reserved")}
                onMouseLeave={() => setHover(null)}
                style={{
                  width: `${(reservedPct / usedPct) * 100}%`,
                  background: SEGMENT_COLORS.reserved,
                  height: "100%",
                  boxShadow: "-1.5px 0 0 var(--color-bg)",
                  opacity: hover && hover !== "reserved" ? 0.4 : 1,
                  transition: "opacity 0.2s ease",
                }}
              />
            )}
            {inUsePct > 0 && (
              <div
                onMouseEnter={() => setHover("inUse")}
                onMouseLeave={() => setHover(null)}
                style={{
                  width: `${(inUsePct / usedPct) * 100}%`,
                  background: SEGMENT_COLORS.inUse,
                  height: "100%",
                  boxShadow: "-1.5px 0 0 var(--color-bg)",
                  opacity: hover && hover !== "inUse" ? 0.4 : 1,
                  transition: "opacity 0.2s ease",
                }}
              />
            )}
          </div>
        )}

        {hover && (
          <div
            className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 rounded-lg px-2.5 py-1.5 text-[11px] whitespace-nowrap"
            style={{
              background: "var(--color-bg)",
              boxShadow: "var(--shadow-raised-sm)",
              color: "var(--color-text-primary)",
            }}
          >
            <span className="inline-flex items-center gap-1.5">
              <span
                className="size-[7px] rounded-[2px]"
                style={{ background: SEGMENT_COLORS[hover] }}
              />
              {SEGMENT_LABELS[hover]}: {formatInventoryNumber(tooltipValue)}
            </span>
          </div>
        )}
      </div>

      <div
        className="text-right text-xs font-semibold tabular-nums whitespace-nowrap"
        style={{ color: "var(--color-text-primary)" }}
      >
        {formatInventoryNumber(item.available)}
        <span
          className="text-[11px] font-normal"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          /{formatInventoryNumber(item.capacity)}
        </span>
      </div>

      <div className="flex items-center justify-center">
        {isLow && (
          <div
            title={
              isCritical
                ? "Out of stock"
                : item.minimumInventory > 0
                  ? `Available at or below minimum of ${item.minimumInventory}`
                  : "Low inventory"
            }
            className="flex size-[22px] items-center justify-center rounded-full"
            style={{
              background: isCritical
                ? "var(--color-red-bg)"
                : "var(--color-amber-bg)",
              color: isCritical
                ? "var(--color-red-fg)"
                : "var(--color-amber-fg)",
              boxShadow: "var(--shadow-inset-xs)",
            }}
          >
            <AlertTriangle size={12} strokeWidth={2.5} />
          </div>
        )}
      </div>
    </button>
  )
}
