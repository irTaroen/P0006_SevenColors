import { useState, useMemo } from "react";

// ─── Design tokens (same Kairos/Hermes system) ───────────────────────────────
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

// ─── Status config: the single source of truth for status colors + labels ────
const STATUS_CONFIG = {
  approved:         { label: "Goedgekeurd",     colorKey: "green",  icon: "✓" },
  pending_approval: { label: "Wacht op akkoord", colorKey: "amber",  icon: "◷" },
  stock_blocked:    { label: "Onvoldoende voorraad", colorKey: "red",    icon: "!" },
  in_progress:      { label: "In behandeling",   colorKey: "blue",   icon: "▸" },
  shipped:          { label: "Verzonden",        colorKey: "purple", icon: "→" },
  delivered:        { label: "Geleverd",         colorKey: "grey",   icon: "◉" },
};

// ─── Mock orders data ─────────────────────────────────────────────────────────
const ORDERS = [
  {
    id: "ORD-2026-0418",
    placedDate: "16-04-2026",
    deliveryDate: "23-04-2026",
    client: { code: "CL-1042", name: "Beumer Logistics BV" },
    status: "approved",
    items: [
      { sku: "sku-202", name: "Eindproduct kast type A",  qty: 12, unitPrice: 245.00, stock: "ok",   stockAvailable: 165 },
      { sku: "sku-307", name: "Verpakkingsdoos M",         qty: 24, unitPrice: 4.80,  stock: "ok",   stockAvailable: 1180 },
      { sku: "sku-509", name: "Schroef-set 6mm (250 stk)", qty: 4,  unitPrice: 18.50, stock: "ok",   stockAvailable: 720 },
    ],
  },
  {
    id: "ORD-2026-0419",
    placedDate: "16-04-2026",
    deliveryDate: "30-04-2026",
    client: { code: "CL-2188", name: "VanRiel Distribution" },
    status: "pending_approval",
    items: [
      { sku: "sku-104", name: "Aluminium frame 60×40", qty: 80, unitPrice: 32.00, stock: "ok", stockAvailable: 540 },
      { sku: "sku-411", name: "Houten paneel 120×80",  qty: 60, unitPrice: 48.00, stock: "ok", stockAvailable: 410 },
    ],
  },
  {
    id: "ORD-2026-0420",
    placedDate: "17-04-2026",
    deliveryDate: "24-04-2026",
    client: { code: "CL-0917", name: "H. Essers Transport" },
    status: "stock_blocked",
    items: [
      { sku: "sku-203", name: "Eindproduct kast type B",  qty: 40, unitPrice: 285.00, stock: "short", stockAvailable: 25, shortage: 15 },
      { sku: "sku-215", name: "Eindproduct lade compact", qty: 30, unitPrice: 78.00,  stock: "short", stockAvailable: 22, shortage: 8 },
      { sku: "sku-307", name: "Verpakkingsdoos M",         qty: 50, unitPrice: 4.80,   stock: "ok",    stockAvailable: 1180 },
    ],
  },
  {
    id: "ORD-2026-0421",
    placedDate: "17-04-2026",
    deliveryDate: "01-05-2026",
    client: { code: "CL-1042", name: "Beumer Logistics BV" },
    status: "in_progress",
    items: [
      { sku: "sku-118", name: "Stalen scharnier M8", qty: 200, unitPrice: 2.40, stock: "ok", stockAvailable: 920 },
      { sku: "sku-509", name: "Schroef-set 6mm (250 stk)", qty: 8, unitPrice: 18.50, stock: "ok", stockAvailable: 720 },
    ],
  },
  {
    id: "ORD-2026-0422",
    placedDate: "15-04-2026",
    deliveryDate: "22-04-2026",
    client: { code: "CL-3401", name: "Kuipers & Zoon" },
    status: "shipped",
    items: [
      { sku: "sku-202", name: "Eindproduct kast type A", qty: 6, unitPrice: 245.00, stock: "ok", stockAvailable: 165 },
      { sku: "sku-308", name: "Verpakkingsdoos L",       qty: 12, unitPrice: 6.20,  stock: "ok", stockAvailable: 240 },
    ],
  },
  {
    id: "ORD-2026-0423",
    placedDate: "17-04-2026",
    deliveryDate: "28-04-2026",
    client: { code: "CL-2188", name: "VanRiel Distribution" },
    status: "stock_blocked",
    items: [
      { sku: "sku-412", name: "Houten paneel 200×100", qty: 40, unitPrice: 92.00, stock: "short", stockAvailable: 38, shortage: 2 },
      { sku: "sku-411", name: "Houten paneel 120×80",  qty: 25, unitPrice: 48.00, stock: "ok",    stockAvailable: 410 },
    ],
  },
  {
    id: "ORD-2026-0424",
    placedDate: "14-04-2026",
    deliveryDate: "21-04-2026",
    client: { code: "CL-0917", name: "H. Essers Transport" },
    status: "delivered",
    items: [
      { sku: "sku-202", name: "Eindproduct kast type A", qty: 8, unitPrice: 245.00, stock: "ok", stockAvailable: 165 },
    ],
  },
  {
    id: "ORD-2026-0425",
    placedDate: "18-04-2026",
    deliveryDate: "02-05-2026",
    client: { code: "CL-3401", name: "Kuipers & Zoon" },
    status: "pending_approval",
    items: [
      { sku: "sku-104", name: "Aluminium frame 60×40", qty: 50, unitPrice: 32.00, stock: "ok", stockAvailable: 540 },
      { sku: "sku-118", name: "Stalen scharnier M8",   qty: 120, unitPrice: 2.40, stock: "ok", stockAvailable: 920 },
      { sku: "sku-308", name: "Verpakkingsdoos L",     qty: 20, unitPrice: 6.20,  stock: "ok", stockAvailable: 240 },
    ],
  },
];

