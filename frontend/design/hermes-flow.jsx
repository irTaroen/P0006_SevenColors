import { useState, useMemo } from "react";

// ─── Design tokens (same system as Kairos) ────────────────────────────────────
const THEMES = {
  light: {
    bg: "#f5f0eb",
    shade: "#c9c2b8",
    hi: "#ffffff",
    textPrimary: "#31344b",
    textSecondary: "#6b6f8e",
    textTertiary: "#9a9db4",
    divider: "#d9d2c8",
    cloudLight: "#cfe8f5",
    cloudMid: "#a5d3ec",
    cloudDeep: "#5fa8d3",
    ambient: "transparent",
    C: {
      amber:  { fg: "#b87333", bg: "#f0d9b8" },
      red:    { fg: "#b04545", bg: "#f0c8c8" },
      purple: { fg: "#7a5fb3", bg: "#d8cfeb" },
      orange: { fg: "#c4763a", bg: "#f2d5b8" },
      green:  { fg: "#5a8a4a", bg: "#d2e2c0" },
      grey:   { fg: "#6b6f7e", bg: "#dcdbd4" },
      yellow: { fg: "#a38a2a", bg: "#ece1b8" },
      blue:   { fg: "#5fa8d3", bg: "#cfe8f5" },
    },
  },
  dark: {
    bg: "#1a1626",
    shade: "#0f0c18",
    hi: "#2a2438",
    textPrimary: "#e8e4f0",
    textSecondary: "#a8a2bc",
    textTertiary: "#6c6580",
    divider: "#2f2940",
    cloudLight: "#7ac4e8",
    cloudMid: "#5fa8d3",
    cloudDeep: "#a5d8f0",
    ambient: "radial-gradient(ellipse at 20% 10%, rgba(139, 92, 246, 0.15), transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(245, 158, 79, 0.10), transparent 50%)",
    C: {
      amber:  { fg: "#f5a04f", bg: "#3a2818" },
      red:    { fg: "#e87878", bg: "#3a1f1f" },
      purple: { fg: "#b794f6", bg: "#2e2348" },
      orange: { fg: "#f59e4f", bg: "#3a2614" },
      green:  { fg: "#9bcf85", bg: "#1f2e1a" },
      grey:   { fg: "#9d9db4", bg: "#28253a" },
      yellow: { fg: "#f5d76e", bg: "#352c14" },
      blue:   { fg: "#a5d8f0", bg: "#1a2c32" },
    },
  },
};

const makeNeu = (t) => ({
  raised:    `-6px -6px 12px ${t.hi}, 6px 6px 12px ${t.shade}`,
  raisedSm:  `-4px -4px 8px ${t.hi}, 4px 4px 8px ${t.shade}`,
  lifted:    `-8px -8px 16px ${t.hi}, 8px 8px 16px ${t.shade}`,
  liftedSm:  `-6px -6px 12px ${t.hi}, 6px 6px 12px ${t.shade}`,
  inset:     `inset -4px -4px 8px ${t.hi}, inset 4px 4px 8px ${t.shade}`,
  insetSm:   `inset -3px -3px 6px ${t.hi}, inset 3px 3px 6px ${t.shade}`,
});

// ─── NimbusMark (shared brand) ────────────────────────────────────────────────
const NimbusMark = ({ size = 32, t }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} style={{ display: "block" }}>
    <path d="M16 22 Q12 22 10 25 Q8 28 10 31 Q11 33 14 33 L22 33 Q25 33 25 30 Q25 27 22 26 Q22 22 18 22 Z"
      fill={t.cloudLight} stroke="#2a2438" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M30 18 Q22 18 20 25 Q14 26 14 32 Q14 38 22 38 L46 38 Q54 38 54 30 Q54 24 47 23 Q46 16 38 16 Q33 16 30 18 Z"
      fill={t.cloudLight} stroke="#2a2438" strokeWidth="2" strokeLinejoin="round" />
    <path d="M32 38 Q25 38 24 44 Q20 45 20 49 Q20 53 26 53 L46 53 Q52 53 52 48 Q52 43 46 43 Q45 38 38 38 Q35 38 32 38 Z"
      fill={t.cloudMid} stroke="#2a2438" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

