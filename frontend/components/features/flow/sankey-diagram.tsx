"use client"

import * as React from "react"

import type { FlowLink, FlowNode } from "@/lib/flow-dashboard"
import { formatFlowNumber } from "@/lib/flow-dashboard"

import {
  flowNodeColor,
  layoutSankey,
  nodeOutgoingTotal,
  sankeyPath,
  type LayoutLink,
} from "./sankey-layout"

const NODE_WIDTH = 18
const PADDING_LEFT = 8
const PADDING_RIGHT = 24
const PADDING_BOTTOM = 12
const HEADER_HEIGHT = 26

const MIN_WIDTH = 320
const MIN_HEIGHT = 240

export function SankeyDiagram({
  nodes,
  links,
  headers,
}: {
  nodes: FlowNode[]
  links: FlowLink[]
  headers?: string[]
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [size, setSize] = React.useState({ width: 880, height: 420 })

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setSize({
          width: Math.max(width, MIN_WIDTH),
          height: Math.max(height, MIN_HEIGHT),
        })
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const columnCount = React.useMemo(() => {
    if (headers && headers.length > 0) return headers.length
    return nodes.reduce((m, n) => Math.max(m, n.col), 0) + 1
  }, [headers, nodes])

  const headerHeight = headers && headers.length > 0 ? HEADER_HEIGHT : 0
  const innerWidth = Math.max(size.width - PADDING_LEFT - PADDING_RIGHT, 1)
  const innerHeight = Math.max(
    size.height - headerHeight - PADDING_BOTTOM,
    1
  )

  const layout = React.useMemo(
    () =>
      layoutSankey(nodes, links, {
        width: innerWidth,
        height: innerHeight,
        nodeWidth: NODE_WIDTH,
        nodePadding: 18,
        columnCount,
      }),
    [nodes, links, innerWidth, innerHeight, columnCount]
  )

  const [hoverNode, setHoverNode] = React.useState<string | null>(null)
  const [hoverLink, setHoverLink] = React.useState<LayoutLink | null>(null)

  const xStep =
    columnCount > 1 ? (innerWidth - NODE_WIDTH) / (columnCount - 1) : 0

  const linkIsActive = React.useCallback(
    (l: LayoutLink) => {
      if (hoverNode) return l.source === hoverNode || l.target === hoverNode
      if (hoverLink) return l === hoverLink
      return null
    },
    [hoverNode, hoverLink]
  )

  const nodeIsActive = React.useCallback(
    (nodeId: string) => {
      if (hoverNode) {
        if (nodeId === hoverNode) return true
        return links.some(
          (l) =>
            (l.source === hoverNode && l.target === nodeId) ||
            (l.target === hoverNode && l.source === nodeId)
        )
      }
      if (hoverLink) {
        return nodeId === hoverLink.source || nodeId === hoverLink.target
      }
      return null
    },
    [hoverNode, hoverLink, links]
  )

  const hasData = nodes.length > 0 && links.length > 0

  return (
    <div ref={containerRef} className="h-full w-full">
      {!hasData ? (
        <div
          className="flex h-full w-full items-center justify-center text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          No order flow data for this period.
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${size.width} ${size.height}`}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          className="block h-full w-full"
          role="img"
          aria-label="Order flow Sankey diagram"
        >
          <defs>
            {layout.linkObjs.map((l, i) => {
              const src = layout.nodeMap[l.source]
              const tgt = layout.nodeMap[l.target]
              if (!src || !tgt) return null
              const c0 = flowNodeColor(src.colorKey).fg
              const c1 = flowNodeColor(tgt.colorKey).fg
              return (
                <linearGradient
                  id={`flow-grad-${i}`}
                  key={i}
                  x1="0%"
                  x2="100%"
                  y1="0%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor={c0} stopOpacity="0.55" />
                  <stop offset="100%" stopColor={c1} stopOpacity="0.55" />
                </linearGradient>
              )
            })}
          </defs>

          {/* Column headers, aligned to the same column x positions as the nodes */}
          {headers && headers.length > 0 && (
            <g>
              {headers.map((label, i) => {
                const isLast = i === headers.length - 1
                const x = isLast
                  ? PADDING_LEFT + i * xStep + NODE_WIDTH
                  : PADDING_LEFT + i * xStep
                return (
                  <text
                    key={label}
                    x={x}
                    y={14}
                    fill="var(--color-text-tertiary)"
                    fontSize="10"
                    fontWeight="600"
                    letterSpacing="0.08em"
                    textAnchor={isLast ? "end" : "start"}
                    style={{ textTransform: "uppercase" }}
                  >
                    {label.toUpperCase()}
                  </text>
                )
              })}
            </g>
          )}

          <g transform={`translate(${PADDING_LEFT}, ${headerHeight})`}>
            <g>
              {layout.linkObjs.map((l, i) => {
                const active = linkIsActive(l)
                const opacity = active === null ? 1 : active ? 1 : 0.12
                const path = sankeyPath(l, layout.nodeMap, NODE_WIDTH)
                if (!path) return null
                return (
                  <path
                    key={i}
                    d={path}
                    fill={`url(#flow-grad-${i})`}
                    className="cursor-pointer transition-opacity duration-200"
                    opacity={opacity}
                    onMouseEnter={() => setHoverLink(l)}
                    onMouseLeave={() => setHoverLink(null)}
                  />
                )
              })}
            </g>

            <g>
              {Object.values(layout.nodeMap).map((n) => {
                const color = flowNodeColor(n.colorKey)
                const active = nodeIsActive(n.id)
                const opacity = active === null ? 1 : active ? 1 : 0.3
                const labelOnLeft = n.col === columnCount - 1
                const total = nodeOutgoingTotal(n.id, links)

                return (
                  <g
                    key={n.id}
                    className="cursor-pointer transition-opacity duration-200"
                    opacity={opacity}
                    onMouseEnter={() => setHoverNode(n.id)}
                    onMouseLeave={() => setHoverNode(null)}
                  >
                    <rect
                      x={n.x}
                      y={n.y}
                      width={NODE_WIDTH}
                      height={n.h}
                      rx={4}
                      fill={color.fg}
                    />
                    <text
                      x={labelOnLeft ? n.x - 8 : n.x + NODE_WIDTH + 8}
                      y={n.y + n.h / 2 - 6}
                      fill="var(--color-text-primary)"
                      fontSize="12"
                      fontWeight="600"
                      textAnchor={labelOnLeft ? "end" : "start"}
                      dominantBaseline="middle"
                    >
                      {n.label}
                    </text>
                    <text
                      x={labelOnLeft ? n.x - 8 : n.x + NODE_WIDTH + 8}
                      y={n.y + n.h / 2 + 9}
                      fill="var(--color-text-secondary)"
                      fontSize="10"
                      fontWeight="500"
                      textAnchor={labelOnLeft ? "end" : "start"}
                      dominantBaseline="middle"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {formatFlowNumber(Math.round(total))} units
                    </text>
                  </g>
                )
              })}
            </g>

            {hoverLink && !hoverNode && (() => {
              const src = layout.nodeMap[hoverLink.source]
              const tgt = layout.nodeMap[hoverLink.target]
              if (!src || !tgt) return null
              const midX = (src.x + NODE_WIDTH + tgt.x) / 2
              const midY =
                (hoverLink.y0 +
                  hoverLink.h0 / 2 +
                  hoverLink.y1 +
                  hoverLink.h1 / 2) /
                2
              return (
                <foreignObject
                  x={midX - 100}
                  y={midY - 80}
                  width={200}
                  height={70}
                  style={{ overflow: "visible", pointerEvents: "none" }}
                >
                  <div className="neu-card inline-block rounded-[10px] px-3 py-2 text-xs whitespace-nowrap">
                    <div
                      className="mb-0.5 font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {src.label} → {tgt.label}
                    </div>
                    <div
                      className="text-[11px] tabular-nums"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {formatFlowNumber(Math.round(hoverLink.value))} units
                    </div>
                  </div>
                </foreignObject>
              )
            })()}
          </g>
        </svg>
      )}
    </div>
  )
}
