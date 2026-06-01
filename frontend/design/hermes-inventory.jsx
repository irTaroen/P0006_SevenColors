import { useState, useMemo } from "react";
import {
  Check, Clock, Warehouse, AlertCircle, AlertTriangle,
  Sun, Moon, ArrowRight, ShoppingCart, Layers, Box, Package
} from "lucide-react";

// ─── Design tokens (same Nimbus design system) ────────────────────────────────
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
  insetXs:   `inset -2px -2px 4px ${t.hi}, inset 2px 2px 4px ${t.shade}`,
});

// ─── NimbusMark ───────────────────────────────────────────────────────────────
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

// ─── Mock inventory data ──────────────────────────────────────────────────────
const INVENTORY = [
  { id: "sku-104", name: "Aluminium frame 60×40",     category: "Grondstof",   capacity: 800,  available: 540, reserved: 180, expired: 40 },
  { id: "sku-118", name: "Stalen scharnier M8",       category: "Grondstof",   capacity: 1200, available: 920, reserved: 220, expired: 30 },
  { id: "sku-411", name: "Houten paneel 120×80",      category: "Grondstof",   capacity: 600,  available: 410, reserved: 110, expired: 25 },
  { id: "sku-412", name: "Houten paneel 200×100",     category: "Grondstof",   capacity: 400,  available: 38,  reserved: 28,  expired: 8 },
  { id: "sku-202", name: "Eindproduct kast type A",   category: "Eindproduct", capacity: 240,  available: 165, reserved: 50,  expired: 5 },
  { id: "sku-203", name: "Eindproduct kast type B",   category: "Eindproduct", capacity: 200,  available: 25,  reserved: 12,  expired: 2 },
  { id: "sku-215", name: "Eindproduct lade compact",  category: "Eindproduct", capacity: 320,  available: 22,  reserved: 38,  expired: 10 },
  { id: "sku-218", name: "Eindproduct kast type C",   category: "Eindproduct", capacity: 180,  available: 142, reserved: 22,  expired: 4 },
  { id: "sku-307", name: "Verpakkingsdoos M",         category: "Verpakking",  capacity: 2400, available: 1180, reserved: 600, expired: 0 },
  { id: "sku-308", name: "Verpakkingsdoos L",         category: "Verpakking",  capacity: 1800, available: 240, reserved: 90,  expired: 15 },
  { id: "sku-509", name: "Schroef-set 6mm (250 stk)", category: "Verpakking",  capacity: 900,  available: 720, reserved: 160, expired: 0 },
];

const LOW_STOCK_THRESHOLD = 0.15;

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
      }}
    >{children}</button>
  );
};

