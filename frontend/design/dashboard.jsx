import { useState } from "react";

// ─── Design tokens (light + dark themes) ──────────────────────────────────────
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
    // Bar pastels for the capacity bar
    capUnder: "#FFB38E",
    capExact: "#C7EABB",
    capOver:  "#BFECFF",
    // Ambient background — none in light mode
    ambient: "transparent",
    // Semantic colors
    C: {
      amber:  { fg: "#b87333", bg: "#f0d9b8" },
      red:    { fg: "#b04545", bg: "#f0c8c8" },
      purple: { fg: "#7a5fb3", bg: "#d8cfeb" },
      orange: { fg: "#c4763a", bg: "#f2d5b8" },
      cyan:   { fg: "#4a8fa8", bg: "#c8e0e8" },
      green:  { fg: "#5a8a4a", bg: "#d2e2c0" },
      grey:   { fg: "#6b6f7e", bg: "#dcdbd4" },
      yellow: { fg: "#a38a2a", bg: "#ece1b8" },
    },
  },
  dark: {
    // Deep warm-purple-black base — the "lights off" version of the cream
    bg: "#1a1626",
    // For neumorphism: highlight slightly lighter than base, shade slightly darker
    shade: "#0f0c18",
    hi: "#2a2438",
    textPrimary: "#e8e4f0",
    textSecondary: "#a8a2bc",
    textTertiary: "#6c6580",
    divider: "#2f2940",
    // Cloud-blue shifts slightly brighter to glow on dark
    cloudLight: "#7ac4e8",
    cloudMid: "#5fa8d3",
    cloudDeep: "#a5d8f0",
    // Pastel bars stay vivid against dark
    capUnder: "#FFB38E",
    capExact: "#C7EABB",
    capOver:  "#BFECFF",
    // Ambient cosmic glow — subtle radial gradient behind everything
    ambient: "radial-gradient(ellipse at 20% 10%, rgba(139, 92, 246, 0.12), transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(245, 158, 79, 0.08), transparent 50%), radial-gradient(ellipse at 60% 50%, rgba(245, 215, 110, 0.05), transparent 60%)",
    // Semantic colors — brighter, more saturated to glow on dark
    C: {
      amber:  { fg: "#f5a04f", bg: "#3a2818" },
      red:    { fg: "#e87878", bg: "#3a1f1f" },
      purple: { fg: "#b794f6", bg: "#2e2348" },
      orange: { fg: "#f59e4f", bg: "#3a2614" },
      cyan:   { fg: "#7ac4e0", bg: "#1a2c32" },
      green:  { fg: "#9bcf85", bg: "#1f2e1a" },
      grey:   { fg: "#9d9db4", bg: "#28253a" },
      yellow: { fg: "#f5d76e", bg: "#352c14" },
    },
  },
};

// Build neumorphic shadow primitives from theme tokens
const makeNeu = (t) => ({
  raised:    `-6px -6px 12px ${t.hi}, 6px 6px 12px ${t.shade}`,
  raisedSm:  `-4px -4px 8px ${t.hi}, 4px 4px 8px ${t.shade}`,
  raisedXs:  `-2px -2px 4px ${t.hi}, 2px 2px 4px ${t.shade}`,
  lifted:    `-8px -8px 16px ${t.hi}, 8px 8px 16px ${t.shade}`,
  liftedSm:  `-6px -6px 12px ${t.hi}, 6px 6px 12px ${t.shade}`,
  inset:     `inset -4px -4px 8px ${t.hi}, inset 4px 4px 8px ${t.shade}`,
  insetSm:   `inset -3px -3px 6px ${t.hi}, inset 3px 3px 6px ${t.shade}`,
});

// ─── Mock data matching real Kairos schema ────────────────────────────────────
const kpis = [
  { id: "compleet",     value: 1190, label: "Weken niet compleet",        icon: "📋", colorKey: "amber" },
  { id: "geaccordeerd", value: 1388, label: "Regels niet geaccordeerd",   icon: "✓",  colorKey: "red" },
  { id: "payroll",      value: 1,    label: "Dagen niet geaccordeerd voor payroll", icon: "€", colorKey: "purple" },
  { id: "capaciteit",   value: 103,  label: "Dagen over capaciteit",      icon: "▲",  colorKey: "grey" },
  { id: "dubbel",       value: 55,   label: "Dagen met dubbele boekingen", icon: "⊞", colorKey: "yellow" },
];