// ─── Derived helpers ─────────────────────────────────────────────────────────
const formatCurrency = (v) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(v);

const orderTotal = (order) =>
  order.items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0);

const orderItemCount = (order) =>
  order.items.reduce((sum, it) => sum + it.qty, 0);

// ─── Theme toggle ────────────────────────────────────────────────────────────
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
// absolute month shown as a subtitle below. Offset is the source of truth:
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


// ─── Status filter pill row ──────────────────────────────────────────────────
const StatusFilters = ({ active, onChange, counts, t }) => {
  const filters = [
    { key: "all", label: "Alle" },
    { key: "pending_approval", label: STATUS_CONFIG.pending_approval.label },
    { key: "stock_blocked",    label: STATUS_CONFIG.stock_blocked.label },
    { key: "approved",         label: STATUS_CONFIG.approved.label },
    { key: "in_progress",      label: STATUS_CONFIG.in_progress.label },
    { key: "shipped",          label: STATUS_CONFIG.shipped.label },
    { key: "delivered",        label: STATUS_CONFIG.delivered.label },
  ];

  return (
    <div style={{
      display: "flex", gap: 6, flexWrap: "wrap",
      background: t.bg, boxShadow: t.neu.insetSm,
      borderRadius: 99, padding: 5,
    }}>
      {filters.map((f) => {
        const isActive = active === f.key;
        const cfg = f.key !== "all" ? STATUS_CONFIG[f.key] : null;
        const color = cfg ? t.C[cfg.colorKey] : null;
        const count = counts[f.key] || 0;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            style={{
              background: isActive ? t.bg : "transparent",
              boxShadow: isActive ? t.neu.raisedSm : "none",
              color: isActive
                ? (color ? color.fg : t.textPrimary)
                : t.textSecondary,
              border: "none", outline: "none",
              padding: "7px 14px", borderRadius: 99,
              fontSize: 12, fontWeight: isActive ? 600 : 500,
              fontFamily: "'Poppins',sans-serif", cursor: "pointer",
              transition: "all 0.2s ease",
              display: "inline-flex", alignItems: "center", gap: 7,
              whiteSpace: "nowrap",
            }}
          >
            {cfg && (
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: color.fg,
              }} />
            )}
            {f.label}
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: isActive ? (color ? color.fg : t.textTertiary) : t.textTertiary,
              opacity: 0.7,
              fontVariantNumeric: "tabular-nums",
            }}>{count}</span>
          </button>
        );
      })}
    </div>
  );
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, t }) => {
  const cfg = STATUS_CONFIG[status];
  const color = t.C[cfg.colorKey];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: color.bg, color: color.fg,
      boxShadow: t.neu.insetSm,
      padding: "4px 11px", borderRadius: 99,
      fontSize: 11, fontWeight: 600, lineHeight: 1.3,
      whiteSpace: "nowrap",
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: "50%", background: color.fg, flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  );
};