// ─── KPI Summary card ─────────────────────────────────────────────────────────
const SummaryCard = ({ Icon, label, value, suffix, colorKey, t, sublabel }) => {
  const color = t.C[colorKey];
  return (
    <div style={{
      background: t.bg, boxShadow: t.neu.raised,
      borderRadius: 20, padding: "18px 22px",
      display: "flex", alignItems: "center", gap: 16,
      height: "100%", minHeight: 92,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: color.bg, boxShadow: t.neu.insetSm,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: color.fg, flexShrink: 0,
      }}>
        {Icon && <Icon size={20} strokeWidth={2} />}
      </div>
      <div style={{
        flex: 1, minWidth: 0,
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        <div style={{
          fontSize: 28, fontWeight: 700, color: t.textPrimary,
          letterSpacing: "-0.5px", lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}>
          {typeof value === "number" ? value.toLocaleString("nl-NL") : value}
          {suffix && <span style={{ fontSize: 14, color: t.textTertiary, fontWeight: 500 }}> {suffix}</span>}
        </div>
        <div style={{ fontSize: 11, color: t.textSecondary, fontWeight: 500, lineHeight: 1.3 }}>
          {label}
        </div>
        <div style={{
          fontSize: 10, color: t.textTertiary, lineHeight: 1.3,
          fontVariantNumeric: "tabular-nums", minHeight: 13,
        }}>
          {sublabel || "\u00A0"}
        </div>
      </div>
    </div>
  );
};

// ─── Horizontal bar — one row per SKU ─────────────────────────────────────────
// Layout: SKU code · product name · the bar · numeric values · low-stock flag
// The bar uses a rounded clipPath for clean outer corners with flat segment boundaries.
const HorizontalBar = ({ item, maxCapacity, t }) => {
  const [hover, setHover] = useState(null);  // "available" | "reserved" | "expired" | null

  // Bar pixel layout
  const barHeight = 22;
  const radius = 6;

  // Compute the absolute width of each segment, plus the full capacity
  // outline. We measure widths relative to the *maximum capacity in this tile*,
  // not the bar's own capacity — this keeps bars comparable within the tile.
  const totalUsed = item.available + item.reserved + item.expired;
  const stockPct = item.available / item.capacity;
  const isLow = stockPct < LOW_STOCK_THRESHOLD;
  const isCritical = stockPct < 0.08;

  // Percentage widths (of the bar track) so the bar scales responsively
  const capacityPct = (item.capacity / maxCapacity) * 100;
  const availablePct = (item.available / maxCapacity) * 100;
  const reservedPct  = (item.reserved  / maxCapacity) * 100;
  const expiredPct   = (item.expired   / maxCapacity) * 100;
  const usedPct      = availablePct + reservedPct + expiredPct;

  // Unique clipPath id so multiple bars don't collide
  const clipId = `hbar-${item.id}`;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "70px minmax(0, 1.6fr) minmax(0, 2.4fr) 84px 24px",
      gap: 12, alignItems: "center",
      padding: "8px 4px",
      borderRadius: 10,
      transition: "background 0.15s ease",
      position: "relative",
    }}>
      {/* SKU code */}
      <div style={{
        fontSize: 11, fontWeight: 600, color: t.textSecondary,
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{item.id}</div>

      {/* Product name */}
      <div style={{
        fontSize: 12, color: t.textPrimary, fontWeight: 500,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{item.name}</div>

      {/* The bar itself */}
      <div style={{
        position: "relative", width: "100%", height: barHeight + 8,
        display: "flex", alignItems: "center",
      }}>
        {/* Bar track — full chart width, very subtle so it's visible but quiet */}
        <div style={{
          position: "absolute", inset: `4px 0`,
          width: "100%", height: barHeight,
          background: t.bg, boxShadow: t.neu.insetXs,
          borderRadius: radius,
        }} />

        {/* Capacity outline — dashed border showing this item's full capacity
            within the chart's max-capacity scale */}
        <div style={{
          position: "absolute", top: 4, left: 0,
          width: `${capacityPct}%`, height: barHeight,
          border: `1px dashed ${t.divider}`,
          borderRadius: radius,
          opacity: 0.7, pointerEvents: "none",
        }} />

        {/* SVG-rendered fill stack — clip path keeps outer corners clean */}
        <svg
          width="100%" height={barHeight + 8}
          viewBox={`0 0 100 ${barHeight + 8}`}
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={0} y={4} width={usedPct} height={barHeight}
                rx={radius * (100 / 1000)} ry={radius * (barHeight / 1000)} />
            </clipPath>
          </defs>

          {/* Per-corner rounding is tricky inside a clipped viewBox because
              we're scaling X but not Y. The cleanest fix: render the silhouette
              as a real rounded rect that has correct corner geometry (in real
              pixel units, not stretched viewBox units). */}
        </svg>

        {/* The actual fill stack — rendered with DOM elements + clipPath via
            an outer div. Using DOM for the bar gives us proper non-stretched
            corner geometry without fighting the SVG aspect ratio. */}
        <div style={{
          position: "absolute", top: 4, left: 0,
          width: `${usedPct}%`, height: barHeight,
          borderRadius: radius,
          overflow: "hidden",          // this is the clip
          display: "flex", flexDirection: "row",
          opacity: hover ? 1 : 1,
          transition: "width 0.4s ease",
        }}>
          {/* Available */}
          {availablePct > 0 && (
            <div
              onMouseEnter={() => setHover("available")}
              onMouseLeave={() => setHover(null)}
              style={{
                width: `${(availablePct / usedPct) * 100}%`,
                background: t.C.green.fg, height: "100%",
                cursor: "pointer",
                transition: "opacity 0.2s ease",
                opacity: hover && hover !== "available" ? 0.4 : 1,
              }}
            />
          )}
          {/* Reserved */}
          {reservedPct > 0 && (
            <div
              onMouseEnter={() => setHover("reserved")}
              onMouseLeave={() => setHover(null)}
              style={{
                width: `${(reservedPct / usedPct) * 100}%`,
                background: t.C.blue.fg, height: "100%",
                cursor: "pointer",
                transition: "opacity 0.2s ease",
                opacity: hover && hover !== "reserved" ? 0.4 : 1,
                boxShadow: `-1.5px 0 0 ${t.bg}`,  // soft separator on the left
              }}
            />
          )}
          {/* Expired */}
          {expiredPct > 0 && (
            <div
              onMouseEnter={() => setHover("expired")}
              onMouseLeave={() => setHover(null)}
              style={{
                width: `${(expiredPct / usedPct) * 100}%`,
                background: t.C.amber.fg, height: "100%",
                cursor: "pointer",
                transition: "opacity 0.2s ease",
                opacity: hover && hover !== "expired" ? 0.4 : 1,
                boxShadow: `-1.5px 0 0 ${t.bg}`,  // soft separator on the left
              }}
            />
          )}
        </div>

        {/* Tooltip — floats above the bar when a segment is hovered */}
        {hover && (
          <div style={{
            position: "absolute", bottom: "100%", left: "50%",
            transform: "translateX(-50%)", marginBottom: 6,
            background: t.bg, boxShadow: t.neu.raisedSm,
            borderRadius: 8, padding: "6px 10px",
            fontSize: 11, color: t.textPrimary,
            whiteSpace: "nowrap", zIndex: 10, pointerEvents: "none",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{
                width: 7, height: 7, borderRadius: 2,
                background: hover === "available" ? t.C.green.fg
                          : hover === "reserved"  ? t.C.blue.fg
                          : t.C.amber.fg,
              }} />
              {hover === "available" && `Beschikbaar: ${item.available.toLocaleString("nl-NL")}`}
              {hover === "reserved"  && `Gereserveerd: ${item.reserved.toLocaleString("nl-NL")}`}
              {hover === "expired"   && `Vervallen: ${item.expired.toLocaleString("nl-NL")}`}
            </span>
          </div>
        )}
      </div>

      {/* Numeric breakdown */}
      <div style={{
        fontSize: 12, color: t.textPrimary, fontWeight: 600,
        fontVariantNumeric: "tabular-nums", textAlign: "right",
        whiteSpace: "nowrap",
      }}>
        {item.available.toLocaleString("nl-NL")}
        <span style={{ color: t.textTertiary, fontWeight: 400, fontSize: 11 }}>
          /{item.capacity.toLocaleString("nl-NL")}
        </span>
      </div>

      {/* Low-stock flag — Lucide alert icon on the right edge */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {isLow && (
          <div
            title={`${(stockPct * 100).toFixed(1)}% beschikbaar`}
            style={{
              width: 22, height: 22, borderRadius: "50%",
              background: isCritical ? t.C.red.bg : t.C.amber.bg,
              boxShadow: t.neu.insetXs,
              color: isCritical ? t.C.red.fg : t.C.amber.fg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <AlertTriangle size={12} strokeWidth={2.5} />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Category tile ────────────────────────────────────────────────────────────
// Holds one category's worth of horizontal-bar rows + a small header.
const CategoryTile = ({ title, Icon, accentKey, items, t }) => {
  const accent = t.C[accentKey];

  // Use the max capacity of the items in THIS tile as the bar-scale denominator
  // — so bars are comparable within the tile but not artificially squeezed by
  // an outlier capacity in the other tile.
  const maxCapacity = items.length > 0
    ? Math.max(...items.map((it) => it.capacity))
    : 1;

  const lowCount = items.filter((it) => (it.available / it.capacity) < LOW_STOCK_THRESHOLD).length;

  // Tile-level totals
  const totalAvailable = items.reduce((s, it) => s + it.available, 0);
  const totalReserved  = items.reduce((s, it) => s + it.reserved, 0);
  const totalCapacity  = items.reduce((s, it) => s + it.capacity, 0);
  const tileUtilization = totalCapacity > 0
    ? Math.round(((totalAvailable + totalReserved) / totalCapacity) * 100)
    : 0;

  return (
    <div style={{
      background: t.bg, boxShadow: t.neu.raised,
      borderRadius: 22, padding: "22px 24px",
      display: "flex", flexDirection: "column", gap: 14,
      height: "100%",
    }}>

      {/* Tile header — icon, title, count, low-stock indicator */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: accent.bg, boxShadow: t.neu.insetSm,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: accent.fg, flexShrink: 0,
          }}>
            <Icon size={18} strokeWidth={2} />
          </div>
          <div>
            <div style={{
              fontSize: 10, fontWeight: 600, color: t.textTertiary,
              letterSpacing: 0.6, textTransform: "uppercase",
            }}>Voorraad</div>
            <h3 style={{
              fontSize: 18, fontWeight: 700, color: t.textPrimary,
              letterSpacing: "-0.3px", lineHeight: 1.2,
            }}>{title}</h3>
          </div>
        </div>

        {/* Low-stock indicator pill */}
        {lowCount > 0 ? (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: t.C.red.bg, color: t.C.red.fg,
            boxShadow: t.neu.insetSm,
            padding: "4px 10px", borderRadius: 99,
            fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
          }}>
            <AlertTriangle size={11} strokeWidth={2.4} />
            {lowCount} laag
          </div>
        ) : (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: t.C.green.bg, color: t.C.green.fg,
            boxShadow: t.neu.insetSm,
            padding: "4px 10px", borderRadius: 99,
            fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
          }}>
            <Check size={11} strokeWidth={2.4} />
            Op niveau
          </div>
        )}
      </div>

      {/* Mini stats row — tile-level summary */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gap: 8,
        background: t.bg, boxShadow: t.neu.insetSm,
        borderRadius: 12, padding: "10px 14px",
      }}>
        <MiniStat label="Items" value={items.length} t={t} />
        <MiniStat label="Eenheden" value={(totalAvailable + totalReserved).toLocaleString("nl-NL")} t={t} />
        <MiniStat label="Bezetting" value={`${tileUtilization}%`} t={t} />
      </div>

      {/* Column header row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "70px minmax(0, 1.6fr) minmax(0, 2.4fr) 84px 24px",
        gap: 12, alignItems: "center",
        padding: "0 4px 4px",
        fontSize: 10, fontWeight: 600, color: t.textTertiary,
        letterSpacing: 0.5, textTransform: "uppercase",
        borderBottom: `1px solid ${t.divider}`,
      }}>
        <span>SKU</span>
        <span>Product</span>
        <span>Verdeling</span>
        <span style={{ textAlign: "right" }}>Voorraad</span>
        <span />
      </div>

      {/* Bar rows */}
      <div style={{
        display: "flex", flexDirection: "column", gap: 2,
        flex: 1,
      }}>
        {items.length === 0 ? (
          <div style={{
            padding: "30px 0", textAlign: "center",
            fontSize: 12, color: t.textTertiary,
          }}>Geen items in deze categorie.</div>
        ) : (
          items.map((item, idx) => (
            <div key={item.id} style={{
              borderBottom: idx < items.length - 1 ? `1px solid ${t.divider}` : "none",
            }}>
              <HorizontalBar item={item} maxCapacity={maxCapacity} t={t} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ─── Small stat inside the tile header ───────────────────────────────────────
const MiniStat = ({ label, value, t }) => (
  <div>
    <div style={{
      fontSize: 9, fontWeight: 600, color: t.textTertiary,
      letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 2,
    }}>{label}</div>
    <div style={{
      fontSize: 14, fontWeight: 700, color: t.textPrimary,
      fontVariantNumeric: "tabular-nums", letterSpacing: "-0.2px",
    }}>{value}</div>
  </div>
);

// ─── Restock alert row ───────────────────────────────────────────────────────
const RestockRow = ({ item, t }) => {
  const stockPct = item.available / item.capacity;
  const pctDisplay = (stockPct * 100).toFixed(1);
  const urgent = stockPct < 0.08;
  const palette = urgent ? t.C.red : t.C.amber;

  return (
    <div style={{
      background: t.bg, boxShadow: t.neu.raisedSm,
      borderRadius: 14, padding: "12px 16px",
      display: "grid",
      gridTemplateColumns: "auto 1fr auto auto",
      alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: palette.bg, boxShadow: t.neu.insetSm,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: palette.fg, flexShrink: 0,
      }}>
        <AlertCircle size={16} strokeWidth={2.2} />
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: t.textPrimary,
          lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{item.name}</div>
        <div style={{ fontSize: 10, color: t.textSecondary, lineHeight: 1.3, marginTop: 1 }}>
          {item.id} · {item.category}
        </div>
      </div>

      <div style={{ textAlign: "right" }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: palette.fg,
          fontVariantNumeric: "tabular-nums", lineHeight: 1,
        }}>
          {item.available}<span style={{ fontSize: 10, color: t.textTertiary, fontWeight: 500 }}> /{item.capacity}</span>
        </div>
      </div>

      <div style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        background: palette.bg, color: palette.fg,
        boxShadow: t.neu.insetSm,
        padding: "4px 10px", borderRadius: 99,
        fontSize: 10, fontWeight: 700, fontVariantNumeric: "tabular-nums",
      }}>
        <span style={{ width: 4, height: 4, borderRadius: "50%", background: palette.fg }} />
        {pctDisplay}%
      </div>
    </div>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────
export default function HermesInventoryPage() {
  const [themeName, setThemeName] = useState("light");
  const t = { ...THEMES[themeName] };
  t.neu = makeNeu(t);
  const isDark = themeName === "dark";

  // Split inventory by category
  const rawMaterials  = useMemo(() => INVENTORY.filter((it) => it.category === "Grondstof"),   []);
  const finalProducts = useMemo(() => INVENTORY.filter((it) => it.category === "Eindproduct"), []);
  // Packaging items still surface in the restock panel — they're just not in the headline tiles
  const allItems = INVENTORY;

  // Restock items (across all categories)
  const lowStockItems = useMemo(() => {
    return allItems
      .filter((it) => it.available / it.capacity < LOW_STOCK_THRESHOLD)
      .sort((a, b) => (a.available / a.capacity) - (b.available / b.capacity));
  }, []);

  // Top-level KPIs
  const totalAvailable = allItems.reduce((s, it) => s + it.available, 0);
  const totalReserved  = allItems.reduce((s, it) => s + it.reserved, 0);
  const totalCapacity  = allItems.reduce((s, it) => s + it.capacity, 0);
  const utilizationPct = Math.round(((totalAvailable + totalReserved) / totalCapacity) * 100);

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
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.15); opacity: 0.85; }
        }
        .card { animation: fade-up 0.5s ease both; }
        .card.d1 { animation-delay: 0.05s; }
        .card.d2 { animation-delay: 0.1s; }
        .card.d3 { animation-delay: 0.15s; }
        .card.d4 { animation-delay: 0.2s; }
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
            }}>Voorraad</h1>
          </div>
        </div>

        <NeuIconBtn t={t} onClick={() => setThemeName(isDark ? "light" : "dark")} ariaLabel="Schakel donker / licht">
          {isDark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
        </NeuIconBtn>
      </header>

      <main style={{ padding: "8px 36px 40px", flex: 1 }}>

        {/* Page title */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{
            fontSize: 28, fontWeight: 700, color: t.textPrimary,
            letterSpacing: "-0.6px", marginBottom: 6,
          }}>
            Voorraad <span style={{ color: t.cloudDeep, fontStyle: "italic" }}>overzicht</span>
          </h2>
          <p style={{ fontSize: 13, color: t.textSecondary, maxWidth: 640, lineHeight: 1.55 }}>
            Grondstoffen en eindproducten in één blik. Items met minder dan 15% beschikbare voorraad worden onderaan verzameld voor aanvulling.
          </p>
        </div>

        {/* KPI summary row — 3 cards instead of 4 */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16, marginBottom: 20, alignItems: "stretch",
        }}>
          <div className="card d1">
            <SummaryCard
              Icon={Check}
              label="Beschikbaar"
              value={totalAvailable}
              sublabel="vrij om uit te leveren"
              colorKey="green"
              t={t}
            />
          </div>
          <div className="card d1">
            <SummaryCard
              Icon={Clock}
              label="Gereserveerd"
              value={totalReserved}
              sublabel="vastgezet voor orders"
              colorKey="blue"
              t={t}
            />
          </div>
          <div className="card d2">
            <SummaryCard
              Icon={Warehouse}
              label="Bezetting magazijn"
              value={utilizationPct}
              suffix="%"
              colorKey="purple"
              sublabel={`${(totalAvailable + totalReserved).toLocaleString("nl-NL")} / ${totalCapacity.toLocaleString("nl-NL")} eenh.`}
              t={t}
            />
          </div>
        </div>

        {/* Two side-by-side tiles — Raw Materials vs Final Products */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 16, marginBottom: 20, alignItems: "stretch",
        }}>
          <div className="card d2">
            <CategoryTile
              title="Grondstoffen"
              Icon={Layers}
              accentKey="purple"
              items={rawMaterials}
              t={t}
            />
          </div>
          <div className="card d3">
            <CategoryTile
              title="Eindproducten"
              Icon={Box}
              accentKey="blue"
              items={finalProducts}
              t={t}
            />
          </div>
        </div>

        {/* Restock alert panel — full width, only shown when there are items */}
        {lowStockItems.length > 0 && (
          <div className="card d4" style={{
            background: t.bg, boxShadow: t.neu.raised,
            borderRadius: 22, padding: "22px 24px",
            display: "flex", flexDirection: "column", gap: 14,
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              gap: 12, flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: t.C.red.bg, boxShadow: t.neu.insetSm,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: t.C.red.fg, flexShrink: 0,
                }}>
                  <AlertCircle size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: t.textTertiary,
                    letterSpacing: 0.6, textTransform: "uppercase",
                  }}>Aanvulling nodig</div>
                  <h3 style={{
                    fontSize: 18, fontWeight: 700, color: t.textPrimary,
                    letterSpacing: "-0.3px",
                  }}>Lage voorraad</h3>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: t.C.red.bg, color: t.C.red.fg,
                  boxShadow: t.neu.insetSm,
                  padding: "5px 12px", borderRadius: 99,
                  fontSize: 11, fontWeight: 700,
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%", background: t.C.red.fg,
                    animation: "pulse-dot 2s ease-in-out infinite",
                  }} />
                  {lowStockItems.length} {lowStockItems.length === 1 ? "item" : "items"}
                </div>

                <button
                  style={{
                    background: t.bg, boxShadow: t.neu.raisedSm,
                    border: "none", outline: "none",
                    padding: "9px 16px", borderRadius: 99,
                    fontSize: 12, fontWeight: 600,
                    color: t.textPrimary, fontFamily: "'Poppins',sans-serif",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = t.neu.liftedSm;
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.color = t.cloudDeep;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = t.neu.raisedSm;
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.color = t.textPrimary;
                  }}
                >
                  <ShoppingCart size={13} strokeWidth={2} />
                  Bestellingen plaatsen
                  <ArrowRight size={13} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Threshold reminder */}
            <div style={{
              fontSize: 11, color: t.textTertiary, lineHeight: 1.5, paddingLeft: 4,
            }}>
              Drempelwaarde: <b style={{ color: t.textSecondary, fontWeight: 600 }}>15%</b> van magazijncapaciteit.
              Items onder de <b style={{ color: t.C.red.fg, fontWeight: 600 }}>8%</b> hebben kritieke voorrang.
            </div>

            {/* Grid of restock rows */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 10,
            }}>
              {lowStockItems.map((item) => (
                <RestockRow key={item.id} item={item} t={t} />
              ))}
            </div>
          </div>
        )}

        {/* Legend / helper text */}
        <div style={{
          marginTop: 20,
          background: t.bg, boxShadow: t.neu.raisedSm,
          borderRadius: 16, padding: "14px 20px",
          display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: t.textTertiary,
            letterSpacing: 0.6, textTransform: "uppercase",
          }}>Legenda</div>
          <LegendDot color={t.C.green.fg} label="Beschikbaar" t={t} />
          <LegendDot color={t.C.blue.fg}  label="Gereserveerd" t={t} />
          <LegendDot color={t.C.amber.fg} label="Vervallen" t={t} />
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 18, height: 18, borderRadius: "50%",
              background: t.C.red.bg, color: t.C.red.fg,
              boxShadow: t.neu.insetXs,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              <AlertTriangle size={10} strokeWidth={2.5} />
            </span>
            <span style={{ fontSize: 12, color: t.textSecondary }}>Lage voorraad (&lt;15%)</span>
          </div>
        </div>
      </main>

      <footer style={{
        textAlign: "center", padding: "12px 32px 20px",
        fontSize: 11, color: t.textTertiary,
      }}>
        v0.1.0 · Nimbus · Hermes
      </footer>
    </div>
  );
}

// ─── Legend dot ──────────────────────────────────────────────────────────────
const LegendDot = ({ color, label, t }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
    <span style={{
      width: 12, height: 12, borderRadius: 3,
      background: color, boxShadow: t.neu.insetXs,
    }} />
    <span style={{ fontSize: 12, color: t.textSecondary }}>{label}</span>
  </div>
);