const weekData = [
  {
    medewerker: { code: "CW-35-DR4", naam: "Wojtek Debowski" },
    leiding:    { code: "WO-04210",  naam: "John Maas" },
    werkgever:  { code: "02",        naam: "H. Essers Transport Company" },
    functie:    { code: "JP_006",    naam: "Driver" },
    week: "2026-16", rooster: 40, totaal: 44, verschil: 4, gewerkt: 44, verlof: null, verzuim: null,
    // Aggregated: payroll/capaciteit/dubbel/geaccordeerd fail across days; week itself is complete
    checks: { compleet: true, geaccordeerd: false, payroll: false, capaciteit: false, dubbel: false },
    days: [
      { datum: "13-04-2026", dag: "Monday",    rooster: 8, totaal: 8,  verschil: 0,  gewerkt: 8,  verlof: null, verzuim: null,
        checks: { compleet: true, geaccordeerd: true,  payroll: true,  capaciteit: true,  dubbel: true } },
      { datum: "14-04-2026", dag: "Tuesday",   rooster: 8, totaal: 8,  verschil: 0,  gewerkt: 8,  verlof: null, verzuim: null,
        checks: { compleet: true, geaccordeerd: false, payroll: true,  capaciteit: true,  dubbel: true } },
      { datum: "15-04-2026", dag: "Wednesday", rooster: 8, totaal: 8,  verschil: 0,  gewerkt: 8,  verlof: null, verzuim: null,
        checks: { compleet: true, geaccordeerd: true,  payroll: false, capaciteit: true,  dubbel: true } },
      { datum: "16-04-2026", dag: "Thursday",  rooster: 8, totaal: 12, verschil: 4,  gewerkt: 12, verlof: null, verzuim: null,
        checks: { compleet: true, geaccordeerd: true,  payroll: true,  capaciteit: false, dubbel: false } },
      { datum: "17-04-2026", dag: "Friday",    rooster: 8, totaal: 8,  verschil: 0,  gewerkt: 8,  verlof: null, verzuim: null,
        checks: { compleet: true, geaccordeerd: true,  payroll: true,  capaciteit: true,  dubbel: true } },
      { datum: "18-04-2026", dag: "Saturday",  rooster: null, totaal: null, verschil: null, gewerkt: null, verlof: null, verzuim: null,
        checks: { compleet: true, geaccordeerd: true,  payroll: true,  capaciteit: true,  dubbel: true } },
      { datum: "19-04-2026", dag: "Sunday",    rooster: null, totaal: null, verschil: null, gewerkt: null, verlof: null, verzuim: null,
        checks: { compleet: true, geaccordeerd: true,  payroll: true,  capaciteit: true,  dubbel: true } },
    ],
  },
  {
    medewerker: { code: "CW-35-DR4", naam: "Wojtek Debowski" },
    leiding:    { code: "WO-04210",  naam: "John Maas" },
    werkgever:  { code: "02",        naam: "H. Essers Transport Company" },
    functie:    { code: "JP_006",    naam: "Driver" },
    week: "2026-17", rooster: 40, totaal: 44, verschil: 4, gewerkt: 44, verlof: null, verzuim: null,
    // Full sweep — every check fails somewhere across the week
    checks: { compleet: false, geaccordeerd: false, payroll: false, capaciteit: false, dubbel: false },
    days: [
      { datum: "20-04-2026", dag: "Monday",    rooster: 8, totaal: 8,  verschil: 0,  gewerkt: 8,  verlof: null, verzuim: null,
        checks: { compleet: true,  geaccordeerd: true,  payroll: true,  capaciteit: true,  dubbel: true } },
      { datum: "21-04-2026", dag: "Tuesday",   rooster: 8, totaal: 8,  verschil: 0,  gewerkt: 8,  verlof: null, verzuim: null,
        checks: { compleet: false, geaccordeerd: true,  payroll: true,  capaciteit: true,  dubbel: true } },
      { datum: "22-04-2026", dag: "Wednesday", rooster: 8, totaal: 8,  verschil: 0,  gewerkt: 8,  verlof: null, verzuim: null,
        checks: { compleet: true,  geaccordeerd: true,  payroll: true,  capaciteit: true,  dubbel: false } },
      { datum: "23-04-2026", dag: "Thursday",  rooster: 8, totaal: 8,  verschil: 0,  gewerkt: 8,  verlof: null, verzuim: null,
        checks: { compleet: false, geaccordeerd: false, payroll: false, capaciteit: true,  dubbel: true } },
      { datum: "24-04-2026", dag: "Friday",    rooster: 8, totaal: 12, verschil: 4,  gewerkt: 12, verlof: null, verzuim: null,
        checks: { compleet: true,  geaccordeerd: true,  payroll: true,  capaciteit: false, dubbel: true } },
      { datum: "25-04-2026", dag: "Saturday",  rooster: null, totaal: null, verschil: null, gewerkt: null, verlof: null, verzuim: null,
        checks: { compleet: true,  geaccordeerd: true,  payroll: true,  capaciteit: true,  dubbel: true } },
      { datum: "26-04-2026", dag: "Sunday",    rooster: null, totaal: null, verschil: null, gewerkt: null, verlof: null, verzuim: null,
        checks: { compleet: true,  geaccordeerd: true,  payroll: true,  capaciteit: true,  dubbel: true } },
    ],
  },
  {
    medewerker: { code: "CW-35-DR4", naam: "Wojtek Debowski" },
    leiding:    { code: "WO-04210",  naam: "John Maas" },
    werkgever:  { code: "02",        naam: "H. Essers Transport Company" },
    functie:    { code: "JP_006",    naam: "Driver" },
    week: "2026-15", rooster: 40, totaal: 16, verschil: -24, gewerkt: 16, verlof: null, verzuim: null,
    // Partial week — Mon/Tue entered, rest not yet filled in
    checks: { compleet: false, geaccordeerd: true, payroll: true, capaciteit: true, dubbel: true },
    days: [
      { datum: "06-04-2026", dag: "Monday",    rooster: 8, totaal: 8,    verschil: 0,  gewerkt: 8,    verlof: null, verzuim: null,
        checks: { compleet: true,  geaccordeerd: true, payroll: true, capaciteit: true, dubbel: true } },
      { datum: "07-04-2026", dag: "Tuesday",   rooster: 8, totaal: 8,    verschil: 0,  gewerkt: 8,    verlof: null, verzuim: null,
        checks: { compleet: true,  geaccordeerd: true, payroll: true, capaciteit: true, dubbel: true } },
      { datum: "08-04-2026", dag: "Wednesday", rooster: 8, totaal: null, verschil: -8, gewerkt: null, verlof: null, verzuim: null,
        checks: { compleet: false, geaccordeerd: true, payroll: true, capaciteit: true, dubbel: true } },
      { datum: "09-04-2026", dag: "Thursday",  rooster: 8, totaal: null, verschil: -8, gewerkt: null, verlof: null, verzuim: null,
        checks: { compleet: false, geaccordeerd: true, payroll: true, capaciteit: true, dubbel: true } },
      { datum: "10-04-2026", dag: "Friday",    rooster: 8, totaal: null, verschil: -8, gewerkt: null, verlof: null, verzuim: null,
        checks: { compleet: false, geaccordeerd: true, payroll: true, capaciteit: true, dubbel: true } },
      { datum: "11-04-2026", dag: "Saturday",  rooster: null, totaal: null, verschil: null, gewerkt: null, verlof: null, verzuim: null,
        checks: { compleet: true,  geaccordeerd: true, payroll: true, capaciteit: true, dubbel: true } },
      { datum: "12-04-2026", dag: "Sunday",    rooster: null, totaal: null, verschil: null, gewerkt: null, verlof: null, verzuim: null,
        checks: { compleet: true,  geaccordeerd: true, payroll: true, capaciteit: true, dubbel: true } },
    ],
  },
  {
    medewerker: { code: "WO-00344", naam: "Yuri Schaerlaeken" },
    leiding:    { code: "WO-03253", naam: "Gert Bervoets" },
    werkgever:  { code: "01",       naam: "H. Essers Holding Nederland" },
    functie:    { code: "0128",     naam: "Manager Facility" },
    week: "2026-16", rooster: 40, totaal: 40, verschil: 0, gewerkt: 40, verlof: null, verzuim: null,
    // Perfect week — green bar + "Alles in orde"
    checks: { compleet: true, geaccordeerd: true, payroll: true, capaciteit: true, dubbel: true },
    days: [
      { datum: "13-04-2026", dag: "Monday",    rooster: 8, totaal: 8, verschil: 0, gewerkt: 8, verlof: null, verzuim: null,
        checks: { compleet: true, geaccordeerd: true, payroll: true, capaciteit: true, dubbel: true } },
      { datum: "14-04-2026", dag: "Tuesday",   rooster: 8, totaal: 8, verschil: 0, gewerkt: 8, verlof: null, verzuim: null,
        checks: { compleet: true, geaccordeerd: true, payroll: true, capaciteit: true, dubbel: true } },
      { datum: "15-04-2026", dag: "Wednesday", rooster: 8, totaal: 8, verschil: 0, gewerkt: 8, verlof: null, verzuim: null,
        checks: { compleet: true, geaccordeerd: true, payroll: true, capaciteit: true, dubbel: true } },
      { datum: "16-04-2026", dag: "Thursday",  rooster: 8, totaal: 8, verschil: 0, gewerkt: 8, verlof: null, verzuim: null,
        checks: { compleet: true, geaccordeerd: true, payroll: true, capaciteit: true, dubbel: true } },
      { datum: "17-04-2026", dag: "Friday",    rooster: 8, totaal: 8, verschil: 0, gewerkt: 8, verlof: null, verzuim: null,
        checks: { compleet: true, geaccordeerd: true, payroll: true, capaciteit: true, dubbel: true } },
      { datum: "18-04-2026", dag: "Saturday",  rooster: null, totaal: null, verschil: null, gewerkt: null, verlof: null, verzuim: null,
        checks: { compleet: true, geaccordeerd: true, payroll: true, capaciteit: true, dubbel: true } },
      { datum: "19-04-2026", dag: "Sunday",    rooster: null, totaal: null, verschil: null, gewerkt: null, verlof: null, verzuim: null,
        checks: { compleet: true, geaccordeerd: true, payroll: true, capaciteit: true, dubbel: true } },
    ],
  },
  {
    medewerker: { code: "WO-00344", naam: "Yuri Schaerlaeken" },
    leiding:    { code: "WO-03253", naam: "Gert Bervoets" },
    werkgever:  { code: "01",       naam: "H. Essers Holding Nederland" },
    functie:    { code: "0128",     naam: "Manager Facility" },
    week: "2026-15", rooster: 40, totaal: 44, verschil: 4, gewerkt: 44, verlof: null, verzuim: null,
    // One overrun day on Thursday → capacity check fails at week level
    checks: { compleet: true, geaccordeerd: true, payroll: true, capaciteit: false, dubbel: true },
    days: [
      { datum: "06-04-2026", dag: "Monday",    rooster: 8, totaal: 8,  verschil: 0, gewerkt: 8,  verlof: null, verzuim: null,
        checks: { compleet: true, geaccordeerd: true, payroll: true, capaciteit: true,  dubbel: true } },
      { datum: "07-04-2026", dag: "Tuesday",   rooster: 8, totaal: 8,  verschil: 0, gewerkt: 8,  verlof: null, verzuim: null,
        checks: { compleet: true, geaccordeerd: true, payroll: true, capaciteit: true,  dubbel: true } },
      { datum: "08-04-2026", dag: "Wednesday", rooster: 8, totaal: 8,  verschil: 0, gewerkt: 8,  verlof: null, verzuim: null,
        checks: { compleet: true, geaccordeerd: true, payroll: true, capaciteit: true,  dubbel: true } },
      { datum: "09-04-2026", dag: "Thursday",  rooster: 8, totaal: 12, verschil: 4, gewerkt: 12, verlof: null, verzuim: null,
        checks: { compleet: true, geaccordeerd: true, payroll: true, capaciteit: false, dubbel: true } },
      { datum: "10-04-2026", dag: "Friday",    rooster: 8, totaal: 8,  verschil: 0, gewerkt: 8,  verlof: null, verzuim: null,
        checks: { compleet: true, geaccordeerd: true, payroll: true, capaciteit: true,  dubbel: true } },
      { datum: "11-04-2026", dag: "Saturday",  rooster: null, totaal: null, verschil: null, gewerkt: null, verlof: null, verzuim: null,
        checks: { compleet: true, geaccordeerd: true, payroll: true, capaciteit: true,  dubbel: true } },
      { datum: "12-04-2026", dag: "Sunday",    rooster: null, totaal: null, verschil: null, gewerkt: null, verlof: null, verzuim: null,
        checks: { compleet: true, geaccordeerd: true, payroll: true, capaciteit: true,  dubbel: true } },
    ],
  },
];