// ─── Sankey data model ────────────────────────────────────────────────────────
// Each node has an id, label, column (0..3), and a colorKey from the C palette.
// Each link is { source, target, value }.
// All values are in product-units. Conservation of mass: sum of inputs = sum of outputs per node.
const NODES = [
  // Column 0 — Sources
  { id: "raw_in",      label: "Grondstoffen voorraad",  col: 0, colorKey: "purple" },
  { id: "fin_in",      label: "Eindproduct voorraad",   col: 0, colorKey: "blue"   },
  { id: "intake",      label: "Nieuwe inkoop",          col: 0, colorKey: "cloudLight" },

  // Column 1 — Processing
  { id: "assembly",    label: "Assemblage",             col: 1, colorKey: "purple" },
  { id: "direct",      label: "Directe uitname",        col: 1, colorKey: "blue"   },
  { id: "expired",     label: "Vervallen / verlopen",   col: 1, colorKey: "amber"  },
  { id: "spilled",     label: "Beschadigd / gemorst",   col: 1, colorKey: "orange" },

  // Column 2 — Fulfillment
  { id: "shipped",     label: "Verzonden",              col: 2, colorKey: "green"  },
  { id: "cancelled",   label: "Geannuleerd",            col: 2, colorKey: "red"    },
  { id: "wip",         label: "WIP / reserve",          col: 2, colorKey: "yellow" },

  // Column 3 — Outcomes
  { id: "delivered",   label: "Geleverd",               col: 3, colorKey: "green"  },
  { id: "returned",    label: "Geretourneerd",          col: 3, colorKey: "grey"   },
  { id: "writeoff",    label: "Afgeschreven",           col: 3, colorKey: "red"    },
];

const LINKS = [
  // Sources → Processing
  { source: "raw_in",   target: "assembly",  value: 240 },
  { source: "raw_in",   target: "expired",   value:  20 },
  { source: "raw_in",   target: "spilled",   value:  10 },
  { source: "fin_in",   target: "direct",    value: 480 },
  { source: "fin_in",   target: "expired",   value:  15 },
  { source: "fin_in",   target: "spilled",   value:   8 },
  { source: "intake",   target: "direct",    value: 130 },
  { source: "intake",   target: "assembly",  value:  60 },

  // Processing → Fulfillment
  { source: "assembly", target: "shipped",   value: 240 },
  { source: "assembly", target: "wip",       value:  60 },
  { source: "direct",   target: "shipped",   value: 540 },
  { source: "direct",   target: "cancelled", value:  40 },
  { source: "direct",   target: "wip",       value:  30 },

  // Fulfillment → Outcomes
  { source: "shipped",   target: "delivered", value: 720 },
  { source: "shipped",   target: "returned",  value:  60 },
  { source: "cancelled", target: "writeoff",  value:  40 },
  { source: "wip",       target: "delivered", value:  70 },
  { source: "wip",       target: "writeoff",  value:  20 },

  // Loss buckets → write-off
  { source: "expired", target: "writeoff", value: 35 },
  { source: "spilled", target: "writeoff", value: 18 },
];