// ─── Stock chip on an item line ──────────────────────────────────────────────
const StockChip = ({ item, t }) => {
  if (item.stock === "ok") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 11, color: t.C.green.fg, fontWeight: 500,
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: "50%", background: t.C.green.fg,
        }} />
        Op voorraad
      </span>
    );
  }
  // Short
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: t.C.red.bg, color: t.C.red.fg,
      boxShadow: t.neu.insetSm,
      padding: "3px 9px", borderRadius: 99,
      fontSize: 10.5, fontWeight: 600, lineHeight: 1.3,
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.C.red.fg }} />
      Tekort {item.shortage}
    </span>
  );
};

// ─── Em-dash for nulls ───────────────────────────────────────────────────────
const EmDash = ({ t }) => (
  <span style={{ color: t.textTertiary, fontWeight: 300 }}>—</span>
);

// ─── Order row (collapsible) ─────────────────────────────────────────────────
const ORDER_ROW_TEMPLATE =
  "20px minmax(0, 1.3fr) minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 0.7fr) minmax(0, 1fr) minmax(0, 1.6fr)";

const ITEM_ROW_TEMPLATE =
  "20px minmax(0, 1.3fr) minmax(0, 2.6fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 0.7fr) minmax(0, 1fr) minmax(0, 1.6fr)";