// ─── Cloud SVG logo (matches your app icon vibe) ──────────────────────────────
const CloudLogo = ({ size = 36, t }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} style={{ display: "block" }}>
    <path d="M16 22 Q12 22 10 25 Q8 28 10 31 Q11 33 14 33 L22 33 Q25 33 25 30 Q25 27 22 26 Q22 22 18 22 Z"
      fill={t.cloudLight} stroke="#2a2438" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M30 18 Q22 18 20 25 Q14 26 14 32 Q14 38 22 38 L46 38 Q54 38 54 30 Q54 24 47 23 Q46 16 38 16 Q33 16 30 18 Z"
      fill={t.cloudLight} stroke="#2a2438" strokeWidth="2" strokeLinejoin="round" />
    <path d="M32 38 Q25 38 24 44 Q20 45 20 49 Q20 53 26 53 L46 53 Q52 53 52 48 Q52 43 46 43 Q45 38 38 38 Q35 38 32 38 Z"
      fill={t.cloudMid} stroke="#2a2438" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

// ─── Sub-components ───────────────────────────────────────────────────────────
const NeuPill = ({ children, onClick, active, style = {}, t }) => {
  const [hov, setHov] = useState(false);
  const [pressed, setPressed] = useState(false);
  const isPressed = pressed || active;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: t.bg,
        boxShadow: isPressed ? t.neu.insetSm : (hov ? t.neu.liftedSm : t.neu.raisedSm),
        transform: isPressed ? "translateY(0)" : (hov ? "translateY(-1px)" : "translateY(0)"),
        border: "none", outline: "none",
        padding: "8px 16px", borderRadius: 99, cursor: "pointer",
        color: hov || isPressed || active ? t.cloudDeep : t.textPrimary,
        fontSize: 13, fontWeight: 500, fontFamily: "'Poppins',sans-serif",
        transition: "box-shadow 0.2s ease, transform 0.15s ease, color 0.2s ease",
        display: "inline-flex", alignItems: "center", gap: 8,
        ...style,
      }}>{children}</button>
  );
};