// ─── Sankey layout algorithm ──────────────────────────────────────────────────
// Compact custom layout (instead of pulling in d3-sankey):
// 1. Group nodes by column, compute node heights from sum of incoming|outgoing flows
// 2. Vertically position nodes within each column with gaps between
// 3. For each link, compute its y position at source (stacked from top) and target (stacked from top)
// 4. Render each link as a cubic bezier band
const layoutSankey = (nodes, links, { width, height, nodeWidth = 18, nodePadding = 16, columnGap = null }) => {
  const cols = {};
  nodes.forEach((n) => { (cols[n.col] = cols[n.col] || []).push(n); });
  const colCount = Object.keys(cols).length;

  // Node height = max(sum of inputs, sum of outputs) × scale factor
  const nodeFlow = {};
  nodes.forEach((n) => {
    const out = links.filter((l) => l.source === n.id).reduce((s, l) => s + l.value, 0);
    const inc = links.filter((l) => l.target === n.id).reduce((s, l) => s + l.value, 0);
    nodeFlow[n.id] = Math.max(out, inc);
  });

  // Scale factor: largest column's total flow + padding must fit in `height`
  const colTotals = {};
  Object.keys(cols).forEach((c) => {
    colTotals[c] = cols[c].reduce((s, n) => s + nodeFlow[n.id], 0);
  });
  const maxColTotal = Math.max(...Object.values(colTotals));
  const maxNodesInCol = Math.max(...Object.values(cols).map((c) => c.length));
  const availableHeight = height - (maxNodesInCol - 1) * nodePadding;
  const scale = availableHeight / maxColTotal;

  // X positions for columns
  const xStep = (width - nodeWidth) / (colCount - 1);

  // Layout each node with y position
  const nodeMap = {};
  Object.keys(cols).forEach((c) => {
    const colNodes = cols[c];
    const colTotalHeight = colNodes.reduce((s, n) => s + nodeFlow[n.id] * scale, 0)
                         + (colNodes.length - 1) * nodePadding;
    let y = (height - colTotalHeight) / 2; // center vertically
    colNodes.forEach((n) => {
      const h = nodeFlow[n.id] * scale;
      nodeMap[n.id] = {
        ...n,
        x: parseInt(c, 10) * xStep,
        y, h, nodeWidth,
        // Trackers for stacking outgoing & incoming flows
        outOffset: 0,
        inOffset: 0,
      };
      y += h + nodePadding;
    });
  });

  // Walk links and assign per-link y offsets at source-out and target-in
  // Sort outgoing & incoming links per node so they don't cross more than needed.
  const linkObjs = links.map((l) => ({ ...l }));

  // Sort outgoing links by target's y position (so bands stack in vertical order)
  nodes.forEach((n) => {
    const outLinks = linkObjs.filter((l) => l.source === n.id);
    outLinks.sort((a, b) => nodeMap[a.target].y - nodeMap[b.target].y);
    outLinks.forEach((l) => {
      const h = l.value * scale;
      l.y0 = nodeMap[n.id].y + nodeMap[n.id].outOffset;
      l.h0 = h;
      nodeMap[n.id].outOffset += h;
    });
  });

  // Sort incoming links by source's y position
  nodes.forEach((n) => {
    const inLinks = linkObjs.filter((l) => l.target === n.id);
    inLinks.sort((a, b) => nodeMap[a.source].y - nodeMap[b.source].y);
    inLinks.forEach((l) => {
      const h = l.value * scale;
      l.y1 = nodeMap[n.id].y + nodeMap[n.id].inOffset;
      l.h1 = h;
      nodeMap[n.id].inOffset += h;
    });
  });

  return { nodeMap, linkObjs };
};

// Build a smooth bezier path for a Sankey band
const sankeyPath = (l, nodeMap, nodeWidth) => {
  const src = nodeMap[l.source];
  const tgt = nodeMap[l.target];
  const x0 = src.x + nodeWidth;
  const x1 = tgt.x;
  const midX = (x0 + x1) / 2;
  // Top and bottom curves of the band
  return [
    `M ${x0} ${l.y0}`,
    `C ${midX} ${l.y0}, ${midX} ${l.y1}, ${x1} ${l.y1}`,
    `L ${x1} ${l.y1 + l.h1}`,
    `C ${midX} ${l.y1 + l.h1}, ${midX} ${l.y0 + l.h0}, ${x0} ${l.y0 + l.h0}`,
    `Z`,
  ].join(" ");
};