const OrderRow = ({ order, open, onToggle, t }) => {
  const total = orderTotal(order);
  const itemCount = orderItemCount(order);

  return (
    <>
      {/* Collapsed summary row */}
      <div
        onClick={onToggle}
        style={{
          display: "grid",
          gridTemplateColumns: ORDER_ROW_TEMPLATE,
          alignItems: "center", gap: 0,
          padding: "16px 8px",
          background: t.bg,
          boxShadow: open ? t.neu.insetSm : "none",
          borderRadius: 12,
          cursor: "pointer",
          transition: "all 0.25s ease",
          fontSize: 13,
        }}
      >
        {/* Chevron */}
        <span style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          color: t.textTertiary, fontSize: 10,
          transition: "transform 0.2s ease",
          transform: open ? "rotate(90deg)" : "rotate(0)",
        }}>▶</span>

        {/* Order ID */}
        <div style={{ paddingLeft: 4, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: t.textPrimary,
            fontVariantNumeric: "tabular-nums",
          }}>{order.id}</div>
        </div>

        {/* Client */}
        <div style={{ minWidth: 0, paddingRight: 8 }}>
          <div style={{
            fontSize: 12, color: t.textPrimary, fontWeight: 500,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{order.client.name}</div>
          <div style={{
            fontSize: 11, color: t.textTertiary,
            fontVariantNumeric: "tabular-nums",
          }}>{order.client.code}</div>
        </div>

        {/* Placed date */}
        <div style={{
          fontSize: 12, color: t.textSecondary,
          fontVariantNumeric: "tabular-nums",
        }}>{order.placedDate}</div>

        {/* Delivery date */}
        <div style={{
          fontSize: 12, color: t.textSecondary,
          fontVariantNumeric: "tabular-nums",
        }}>{order.deliveryDate}</div>

        {/* Item count */}
        <div style={{
          fontSize: 13, fontWeight: 600, color: t.textPrimary,
          fontVariantNumeric: "tabular-nums",
        }}>{itemCount}</div>

        {/* Total */}
        <div style={{
          fontSize: 13, fontWeight: 600, color: t.textPrimary,
          fontVariantNumeric: "tabular-nums", textAlign: "right",
          paddingRight: 12,
        }}>{formatCurrency(total)}</div>

        {/* Status */}
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <StatusBadge status={order.status} t={t} />
        </div>
      </div>

      {/* Expanded line items */}
      {open && (
        <div style={{
          marginLeft: 38, marginRight: 8,
          marginTop: 8, marginBottom: 4,
          paddingBottom: 8,
        }}>
          {order.items.map((item, i) => (
            <div
              key={`${order.id}-${item.sku}`}
              className="item-row"
              style={{
                display: "grid",
                gridTemplateColumns: ITEM_ROW_TEMPLATE,
                alignItems: "center", gap: 0,
                padding: "10px 8px",
                borderBottom: i < order.items.length - 1 ? `1px dashed ${t.divider}` : "none",
                fontSize: 12,
                animationDelay: `${i * 30}ms`,
              }}
            >
              {/* Empty chevron slot */}
              <span />

              {/* SKU */}
              <div style={{
                fontSize: 12, color: t.textSecondary, fontWeight: 500,
                fontVariantNumeric: "tabular-nums",
              }}>{item.sku}</div>

              {/* Product name */}
              <div style={{
                fontSize: 12, color: t.textPrimary, fontWeight: 500,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                paddingRight: 8,
              }}>{item.name}</div>

              {/* Qty */}
              <div style={{
                fontSize: 12, color: t.textPrimary,
                fontVariantNumeric: "tabular-nums",
              }}>
                <span style={{ color: t.textTertiary, fontSize: 10 }}>× </span>
                {item.qty}
              </div>

              {/* Unit price */}
              <div style={{
                fontSize: 12, color: t.textSecondary,
                fontVariantNumeric: "tabular-nums",
              }}>{formatCurrency(item.unitPrice)}</div>

              {/* Available stock */}
              <div style={{
                fontSize: 12, color: t.textTertiary,
                fontVariantNumeric: "tabular-nums",
              }}>{item.stockAvailable}</div>

              {/* Line total */}
              <div style={{
                fontSize: 12, fontWeight: 600, color: t.textPrimary,
                fontVariantNumeric: "tabular-nums", textAlign: "right",
                paddingRight: 12,
              }}>{formatCurrency(item.qty * item.unitPrice)}</div>

              {/* Stock status chip */}
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <StockChip item={item} t={t} />
              </div>
            </div>
          ))}

          {/* Action footer for stock_blocked / pending */}
          {(order.status === "stock_blocked" || order.status === "pending_approval") && (
            <div style={{
              marginTop: 12,
              padding: "10px 12px",
              background: t.bg, boxShadow: t.neu.insetSm,
              borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            }}>
              <div style={{ fontSize: 11, color: t.textSecondary }}>
                {order.status === "stock_blocked"
                  ? <>Order kan niet worden goedgekeurd — herzie hoeveelheden of plaats een aanvulorder voor de getekortte SKU's.</>
                  : <>Order wacht op handmatige goedkeuring door een teamleider.</>}
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {order.status === "stock_blocked" ? (
                  <ActionButton label="Voorraad bijbestellen" variant="primary" t={t} />
                ) : (
                  <>
                    <ActionButton label="Afwijzen" variant="secondary" t={t} />
                    <ActionButton label="Goedkeuren" variant="primary" t={t} />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

// ─── Action button (small inline variant for the row footers) ────────────────
const ActionButton = ({ label, variant, t, onClick }) => {
  const [hov, setHov] = useState(false);
  const [pressed, setPressed] = useState(false);
  const isPrimary = variant === "primary";

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: t.bg,
        boxShadow: pressed
          ? (isPrimary ? t.neu.insetSm : t.neu.insetXs)
          : (hov ? (isPrimary ? t.neu.lifted : t.neu.liftedSm)
                 : (isPrimary ? t.neu.raisedSm : t.neu.raisedSm)),
        transform: pressed ? "translateY(0)" : (hov ? "translateY(-1px)" : "translateY(0)"),
        border: "none", outline: "none",
        padding: "7px 14px", borderRadius: 99,
        fontSize: 11, fontWeight: isPrimary ? 600 : 500,
        color: isPrimary
          ? (hov || pressed ? t.cloudDeep : t.textPrimary)
          : t.textSecondary,
        fontFamily: "'Poppins',sans-serif", cursor: "pointer",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
};

// ─── Sortable column header ──────────────────────────────────────────────────
// Click to cycle: none → asc → desc → none. Shows an arrow indicator when active.
const SortableHeader = ({ label, columnKey, sortColumn, sortDirection, onSort, align = "left", t }) => {
  const [hov, setHov] = useState(false);
  const isActive = sortColumn === columnKey;
  const arrow = isActive ? (sortDirection === "asc" ? "↑" : "↓") : "";

  return (
    <button
      onClick={() => onSort(columnKey)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "none", border: "none", outline: "none",
        padding: 0, cursor: "pointer",
        fontFamily: "'Poppins',sans-serif",
        display: "inline-flex", alignItems: "center", gap: 4,
        justifyContent: align === "right" ? "flex-end" : "flex-start",
        width: "100%",
        fontSize: 10, fontWeight: isActive ? 600 : 500,
        color: isActive ? t.cloudDeep : (hov ? t.textSecondary : t.textTertiary),
        letterSpacing: 0.5, textTransform: "uppercase",
        transition: "color 0.15s ease",
        paddingRight: align === "right" ? 12 : 0,
      }}
    >
      {label}
      <span style={{
        fontSize: 11, lineHeight: 1,
        opacity: isActive ? 1 : (hov ? 0.4 : 0),
        transition: "opacity 0.15s ease",
        marginLeft: 1,
      }}>{arrow || "↕"}</span>
    </button>
  );
};

// ─── Column filter input ─────────────────────────────────────────────────────
// A neumorphic inset text input that lives directly beneath a column header.
const ColumnFilter = ({ value, onChange, placeholder, t }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "5px 10px",
        background: t.bg,
        boxShadow: focused
          ? `${t.neu.insetXs}, 0 0 0 2px ${t.cloudLight}`
          : t.neu.insetXs,
        border: "none", outline: "none",
        borderRadius: 99,
        fontSize: 11, color: t.textPrimary,
        fontFamily: "'Poppins',sans-serif",
        transition: "box-shadow 0.2s ease",
      }}
    />
  );
};


// ─── Main page ────────────────────────────────────────────────────────────────
export default function HermesOrdersPage() {
  const [themeName, setThemeName] = useState("light");
  const t = { ...THEMES[themeName] };
  t.neu = makeNeu(t);
  const isDark = themeName === "dark";

  const [openRows, setOpenRows] = useState(new Set(["ORD-2026-0420"])); // start with the blocked one open
  const [activeFilter, setActiveFilter] = useState("all");
  const [periodOffset, setPeriodOffset] = useState(0);
  const resolvedPeriod = resolveMonth(periodOffset);

  // Column-level filters (text inputs in the header row)
  const [columnFilters, setColumnFilters] = useState({ order: "", client: "" });

  // Sorting state — cycles none → asc → desc → none on repeated clicks of the same column
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);

  const handleSort = (col) => {
    if (sortColumn !== col) {
      setSortColumn(col); setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      // Third click clears the sort
      setSortColumn(null); setSortDirection(null);
    }
  };

  const toggleRow = (id) => setOpenRows((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // Comparator factory — returns the value to sort by for each column key
  const sortKey = (order, col) => {
    switch (col) {
      case "order":     return order.id;
      case "client":    return order.client.name.toLowerCase();
      case "placed":    return order.placedDate.split("-").reverse().join(""); // dd-mm-yyyy → yyyymmdd for lexicographic compare
      case "delivery":  return order.deliveryDate.split("-").reverse().join("");
      case "items":     return orderItemCount(order);
      case "total":     return orderTotal(order);
      case "status":    return order.status;
      default: return 0;
    }
  };

  // Apply: status filter → column text filters → sort
  const visibleOrders = useMemo(() => {
    let arr = ORDERS;

    if (activeFilter !== "all") {
      arr = arr.filter((o) => o.status === activeFilter);
    }

    const orderQ = columnFilters.order.trim().toLowerCase();
    const clientQ = columnFilters.client.trim().toLowerCase();
    if (orderQ) {
      arr = arr.filter((o) => o.id.toLowerCase().includes(orderQ));
    }
    if (clientQ) {
      arr = arr.filter((o) =>
        o.client.name.toLowerCase().includes(clientQ) ||
        o.client.code.toLowerCase().includes(clientQ)
      );
    }

    if (sortColumn && sortDirection) {
      arr = [...arr].sort((a, b) => {
        const av = sortKey(a, sortColumn);
        const bv = sortKey(b, sortColumn);
        if (av < bv) return sortDirection === "asc" ? -1 : 1;
        if (av > bv) return sortDirection === "asc" ?  1 : -1;
        return 0;
      });
    }

    return arr;
  }, [activeFilter, columnFilters, sortColumn, sortDirection]);

  // Counts for filter badges
  const counts = useMemo(() => {
    const c = { all: ORDERS.length };
    Object.keys(STATUS_CONFIG).forEach((k) => {
      c[k] = ORDERS.filter((o) => o.status === k).length;
    });
    return c;
  }, []);

  // Summary KPI numbers
  const totalValue = ORDERS.reduce((s, o) => s + orderTotal(o), 0);
  const pendingCount = counts.pending_approval;
  const blockedCount = counts.stock_blocked;
  const approvedValue = ORDERS
    .filter((o) => ["approved", "in_progress", "shipped", "delivered"].includes(o.status))
    .reduce((s, o) => s + orderTotal(o), 0);

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
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-6px); }
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
        .item-row { animation: slide-down 0.25s ease both; }
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
            }}>Orders</h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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

        {/* Page title */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{
            fontSize: 28, fontWeight: 700, color: t.textPrimary,
            letterSpacing: "-0.6px", marginBottom: 6,
          }}>
            Bestellingen <span style={{ color: t.cloudDeep, fontStyle: "italic" }}>overzicht</span>
          </h2>
          <p style={{ fontSize: 13, color: t.textSecondary, maxWidth: 640, lineHeight: 1.55 }}>
            Klik op een order om de regels te bekijken. Orders met voorraadtekorten of openstaande goedkeuring vereisen handmatige aandacht.
          </p>
        </div>

        {/* KPI summary row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
          <div className="card d1" style={{
            background: t.bg, boxShadow: t.neu.raised,
            borderRadius: 20, padding: "18px 22px",
          }}>
            <div style={{
              fontSize: 11, color: t.textSecondary, fontWeight: 500,
              marginBottom: 8,
            }}>Orders totaal</div>
            <div style={{
              fontSize: 28, fontWeight: 700, color: t.textPrimary,
              fontVariantNumeric: "tabular-nums", letterSpacing: "-0.5px",
            }}>{ORDERS.length}</div>
          </div>

          <div className="card d1" style={{
            background: t.bg, boxShadow: t.neu.raised,
            borderRadius: 20, padding: "18px 22px",
            position: "relative",
          }}>
            <div style={{
              fontSize: 11, color: t.textSecondary, fontWeight: 500,
              marginBottom: 8, display: "flex", alignItems: "center", gap: 6,
            }}>
              Wacht op akkoord
              {pendingCount > 0 && (
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", background: t.C.amber.fg,
                  animation: "pulse-dot 2s ease-in-out infinite",
                }} />
              )}
            </div>
            <div style={{
              fontSize: 28, fontWeight: 700,
              color: pendingCount > 0 ? t.C.amber.fg : t.textPrimary,
              fontVariantNumeric: "tabular-nums", letterSpacing: "-0.5px",
            }}>{pendingCount}</div>
          </div>

          <div className="card d2" style={{
            background: t.bg, boxShadow: t.neu.raised,
            borderRadius: 20, padding: "18px 22px",
          }}>
            <div style={{
              fontSize: 11, color: t.textSecondary, fontWeight: 500,
              marginBottom: 8, display: "flex", alignItems: "center", gap: 6,
            }}>
              Voorraad geblokkeerd
              {blockedCount > 0 && (
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", background: t.C.red.fg,
                  animation: "pulse-dot 2s ease-in-out infinite",
                }} />
              )}
            </div>
            <div style={{
              fontSize: 28, fontWeight: 700,
              color: blockedCount > 0 ? t.C.red.fg : t.textPrimary,
              fontVariantNumeric: "tabular-nums", letterSpacing: "-0.5px",
            }}>{blockedCount}</div>
          </div>

          <div className="card d2" style={{
            background: t.bg, boxShadow: t.neu.raised,
            borderRadius: 20, padding: "18px 22px",
          }}>
            <div style={{
              fontSize: 11, color: t.textSecondary, fontWeight: 500,
              marginBottom: 8,
            }}>Goedgekeurde waarde</div>
            <div style={{
              fontSize: 22, fontWeight: 700, color: t.textPrimary,
              fontVariantNumeric: "tabular-nums", letterSpacing: "-0.5px",
            }}>{formatCurrency(approvedValue)}</div>
          </div>
        </div>

        {/* Filter row */}
        <div className="card d2" style={{ marginBottom: 16, display: "flex", justifyContent: "flex-start" }}>
          <StatusFilters active={activeFilter} onChange={setActiveFilter} counts={counts} t={t} />
        </div>

        {/* Table panel */}
        <div className="card d3" style={{
          background: t.bg, boxShadow: t.neu.raised,
          borderRadius: 22,
          padding: 0,
          display: "flex", flexDirection: "column",
          // Cap the height so the body becomes scrollable.
          // 60vh keeps the table within typical viewports.
          height: "60vh", minHeight: 420,
          overflow: "hidden",
        }}>

          {/* Sticky header section (column titles + filter inputs) */}
          <div style={{
            flexShrink: 0,
            padding: "12px 16px 10px",
            background: t.bg,
            // Subtle bottom shadow so scrolling content reads as "underneath"
            boxShadow: `0 4px 8px -6px ${t.shade}`,
            zIndex: 2,
          }}>

            {/* Column titles row — sortable */}
            <div style={{
              display: "grid",
              gridTemplateColumns: ORDER_ROW_TEMPLATE,
              alignItems: "center", gap: 0,
              padding: "8px 8px 6px",
            }}>
              <span />
              <SortableHeader label="Order"     columnKey="order"    sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} t={t} />
              <SortableHeader label="Klant"     columnKey="client"   sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} t={t} />
              <SortableHeader label="Geplaatst" columnKey="placed"   sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} t={t} />
              <SortableHeader label="Levering"  columnKey="delivery" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} t={t} />
              <SortableHeader label="Items"     columnKey="items"    sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} t={t} />
              <SortableHeader label="Totaal"    columnKey="total"    sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} align="right" t={t} />
              <SortableHeader label="Status"    columnKey="status"   sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} t={t} />
            </div>

            {/* Column filters row — text inputs under each column header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: ORDER_ROW_TEMPLATE,
              alignItems: "center", gap: 0,
              padding: "4px 8px 6px",
            }}>
              <span />
              <div style={{ paddingRight: 8 }}>
                <ColumnFilter
                  value={columnFilters.order}
                  onChange={(v) => setColumnFilters((c) => ({ ...c, order: v }))}
                  placeholder="Zoek order…"
                  t={t}
                />
              </div>
              <div style={{ paddingRight: 8 }}>
                <ColumnFilter
                  value={columnFilters.client}
                  onChange={(v) => setColumnFilters((c) => ({ ...c, client: v }))}
                  placeholder="Zoek klant…"
                  t={t}
                />
              </div>
              {/* Date, items, total, status columns intentionally left blank.
                  Date columns deserve a range picker (future work); items + total are low-value
                  text filters; status has its own pill row above. */}
              <span /><span /><span /><span /><span />
            </div>
          </div>

          {/* Scrollable body */}
          <div style={{
            flex: 1, overflowY: "auto", overflowX: "hidden",
            padding: "6px 16px 16px",
          }}>
            {visibleOrders.length === 0 ? (
              <div style={{
                padding: "60px 20px", textAlign: "center",
                fontSize: 13, color: t.textTertiary,
              }}>
                Geen orders gevonden — pas de filters aan.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {visibleOrders.map((order, idx) => (
                  <div
                    key={order.id}
                    style={{
                      borderBottom: idx < visibleOrders.length - 1
                        ? `1px solid ${t.divider}`
                        : "none",
                    }}
                  >
                    <OrderRow
                      order={order}
                      open={openRows.has(order.id)}
                      onToggle={() => toggleRow(order.id)}
                      t={t}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Helper text */}
        <p style={{
          fontSize: 11, color: t.textTertiary, textAlign: "center",
          maxWidth: 620, margin: "16px auto 0", lineHeight: 1.6,
        }}>
          Klik op een rij om de orderregels te tonen. Geblokkeerde orders tonen welke SKU's tekort komen.
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