const NeuIconBtn = ({ children, onClick, active, t }) => {
  const [hov, setHov] = useState(false);
  const [pressed, setPressed] = useState(false);
  const isPressed = pressed || active;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: t.bg,
        boxShadow: isPressed ? t.neu.insetSm : (hov ? t.neu.liftedSm : t.neu.raisedSm),
        transform: isPressed ? "translateY(0)" : (hov ? "translateY(-1px)" : "translateY(0)"),
        border: "none", outline: "none",
        width: 38, height: 38, borderRadius: "50%", cursor: "pointer",
        color: hov || isPressed || active ? t.cloudDeep : t.textPrimary,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "box-shadow 0.2s ease, transform 0.15s ease, color 0.2s ease",
        fontSize: 14,
      }}>{children}</button>
  );
};

const CheckCell = ({ ok, t }) => (
  <div style={{
    width: 24, height: 24, borderRadius: "50%",
    background: t.bg, boxShadow: t.neu.insetSm,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 600,
    color: ok ? t.C.green.fg : t.C.red.fg,
  }}>{ok ? "✓" : "✕"}</div>
);

// CapacityBar — visual replacement for Rooster / Totaal / Verschil at week level.
// Three states pulled from the KPI palette:
//   Verschil < 0  → orange (under capacity)
//   Verschil = 0  → green (perfect match)
//   Verschil > 0  → cloud-blue (over scheduled / extra hours)
const CapacityBar = ({ rooster, totaal, verschil, t }) => {
  // Handle null/no-data state
  if (rooster === null || rooster === undefined || rooster === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", height: 28, paddingLeft: 4 }}>
        <span style={{ color: t.textTertiary, fontSize: 12, fontWeight: 300 }}>—</span>
      </div>
    );
  }

  const totaalValue = totaal ?? 0;
  // Visual fill: clamp 0–100% based on totaal/rooster ratio
  const pct = Math.max(0, Math.min(100, (totaalValue / rooster) * 100));

  // State → color from KPI palette
  let state;
  if (verschil === null || verschil === undefined) state = "under";
  else if (verschil < 0) state = "under";
  else if (verschil === 0) state = "exact";
  else state = "over";

  const palette = {
    under: { fill: t.capUnder, chipFg: t.C.orange.fg, chipBg: t.C.orange.bg },
    exact: { fill: t.capExact, chipFg: t.C.green.fg,  chipBg: t.C.green.bg },
    over:  { fill: t.capOver,  chipFg: t.cloudDeep,   chipBg: t.C.cyan.bg },
  }[state];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingRight: 10 }}>
      {/* Numeric caption */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        fontSize: 11, fontVariantNumeric: "tabular-nums",
      }}>
        <span style={{ color: t.textPrimary, fontWeight: 500 }}>
          {totaalValue}<span style={{ color: t.textTertiary, fontWeight: 400 }}> / {rooster}h</span>
        </span>
        <span style={{
          color: palette.chipFg, fontWeight: 600,
          background: palette.chipBg, padding: "1px 8px", borderRadius: 99,
          boxShadow: t.neu.insetSm, fontSize: 10,
        }}>
          {verschil !== null && verschil !== undefined ? (verschil > 0 ? `+${verschil}` : verschil) : "—"}
        </span>
      </div>

      {/* Bar track (inset well) + fill (solid color with soft glow) */}
      <div style={{
        position: "relative", height: 8, borderRadius: 99,
        background: t.bg, boxShadow: t.neu.insetSm,
        overflow: "visible",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, height: "100%",
          width: `${pct}%`,
          borderRadius: 99,
          background: palette.fill,
          transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
};

const EmDash = ({ t }) => <span style={{ color: t.textTertiary, fontWeight: 300 }}>—</span>;

// Badge config — order matches the KPI card order and uses the same color palette.
// Only badges whose corresponding check is false will render.
const BADGE_CONFIG = [
  { key: "compleet",     label: "Niet compleet",     colorKey: "amber" },
  { key: "geaccordeerd", label: "Niet geaccordeerd", colorKey: "red" },
  { key: "payroll",      label: "Payroll",           colorKey: "purple" },
  { key: "capaciteit",   label: "Over capaciteit",   colorKey: "grey" },
  { key: "dubbel",       label: "Dubbele boeking",   colorKey: "yellow" },
];

const StatusBadges = ({ checks, t }) => {
  const failed = BADGE_CONFIG.filter((b) => !checks[b.key]);

  if (failed.length === 0) {
    // Clean row — subtle positive confirmation, not a wall of green
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        color: t.C.green.fg, fontSize: 11, fontWeight: 500,
      }}>
        <span style={{
          width: 16, height: 16, borderRadius: "50%",
          background: t.bg, boxShadow: t.neu.insetSm,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, color: t.C.green.fg,
        }}>✓</span>
        Alles in orde
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {failed.map((b) => {
        const color = t.C[b.colorKey];
        return (
          <span key={b.key} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: color.bg, color: color.fg,
            boxShadow: t.neu.insetSm,
            padding: "3px 9px", borderRadius: 99,
            fontSize: 10.5, fontWeight: 600, fontFamily: "'Poppins',sans-serif",
            lineHeight: 1.3, whiteSpace: "nowrap",
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%",
              background: color.fg, flexShrink: 0,
            }} />
            {b.label}
          </span>
        );
      })}
    </div>
  );
};