// ─── Resolve node color through the theme palette ────────────────────────────
const nodeColor = (node, t) => {
  if (node.colorKey === "cloudLight") return { fg: t.cloudDeep, bg: t.cloudLight };
  return t.C[node.colorKey];
};

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const Tooltip = ({ x, y, title, value, t }) => (
  <foreignObject x={x} y={y} width={200} height={70} style={{ overflow: "visible", pointerEvents: "none" }}>
    <div style={{
      background: t.bg, boxShadow: t.neu.raised,
      borderRadius: 10, padding: "8px 12px",
      fontSize: 12, fontFamily: "'Poppins',sans-serif",
      color: t.textPrimary, display: "inline-block",
      whiteSpace: "nowrap",
    }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{title}</div>
      <div style={{ color: t.textSecondary, fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
        {value.toLocaleString("nl-NL")} eenheden
      </div>
    </div>
  </foreignObject>
);

// ─── Sankey component ─────────────────────────────────────────────────────────
const Sankey = ({ t }) => {
  const width = 880;
  const height = 480;
  const nodeWidth = 18;

  const layout = useMemo(
    () => layoutSankey(NODES, LINKS, { width, height, nodeWidth, nodePadding: 18 }),
    []
  );

  const [hoverNode, setHoverNode] = useState(null);
  const [hoverLink, setHoverLink] = useState(null);

  // Determine which links are "active" based on hover state
  const linkIsActive = (l) => {
    if (hoverNode) return l.source === hoverNode || l.target === hoverNode;
    if (hoverLink) return l === hoverLink;
    return null; // no hover at all
  };

  const nodeIsActive = (n) => {
    if (hoverNode) {
      if (n.id === hoverNode) return true;
      return LINKS.some((l) =>
        (l.source === hoverNode && l.target === n.id) ||
        (l.target === hoverNode && l.source === n.id)
      );
    }
    if (hoverLink) return n.id === hoverLink.source || n.id === hoverLink.target;
    return null;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: "block", overflow: "visible" }}>
      <defs>
        {/* Linear gradient per link, blending source color into target color */}
        {layout.linkObjs.map((l, i) => {
          const src = layout.nodeMap[l.source];
          const tgt = layout.nodeMap[l.target];
          const c0 = nodeColor(src, t).fg;
          const c1 = nodeColor(tgt, t).fg;
          return (
            <linearGradient id={`grad-${i}`} key={i} x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor={c0} stopOpacity="0.55" />
              <stop offset="100%" stopColor={c1} stopOpacity="0.55" />
            </linearGradient>
          );
        })}
      </defs>

      {/* Links (rendered first so nodes overlay them) */}
      <g>
        {layout.linkObjs.map((l, i) => {
          const active = linkIsActive(l);
          const opacity = active === null ? 1 : (active ? 1 : 0.12);
          return (
            <path
              key={i}
              d={sankeyPath(l, layout.nodeMap, nodeWidth)}
              fill={`url(#grad-${i})`}
              style={{ transition: "opacity 0.2s ease", cursor: "pointer" }}
              opacity={opacity}
              onMouseEnter={() => setHoverLink(l)}
              onMouseLeave={() => setHoverLink(null)}
            />
          );
        })}
      </g>

      {/* Nodes */}
      <g>
        {Object.values(layout.nodeMap).map((n) => {
          const color = nodeColor(n, t);
          const active = nodeIsActive(n);
          const opacity = active === null ? 1 : (active ? 1 : 0.3);
          // Label alignment: right of node for cols 0-2, left of node for col 3
          const labelOnLeft = n.col === 3;
          const total = LINKS
            .filter((l) => l.source === n.id || l.target === n.id)
            .reduce((sum, l) => sum + (l.source === n.id ? l.value : 0), 0)
            || LINKS.filter((l) => l.target === n.id).reduce((s, l) => s + l.value, 0);

          return (
            <g
              key={n.id}
              style={{ transition: "opacity 0.2s ease", cursor: "pointer" }}
              opacity={opacity}
              onMouseEnter={() => setHoverNode(n.id)}
              onMouseLeave={() => setHoverNode(null)}
            >
              <rect
                x={n.x}
                y={n.y}
                width={nodeWidth}
                height={n.h}
                rx={4}
                fill={color.fg}
                stroke={color.fg}
                strokeWidth="0"
              />
              <text
                x={labelOnLeft ? n.x - 8 : n.x + nodeWidth + 8}
                y={n.y + n.h / 2 - 6}
                fill={t.textPrimary}
                fontSize="12"
                fontWeight="600"
                fontFamily="'Poppins',sans-serif"
                textAnchor={labelOnLeft ? "end" : "start"}
                style={{ dominantBaseline: "middle" }}
              >
                {n.label}
              </text>
              <text
                x={labelOnLeft ? n.x - 8 : n.x + nodeWidth + 8}
                y={n.y + n.h / 2 + 9}
                fill={t.textSecondary}
                fontSize="10"
                fontWeight="500"
                fontFamily="'Poppins',sans-serif"
                textAnchor={labelOnLeft ? "end" : "start"}
                style={{ dominantBaseline: "middle", fontVariantNumeric: "tabular-nums" }}
              >
                {total.toLocaleString("nl-NL")} eenh.
              </text>
            </g>
          );
        })}
      </g>

      {/* Link tooltip — only when a link is hovered, not a node */}
      {hoverLink && !hoverNode && (() => {
        const src = layout.nodeMap[hoverLink.source];
        const tgt = layout.nodeMap[hoverLink.target];
        const midX = (src.x + nodeWidth + tgt.x) / 2;
        const midY = (hoverLink.y0 + hoverLink.h0 / 2 + hoverLink.y1 + hoverLink.h1 / 2) / 2;
        return (
          <Tooltip
            x={midX - 100}
            y={midY - 80}
            title={`${src.label} → ${tgt.label}`}
            value={hoverLink.value}
            t={t}
          />
        );
      })()}
    </svg>
  );
};

// ─── KPI summary card ────────────────────────────────────────────────────────
const SummaryCard = ({ icon, label, value, suffix, trend, t, colorKey = "blue" }) => {
  const color = t.C[colorKey];
  return (
    <div style={{
      background: t.bg, boxShadow: t.neu.raised,
      borderRadius: 20, padding: "18px 22px",
      display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: color.bg, boxShadow: t.neu.insetSm,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, color: color.fg, fontWeight: 600, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 28, fontWeight: 700, color: t.textPrimary,
          letterSpacing: "-0.5px", lineHeight: 1,
          fontVariantNumeric: "tabular-nums", marginBottom: 4,
        }}>
          {typeof value === "number" ? value.toLocaleString("nl-NL") : value}
          {suffix && <span style={{ fontSize: 14, color: t.textTertiary, fontWeight: 500 }}> {suffix}</span>}
        </div>
        <div style={{ fontSize: 11, color: t.textSecondary, fontWeight: 500 }}>
          {label}
          {trend != null && (
            <span style={{
              marginLeft: 8, fontWeight: 600,
              color: trend > 0 ? t.C.green.fg : t.C.red.fg,
            }}>
              {trend > 0 ? "↗" : "↘"} {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Legend item ─────────────────────────────────────────────────────────────
const LegendItem = ({ colorKey, label, t }) => {
  const color = colorKey === "cloudLight"
    ? { fg: t.cloudDeep }
    : t.C[colorKey];
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      fontSize: 12, color: t.textSecondary,
    }}>
      <span style={{
        width: 14, height: 14, borderRadius: 4,
        background: color.fg, flexShrink: 0,
        boxShadow: t.neu.insetXs,
      }} />
      {label}
    </div>
  );
};

// ─── Theme toggle ─────────────────────────────────────────────────────────────
const NeuIconBtn = ({ children, onClick, t, ariaLabel }) => {
  const [hov, setHov] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: t.bg,
        boxShadow: pressed ? t.neu.insetSm : (hov ? t.neu.liftedSm : t.neu.raisedSm),
        transform: pressed ? "translateY(0)" : (hov ? "translateY(-1px)" : "translateY(0)"),
        border: "none", outline: "none",
        width: 42, height: 42, borderRadius: "50%", cursor: "pointer",
        color: hov || pressed ? t.cloudDeep : t.textPrimary,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "box-shadow 0.2s ease, transform 0.15s ease, color 0.2s ease",
        fontSize: 16,
      }}
    >{children}</button>
  );
};

