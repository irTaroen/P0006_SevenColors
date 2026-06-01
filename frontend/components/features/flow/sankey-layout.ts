import type { FlowColorKey, FlowLink, FlowNode } from "@/lib/flow-dashboard"

const COLOR_FG: Record<Exclude<FlowColorKey, "cloudLight">, string> = {
  amber: "var(--color-amber-fg)",
  red: "var(--color-red-fg)",
  purple: "var(--color-purple-fg)",
  orange: "var(--color-orange-fg)",
  green: "var(--color-green-fg)",
  grey: "var(--color-grey-fg)",
  yellow: "var(--color-yellow-fg)",
  blue: "var(--color-blue-fg)",
}

export function flowNodeColor(colorKey: FlowColorKey) {
  if (colorKey === "cloudLight") {
    return {
      fg: "var(--color-cloud-deep)",
      bg: "var(--color-cloud-light)",
    }
  }
  return { fg: COLOR_FG[colorKey], bg: COLOR_FG[colorKey] }
}

export type LayoutLink = FlowLink & {
  y0: number
  y1: number
  h0: number
  h1: number
}

export type LayoutNode = FlowNode & {
  x: number
  y: number
  h: number
  nodeWidth: number
  outOffset: number
  inOffset: number
}

export function layoutSankey(
  nodes: FlowNode[],
  links: FlowLink[],
  {
    width,
    height,
    nodeWidth = 18,
    nodePadding = 18,
    columnCount,
  }: {
    width: number
    height: number
    nodeWidth?: number
    nodePadding?: number
    /**
     * When provided, node x positions are computed against this fixed number
     * of columns (using each node's original `col` index). This keeps the
     * diagram aligned with external column headers even if a stage is empty.
     */
    columnCount?: number
  }
) {
  if (nodes.length === 0 || links.length === 0) {
    return { nodeMap: {} as Record<string, LayoutNode>, linkObjs: [] as LayoutLink[] }
  }

  const cols: Record<number, FlowNode[]> = {}
  nodes.forEach((n) => {
    if (!cols[n.col]) cols[n.col] = []
    cols[n.col].push(n)
  })
  const colIds = Object.keys(cols)
    .map((v) => Number(v))
    .sort((a, b) => a - b)
  const colCount = colIds.length
  const colIndex = new Map<number, number>(colIds.map((id, i) => [id, i]))

  const nodeFlow: Record<string, number> = {}
  nodes.forEach((n) => {
    const out = links
      .filter((l) => l.source === n.id)
      .reduce((s, l) => s + l.value, 0)
    const inc = links
      .filter((l) => l.target === n.id)
      .reduce((s, l) => s + l.value, 0)
    nodeFlow[n.id] = Math.max(out, inc, 1)
  })

  const colTotals: Record<string, number> = {}
  Object.keys(cols).forEach((c) => {
    colTotals[c] = cols[Number(c)].reduce((s, n) => s + nodeFlow[n.id], 0)
  })
  const maxColTotal = Math.max(...Object.values(colTotals), 1)
  const maxNodesInCol = Math.max(...Object.values(cols).map((c) => c.length), 1)
  const availableHeight = height - (maxNodesInCol - 1) * nodePadding
  const scale = availableHeight / maxColTotal

  const effectiveColCount = columnCount && columnCount > 0 ? columnCount : colCount
  const xStep =
    effectiveColCount > 1 ? (width - nodeWidth) / (effectiveColCount - 1) : 0

  const nodeMap: Record<string, LayoutNode> = {}
  Object.keys(cols).forEach((c) => {
    const colId = Number(c)
    // With a fixed columnCount, align using the node's real column index so
    // the diagram lines up with the stage headers.
    const xIdx = columnCount && columnCount > 0 ? colId : (colIndex.get(colId) ?? 0)
    const colNodes = cols[Number(c)]
    const colTotalHeight =
      colNodes.reduce((s, n) => s + nodeFlow[n.id] * scale, 0) +
      (colNodes.length - 1) * nodePadding
    let y = (height - colTotalHeight) / 2
    colNodes.forEach((n) => {
      const h = Math.max(nodeFlow[n.id] * scale, 4)
      nodeMap[n.id] = {
        ...n,
        x: xIdx * xStep,
        y,
        h,
        nodeWidth,
        outOffset: 0,
        inOffset: 0,
      }
      y += h + nodePadding
    })
  })

  const linkObjs: LayoutLink[] = links.map((l) => ({ ...l, y0: 0, y1: 0, h0: 0, h1: 0 }))

  nodes.forEach((n) => {
    const outLinks = linkObjs.filter((l) => l.source === n.id)
    outLinks.sort((a, b) => nodeMap[a.target].y - nodeMap[b.target].y)
    outLinks.forEach((l) => {
      const h = Math.max(l.value * scale, 1)
      l.y0 = nodeMap[n.id].y + nodeMap[n.id].outOffset
      l.h0 = h
      nodeMap[n.id].outOffset += h
    })
  })

  nodes.forEach((n) => {
    const inLinks = linkObjs.filter((l) => l.target === n.id)
    inLinks.sort((a, b) => nodeMap[a.source].y - nodeMap[b.source].y)
    inLinks.forEach((l) => {
      const h = Math.max(l.value * scale, 1)
      l.y1 = nodeMap[n.id].y + nodeMap[n.id].inOffset
      l.h1 = h
      nodeMap[n.id].inOffset += h
    })
  })

  return { nodeMap, linkObjs }
}

export function sankeyPath(
  link: LayoutLink,
  nodeMap: Record<string, LayoutNode>,
  nodeWidth: number
) {
  const src = nodeMap[link.source]
  const tgt = nodeMap[link.target]
  if (!src || !tgt) return ""
  const x0 = src.x + nodeWidth
  const x1 = tgt.x
  const midX = (x0 + x1) / 2
  return [
    `M ${x0} ${link.y0}`,
    `C ${midX} ${link.y0}, ${midX} ${link.y1}, ${x1} ${link.y1}`,
    `L ${x1} ${link.y1 + link.h1}`,
    `C ${midX} ${link.y1 + link.h1}, ${midX} ${link.y0 + link.h0}, ${x0} ${link.y0 + link.h0}`,
    "Z",
  ].join(" ")
}

export function nodeOutgoingTotal(nodeId: string, links: FlowLink[]) {
  const out = links
    .filter((l) => l.source === nodeId)
    .reduce((s, l) => s + l.value, 0)
  if (out > 0) return out
  return links
    .filter((l) => l.target === nodeId)
    .reduce((s, l) => s + l.value, 0)
}