// Day-level mini badges: color-only dots, no text. Only renders for failed checks.
const MiniBadges = ({ checks, t }) => {
  const failed = BADGE_CONFIG.filter((b) => !checks[b.key]);
  if (failed.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
      {failed.map((b) => {
        const color = t.C[b.colorKey];
        return (
          <span key={b.key} title={b.label} style={{
            width: 14, height: 14, borderRadius: "50%",
            background: color.bg,
            boxShadow: t.neu.insetSm,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: color.fg,
            }} />
          </span>
        );
      })}
    </div>
  );
};

const formatNum = (v, t, opts = {}) => {
  if (v === null || v === undefined) return <EmDash t={t} />;
  const { negative } = opts;
  return <span style={{ color: negative && v < 0 ? t.C.red.fg : t.textPrimary, fontWeight: 500 }}>{v}</span>;
};

const KpiCard = ({ kpi, active, onClick, t }) => {
  const [hov, setHov] = useState(false);
  const [pressed, setPressed] = useState(false);
  const isPressed = pressed || active;
  const color = t.C[kpi.colorKey];

  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: t.bg,
        boxShadow: isPressed ? t.neu.inset : (hov ? t.neu.lifted : t.neu.raised),
        transform: isPressed ? "scale(0.99) translateY(0)" : (hov ? "translateY(-2px)" : "translateY(0)"),
        border: "none", outline: "none",
        borderRadius: 20, padding: "18px 18px", cursor: "pointer",
        textAlign: "left", display: "flex", alignItems: "center", gap: 14,
        fontFamily: "'Poppins',sans-serif",
        transition: "box-shadow 0.25s ease, transform 0.2s ease",
        width: "100%", minWidth: 0, position: "relative",
      }}>
      {/* Icon well */}
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: color.bg, boxShadow: t.neu.insetSm,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, color: color.fg, flexShrink: 0, fontWeight: 600,
        transition: "transform 0.2s ease",
        transform: hov && !isPressed ? "scale(1.05)" : "scale(1)",
      }}>{kpi.icon}</div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 28, fontWeight: 600,
          color: hov && !isPressed ? t.cloudDeep : t.textPrimary,
          lineHeight: 1, marginBottom: 6, letterSpacing: "-0.5px",
          transition: "color 0.2s ease",
        }}>{kpi.value.toLocaleString("nl-NL")}</div>
        <div style={{
          fontSize: 11.5, color: t.textSecondary, lineHeight: 1.3,
          fontWeight: 400, wordBreak: "break-word",
        }}>{kpi.label}</div>
      </div>

      {/* Active indicator pip */}
      {active && (
        <div style={{
          position: "absolute", top: 12, right: 14,
          width: 6, height: 6, borderRadius: "50%",
          background: t.cloudDeep,
          boxShadow: `0 0 0 3px ${t.bg}, 0 0 0 4px ${t.cloudLight}`,
        }} />
      )}
    </button>
  );
};

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function KairosDashboard() {
  const [themeName, setThemeName] = useState("light");
  // Resolve active theme + build the neumorphic shadow primitives for it
  const t = { ...THEMES[themeName] };
  t.neu = makeNeu(t);
  const isDark = themeName === "dark";

  const [openRows, setOpenRows] = useState(new Set([0, 1]));
  const toggleRow = (i) => setOpenRows((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });
  const [activeFilter, setActiveFilter] = useState(null);
  const [filters, setFilters] = useState({ medewerker: "", leiding: "", werkgever: "", functie: "", week: "" });

  const toggleFilter = (id) => setActiveFilter((curr) => (curr === id ? null : id));

  // Filter rows when a KPI is active (shows only failures of that check)
  const visibleData = activeFilter
    ? weekData.filter((w) => !w.checks[activeFilter])
    : weekData;

  return (
    <div style={{
      minHeight: "100vh", background: t.bg, padding: 0,
      fontFamily: "'Poppins',sans-serif", color: t.textPrimary,
      backgroundImage: t.ambient,
      backgroundAttachment: "fixed",
      transition: "background 0.4s ease, color 0.4s ease",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${t.bg}; }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        .day-row { animation: slideDown 0.25s ease both; }
        .filter-input::placeholder { color: ${t.textTertiary}; }
        .filter-input:focus { outline: none; box-shadow: inset -3px -3px 6px ${t.hi}, inset 3px 3px 6px ${t.shade}, 0 0 0 2px ${t.cloudLight}; }
        .star { animation: twinkle 3s ease-in-out infinite; }
      `}</style>

      {/* Cosmic star field (dark mode only) */}
      {isDark && (
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: `
            radial-gradient(1px 1px at 20% 30%, rgba(245,215,110,0.5), transparent),
            radial-gradient(1px 1px at 70% 60%, rgba(183,148,246,0.4), transparent),
            radial-gradient(1.5px 1.5px at 45% 80%, rgba(245,158,79,0.5), transparent),
            radial-gradient(1px 1px at 85% 15%, rgba(122,196,232,0.4), transparent),
            radial-gradient(1px 1px at 15% 75%, rgba(245,215,110,0.3), transparent),
            radial-gradient(1.5px 1.5px at 60% 25%, rgba(245,160,79,0.4), transparent),
            radial-gradient(1px 1px at 90% 85%, rgba(183,148,246,0.5), transparent),
            radial-gradient(1px 1px at 30% 90%, rgba(122,196,232,0.3), transparent),
            radial-gradient(2px 2px at 75% 45%, rgba(245,215,110,0.4), transparent),
            radial-gradient(1px 1px at 5% 50%, rgba(255,255,255,0.4), transparent)
          `,
        }} />
      )}
      <div style={{ position: "relative", zIndex: 1 }}>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HEADER                                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <header style={{
        padding: "24px 36px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 24,
      }}>
        {/* Left — Logo + Period nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18, background: t.bg,
            boxShadow: t.neu.raised,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CloudLogo size={32} t={t} />
          </div>

          <div>
            <div style={{ fontSize: 11, color: t.textTertiary, fontWeight: 500, letterSpacing: "0.5px", marginBottom: 4, textTransform: "uppercase" }}>
              Nimbus · Kairos
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <NeuIconBtn t={t}>‹</NeuIconBtn>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <h1 style={{
                  fontSize: 22, fontWeight: 600, color: t.textPrimary,
                  letterSpacing: "-0.5px", lineHeight: 1.15,
                }}>Essers Periode 2026 · 04</h1>
                <span style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>
                  30 mrt – 26 apr 2026
                </span>
              </div>
              <NeuIconBtn t={t}>›</NeuIconBtn>
            </div>
          </div>
        </div>

        {/* Right — actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <NeuPill style={{ gap: 6 }} t={t}>
            <span style={{ fontSize: 13 }}>↻</span>
            <span>DEV Refresh</span>
          </NeuPill>
          <NeuIconBtn t={t} onClick={() => setThemeName(isDark ? "light" : "dark")}>
            {isDark ? "☀" : "☾"}
          </NeuIconBtn>
          <NeuIconBtn t={t}>⇥</NeuIconBtn>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* KPI CARDS                                                               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "8px 36px 24px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gap: 16, position: "relative",
        }}>
          {kpis.map((k) => (
            <KpiCard key={k.id} kpi={k} active={activeFilter === k.id} onClick={() => toggleFilter(k.id)} t={t} />
          ))}
        </div>

        {/* Always-visible status / active-filter bar */}
        <div style={{
          marginTop: 14, padding: "10px 18px",
          background: t.bg, boxShadow: t.neu.insetSm, borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 13, color: t.textSecondary,
          transition: "all 0.2s ease",
        }}>
          {activeFilter ? (
            <>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.cloudDeep, boxShadow: `0 0 6px ${t.cloudMid}` }} />
                Gefilterd op: <b style={{ color: t.cloudDeep, fontWeight: 500 }}>
                  {kpis.find((k) => k.id === activeFilter)?.label}
                </b>
                <span style={{ color: t.textTertiary }}>· {visibleData.length} resultaten</span>
              </span>
              <button onClick={() => setActiveFilter(null)} style={{
                background: t.bg, boxShadow: t.neu.raisedXs, border: "none", outline: "none",
                padding: "4px 12px", borderRadius: 99, fontSize: 12,
                color: t.textSecondary, cursor: "pointer", fontFamily: "'Poppins',sans-serif",
              }}>Wissen ✕</button>
            </>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.C.green.fg, boxShadow: `0 0 6px ${t.C.green.fg}` }} />
              <b style={{ color: t.textPrimary, fontWeight: 500 }}>611</b> medewerkers
              <span style={{ color: t.textTertiary }}>·</span>
              <b style={{ color: t.textPrimary, fontWeight: 500 }}>2.418</b> rijen
              <span style={{ color: t.textTertiary }}>·</span>
              <span>Geladen</span>
            </span>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TABLE                                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "0 36px 36px" }}>
        <div style={{
          background: t.bg,
          boxShadow: t.neu.raised,
          borderRadius: 22,
          overflow: "hidden",
        }}>
          {/* Filter bar */}
          <div style={{
            padding: "14px 24px",
            display: "grid",
            gridTemplateColumns: "20px minmax(0,1.4fr) minmax(0,1.2fr) minmax(0,1.4fr) minmax(0,1.2fr) minmax(0,0.7fr) minmax(0,2fr) minmax(0,0.5fr) minmax(0,0.5fr) minmax(0,0.5fr) minmax(0,2.2fr)",
            gap: 10, alignItems: "center",
          }}>
            {/* Empty cell aligned with chevron */}
            <div />
            {["Medewerker", "Leidinggevende", "Werkgever", "Functie", "Week"].map((label, i) => (
              <div key={label} style={{ position: "relative" }}>
                <input
                  className="filter-input"
                  placeholder={label}
                  value={filters[Object.keys(filters)[i]] || ""}
                  onChange={(e) => setFilters((f) => ({ ...f, [Object.keys(filters)[i]]: e.target.value }))}
                  style={{
                    width: "100%", padding: "9px 14px 9px 32px",
                    background: t.bg, boxShadow: t.neu.insetSm,
                    border: "none", borderRadius: 99,
                    fontSize: 12, color: t.textPrimary,
                    fontFamily: "'Poppins',sans-serif",
                  }}
                />
                <span style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                  color: t.textTertiary, fontSize: 12,
                }}>⌕</span>
              </div>
            ))}
            {/* Action buttons span the remaining 5 columns (Capaciteit / Gewerkt / Verlof / Verzuim / Status) */}
            <div style={{
              gridColumn: "span 5",
              display: "flex", justifyContent: "flex-end", gap: 8,
            }}>
              <NeuIconBtn t={t}>⊟</NeuIconBtn>
              <NeuIconBtn t={t}>↓</NeuIconBtn>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: t.divider, margin: "0 24px" }} />

          {/* Column headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "20px minmax(0,1.4fr) minmax(0,1.2fr) minmax(0,1.4fr) minmax(0,1.2fr) minmax(0,0.7fr) minmax(0,2fr) minmax(0,0.5fr) minmax(0,0.5fr) minmax(0,0.5fr) minmax(0,2.2fr)",
            gap: 10, padding: "14px 24px",
            fontSize: 10, fontWeight: 500, color: t.textTertiary,
            letterSpacing: "0.5px", textTransform: "uppercase",
            alignItems: "center",
          }}>
            <span />
            <span>Medewerker</span>
            <span>Leidinggevende</span>
            <span>Werkgever</span>
            <span>Functie</span>
            <span>Week</span>
            <span>Capaciteit</span>
            <span style={{ textAlign: "right" }}>Gewerkt</span>
            <span style={{ textAlign: "right" }}>Verlof</span>
            <span style={{ textAlign: "right" }}>Verzuim</span>
            <span>Status</span>
          </div>

          {/* Rows */}
          <div style={{ padding: "0 16px 16px" }}>
            {visibleData.map((row, i) => {
              const isOpen = openRows.has(i);
              return (
                <div key={i} style={{
                  marginBottom: 10,
                  background: t.bg,
                  boxShadow: isOpen ? t.neu.inset : t.neu.raisedSm,
                  borderRadius: 16,
                  overflow: "hidden",
                  transition: "all 0.25s ease",
                }}>
                  {/* Week row */}
                  <div
                    onClick={() => toggleRow(i)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "20px minmax(0,1.4fr) minmax(0,1.2fr) minmax(0,1.4fr) minmax(0,1.2fr) minmax(0,0.7fr) minmax(0,2fr) minmax(0,0.5fr) minmax(0,0.5fr) minmax(0,0.5fr) minmax(0,2.2fr)",
                      gap: 10, padding: "14px 8px",
                      cursor: "pointer", alignItems: "center",
                    }}
                  >
                    <span style={{
                      color: t.textSecondary, fontSize: 10,
                      transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 0.2s", display: "inline-block",
                    }}>▶</span>

                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: t.textPrimary, lineHeight: 1.2 }}>{row.medewerker.code}</div>
                      <div style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.3 }}>{row.medewerker.naam}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: t.textPrimary, lineHeight: 1.2 }}>{row.leiding.code}</div>
                      <div style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.3 }}>{row.leiding.naam}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: t.textPrimary, lineHeight: 1.2 }}>{row.werkgever.code}</div>
                      <div style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.werkgever.naam}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: t.textPrimary, lineHeight: 1.2 }}>{row.functie.code}</div>
                      <div style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.3 }}>{row.functie.naam}</div>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 500, color: t.textPrimary, fontVariantNumeric: "tabular-nums" }}>{row.week}</div>

                    {/* Capacity bar — replaces Rooster / Totaal / Verschil at week level */}
                    <CapacityBar rooster={row.rooster} totaal={row.totaal} verschil={row.verschil} t={t} />

                    <div style={{ fontSize: 13, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatNum(row.gewerkt, t)}</div>
                    <div style={{ fontSize: 13, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatNum(row.verlof, t)}</div>
                    <div style={{ fontSize: 13, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatNum(row.verzuim, t)}</div>

                    {/* Status badges — only failed checks render; clean rows show 'Alles in orde' */}
                    <StatusBadges checks={row.checks} t={t} />
                  </div>

                  {/* Day rows */}
                  {isOpen && row.days.length > 0 && (
                    <div style={{
                      padding: "4px 8px 12px 38px",
                      borderTop: `1px solid ${t.divider}`,
                      marginTop: 4,
                    }}>
                      {row.days.map((d, j) => (
                        <div key={j} className="day-row" style={{
                          animationDelay: `${j * 30}ms`,
                          display: "grid",
                          gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1.2fr) minmax(0,1.4fr) minmax(0,1.2fr) minmax(0,0.7fr) minmax(0,2fr) minmax(0,0.5fr) minmax(0,0.5fr) minmax(0,0.5fr) minmax(0,2.2fr)",
                          gap: 10, padding: "8px 0",
                          alignItems: "center", fontSize: 12,
                          color: t.textSecondary,
                          borderBottom: j < row.days.length - 1 ? `1px dashed ${t.divider}` : "none",
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: t.textPrimary, fontVariantNumeric: "tabular-nums" }}>{d.datum}</div>
                          <div>{d.dag}</div>
                          <div /><div /><div />

                          {/* Day-level: still show the 3 raw numbers, but laid out inline inside the Capaciteit column slot */}
                          <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: 6, fontSize: 12, paddingRight: 10,
                            fontVariantNumeric: "tabular-nums",
                          }}>
                            <span style={{ textAlign: "right", color: t.textSecondary }}>
                              <span style={{ color: t.textTertiary, fontSize: 10, marginRight: 4 }}>R</span>{formatNum(d.rooster, t)}
                            </span>
                            <span style={{ textAlign: "right", color: t.textSecondary }}>
                              <span style={{ color: t.textTertiary, fontSize: 10, marginRight: 4 }}>T</span>{formatNum(d.totaal, t)}
                            </span>
                            <span style={{ textAlign: "right", color: t.textSecondary }}>
                              <span style={{ color: t.textTertiary, fontSize: 10, marginRight: 4 }}>V</span>{formatNum(d.verschil, t, { negative: true })}
                            </span>
                          </div>

                          <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatNum(d.gewerkt, t)}</div>
                          <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatNum(d.verlof, t)}</div>
                          <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatNum(d.verzuim, t)}</div>

                          {/* Day-level status: small color-only badges, only render for failed checks */}
                          <MiniBadges checks={d.checks} t={t} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer version */}
        <div style={{
          textAlign: "right", marginTop: 16,
          fontSize: 11, color: t.textTertiary, fontFamily: "'Poppins',sans-serif",
        }}>v0.1.0</div>
      </section>
      </div>
    </div>
  );
}