// ─── Period toggle ────────────────────────────────────────────────────────────
// Three relative-time pills (previous / this / next month) with the resolved
// absolute month shown underneath as a subtitle. Offset is the source of truth:
// -1 = previous, 0 = current, +1 = next.
const MONTH_NAMES = [
  "Januari", "Februari", "Maart", "April", "Mei", "Juni",
  "Juli", "Augustus", "September", "Oktober", "November", "December",
];

const resolveMonth = (offset, now = new Date(2026, 3, 17)) => {
  // The `now` default is fixed in the demo for stable output.
  // In production: const resolveMonth = (offset, now = new Date()) => …
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return { label: MONTH_NAMES[d.getMonth()], year: d.getFullYear() };
};

const PeriodToggle = ({ offset, onChange, t }) => {
  const options = [
    { value: -1, label: "Vorige maand" },
    { value:  0, label: "Deze maand"   },
    { value:  1, label: "Volgende maand" },
  ];
  const resolved = resolveMonth(offset);

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <div style={{
        background: t.bg, boxShadow: t.neu.insetSm,
        borderRadius: 99, padding: 4,
        display: "inline-flex", gap: 2,
      }}>
        {options.map((opt) => {
          const active = opt.value === offset;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                background: active ? t.bg : "transparent",
                boxShadow: active ? t.neu.raisedSm : "none",
                color: active ? t.textPrimary : t.textSecondary,
                border: "none", outline: "none",
                padding: "6px 14px", borderRadius: 99,
                fontSize: 12, fontWeight: active ? 600 : 500,
                fontFamily: "'Poppins',sans-serif", cursor: "pointer",
                transition: "all 0.2s ease", whiteSpace: "nowrap",
              }}
            >{opt.label}</button>
          );
        })}
      </div>
      {/* Resolved month subtitle */}
      <div style={{
        fontSize: 10, color: t.textTertiary, fontWeight: 500,
        letterSpacing: 0.4, paddingRight: 6,
        fontVariantNumeric: "tabular-nums",
      }}>
        {resolved.label} {resolved.year}
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HermesFlowPage() {
  const [themeName, setThemeName] = useState("light");
  const t = { ...THEMES[themeName] };
  t.neu = makeNeu(t);
  t.neu.insetXs = `inset -2px -2px 4px ${t.hi}, inset 2px 2px 4px ${t.shade}`;
  const isDark = themeName === "dark";

  const [periodOffset, setPeriodOffset] = useState(0);
  const resolvedPeriod = resolveMonth(periodOffset);

  // Compute summary metrics from the link data
  const totalSourced = LINKS.filter((l) => ["raw_in","fin_in","intake"].includes(l.source))
    .reduce((s, l) => s + l.value, 0);
  const delivered = LINKS.filter((l) => l.target === "delivered").reduce((s, l) => s + l.value, 0);
  const lost = LINKS.filter((l) => l.target === "writeoff").reduce((s, l) => s + l.value, 0);
  const fulfillmentRate = ((delivered / totalSourced) * 100).toFixed(1);
  const lossRate = ((lost / totalSourced) * 100).toFixed(1);

  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      background: t.bg,
      backgroundImage: t.ambient,
      backgroundAttachment: "fixed",
      fontFamily: "'Poppins',sans-serif", color: t.textPrimary,
      display: "flex", flexDirection: "column",
      transition: "background 0.4s ease, color 0.4s ease",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${t.bg}; }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card { animation: fade-up 0.5s ease both; }
        .card.d1 { animation-delay: 0.05s; }
        .card.d2 { animation-delay: 0.1s; }
        .card.d3 { animation-delay: 0.15s; }
      `}</style>

      {/* Header */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 36px", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: t.bg, boxShadow: t.neu.raisedSm,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <NimbusMark size={30} t={t} />
          </div>
          <div>
            <div style={{
              fontSize: 11, color: t.textTertiary, fontWeight: 500,
              letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2,
            }}>Nimbus · Hermes</div>
            <h1 style={{
              fontSize: 20, fontWeight: 700, color: t.textPrimary,
              letterSpacing: "-0.3px",
            }}>Order Flow</h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <PeriodToggle
            offset={periodOffset}
            onChange={setPeriodOffset}
            t={t}
          />
          <NeuIconBtn t={t} onClick={() => setThemeName(isDark ? "light" : "dark")} ariaLabel="Schakel donker / licht">
            {isDark ? "☀" : "☾"}
          </NeuIconBtn>
        </div>
      </header>

      {/* Main */}
      <main style={{ padding: "8px 36px 40px", flex: 1 }}>

        {/* Page title + subtitle */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{
            fontSize: 28, fontWeight: 700, color: t.textPrimary,
            letterSpacing: "-0.6px", marginBottom: 6,
          }}>
            Doorstroom <span style={{ color: t.cloudDeep, fontStyle: "italic" }}>orders</span>
          </h2>
          <p style={{ fontSize: 13, color: t.textSecondary, maxWidth: 640, lineHeight: 1.55 }}>
            Hoe goedgekeurde bestellingen door Hermes stromen — van voorraad of grondstoffen tot levering, retour of afschrijving. Alle waarden in producteenheden, periode {resolvedPeriod.label} {resolvedPeriod.year}.
          </p>
        </div>

        {/* KPI summary row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          <div className="card d1">
            <SummaryCard
              icon="◷"
              label="Producteenheden verwerkt"
              value={totalSourced}
              trend={+8}
              t={t}
              colorKey="blue"
            />
          </div>
          <div className="card d2">
            <SummaryCard
              icon="✓"
              label="Geleverd · fulfillment-rate"
              value={fulfillmentRate}
              suffix="%"
              trend={+2}
              t={t}
              colorKey="green"
            />
          </div>
          <div className="card d3">
            <SummaryCard
              icon="◯"
              label="Verlies · afschrijvingsrate"
              value={lossRate}
              suffix="%"
              trend={-1}
              t={t}
              colorKey="red"
            />
          </div>
        </div>

        {/* Sankey chart card */}
        <div className="card d3" style={{
          background: t.bg, boxShadow: t.neu.raised,
          borderRadius: 22, padding: "24px 28px",
          marginBottom: 16,
        }}>
          {/* Column headers above the chart */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
            marginBottom: 18,
          }}>
            {["Bron", "Verwerking", "Vervulling", "Resultaat"].map((label, i) => (
              <div key={label} style={{
                fontSize: 10, fontWeight: 600, color: t.textTertiary,
                letterSpacing: 0.8, textTransform: "uppercase",
                textAlign: i === 3 ? "right" : "left",
                paddingRight: i === 3 ? 100 : 0,
                paddingLeft:  i === 0 ? 0 : 0,
              }}>
                {label}
              </div>
            ))}
          </div>

          <Sankey t={t} />

          {/* Legend */}
          <div style={{
            marginTop: 24, paddingTop: 18, borderTop: `1px solid ${t.divider}`,
            display: "flex", flexWrap: "wrap", gap: 16,
          }}>
            <LegendItem colorKey="purple" label="Grondstoffen / assemblage" t={t} />
            <LegendItem colorKey="blue"   label="Eindproduct / directe uitname" t={t} />
            <LegendItem colorKey="cloudLight" label="Nieuwe inkoop" t={t} />
            <LegendItem colorKey="amber"  label="Vervallen" t={t} />
            <LegendItem colorKey="orange" label="Beschadigd / gemorst" t={t} />
            <LegendItem colorKey="green"  label="Verzonden / geleverd" t={t} />
            <LegendItem colorKey="yellow" label="WIP / reserve" t={t} />
            <LegendItem colorKey="red"    label="Geannuleerd / afgeschreven" t={t} />
            <LegendItem colorKey="grey"   label="Geretourneerd" t={t} />
          </div>
        </div>

        {/* Helper text below */}
        <p style={{
          fontSize: 11, color: t.textTertiary, textAlign: "center",
          maxWidth: 620, margin: "8px auto 0", lineHeight: 1.6,
        }}>
          Hover over een knooppunt om alle bijbehorende stromen te markeren, of over een band om de specifieke hoeveelheid te zien.
        </p>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: "center", padding: "12px 32px 20px",
        fontSize: 11, color: t.textTertiary,
      }}>
        v0.1.0 · Nimbus · Hermes
      </footer>
    </div>
  );
}
