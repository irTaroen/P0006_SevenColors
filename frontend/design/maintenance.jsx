import { useState, useEffect } from "react";

// ─── Design tokens (mirrors the dashboard + signin) ──────────────────────────
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
      green:  { fg: "#5a8a4a", bg: "#d2e2c0" },
      orange: { fg: "#c4763a", bg: "#f2d5b8" },
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
    ambient: "radial-gradient(ellipse at 20% 10%, rgba(139, 92, 246, 0.15), transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(245, 158, 79, 0.10), transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(245, 215, 110, 0.06), transparent 60%)",
    C: {
      amber:  { fg: "#f5a04f", bg: "#3a2818" },
      green:  { fg: "#9bcf85", bg: "#1f2e1a" },
      orange: { fg: "#f59e4f", bg: "#3a2614" },
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

// ─── Cloud illustration ───────────────────────────────────────────────────────
// The standard brand cloud, just rendered at a larger size.
const ConstructionCloud = ({ size = 200, t }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} style={{ display: "block" }}>
    <path d="M16 22 Q12 22 10 25 Q8 28 10 31 Q11 33 14 33 L22 33 Q25 33 25 30 Q25 27 22 26 Q22 22 18 22 Z"
      fill={t.cloudLight} stroke="#2a2438" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M30 18 Q22 18 20 25 Q14 26 14 32 Q14 38 22 38 L46 38 Q54 38 54 30 Q54 24 47 23 Q46 16 38 16 Q33 16 30 18 Z"
      fill={t.cloudLight} stroke="#2a2438" strokeWidth="2" strokeLinejoin="round" />
    <path d="M32 38 Q25 38 24 44 Q20 45 20 49 Q20 53 26 53 L46 53 Q52 53 52 48 Q52 43 46 43 Q45 38 38 38 Q35 38 32 38 Z"
      fill={t.cloudMid} stroke="#2a2438" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

// ─── Neumorphic icon button (theme toggle) ────────────────────────────────────
const NeuIconBtn = ({ children, onClick, t }) => {
  const [hov, setHov] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
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

// ─── Pulsing status dot used in the "live" indicator ──────────────────────────
const PulseDot = ({ color, t }) => (
  <span style={{
    width: 8, height: 8, borderRadius: "50%",
    background: color,
    boxShadow: `0 0 0 0 ${color}40`,
    animation: "pulse 2s ease-out infinite",
    flexShrink: 0,
  }} />
);

// ─── Mini work-step item ──────────────────────────────────────────────────────
const WorkStep = ({ status, label, t }) => {
  const palette = {
    done:     { fg: t.C.green.fg,  bg: t.C.green.bg,  icon: "✓" },
    active:   { fg: t.C.amber.fg,  bg: t.C.amber.bg,  icon: "⚒" },
    upcoming: { fg: t.textTertiary, bg: t.bg,         icon: "○" },
  }[status];

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 14px",
      background: t.bg, boxShadow: t.neu.insetSm,
      borderRadius: 99,
      opacity: status === "upcoming" ? 0.6 : 1,
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: "50%",
        background: palette.bg, boxShadow: status === "upcoming" ? "none" : t.neu.insetSm,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 600, color: palette.fg, flexShrink: 0,
      }}>{palette.icon}</span>
      <span style={{
        fontSize: 12, fontWeight: 500, color: t.textPrimary,
        textDecoration: status === "done" ? "line-through" : "none",
        textDecorationColor: t.textTertiary,
        flex: 1,
      }}>{label}</span>
      {status === "active" && (
        <span style={{
          fontSize: 10, fontWeight: 600, color: palette.fg,
          background: palette.bg, padding: "2px 8px",
          borderRadius: 99, boxShadow: t.neu.insetSm,
          letterSpacing: 0.3, textTransform: "uppercase",
        }}>Bezig</span>
      )}
    </div>
  );
};

// ─── Maintenance page ─────────────────────────────────────────────────────────
export default function MaintenancePage() {
  const [themeName, setThemeName] = useState("light");
  const t = { ...THEMES[themeName] };
  t.neu = makeNeu(t);
  const isDark = themeName === "dark";

  // Live "elapsed since maintenance started" clock — just for character
  const [seconds, setSeconds] = useState(327); // pretend it's been 5:27
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      background: t.bg,
      backgroundImage: t.ambient,
      backgroundAttachment: "fixed",
      fontFamily: "'Poppins',sans-serif", color: t.textPrimary,
      display: "flex", flexDirection: "column",
      position: "relative", overflow: "hidden",
      transition: "background 0.4s ease, color 0.4s ease",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${t.bg}; }
        @keyframes float-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes drift {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50%      { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes pulse {
          0%   { box-shadow: 0 0 0 0 var(--pulse-color, rgba(184,115,51,0.5)); }
          70%  { box-shadow: 0 0 0 10px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
        @keyframes drift-tape {
          0%   { background-position: 0 0; }
          100% { background-position: 32px 0; }
        }
        .card        { animation: float-up 0.7s ease both; }
        .card.delay1 { animation-delay: 0.1s; }
        .card.delay2 { animation-delay: 0.2s; }
        .illu        { animation: drift 8s ease-in-out infinite; }
      `}</style>

      {/* Cosmic starfield (dark only) */}
      {isDark && (
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: `
            radial-gradient(1px 1px at 18% 28%, rgba(245,215,110,0.55), transparent),
            radial-gradient(1px 1px at 72% 62%, rgba(183,148,246,0.45), transparent),
            radial-gradient(1.5px 1.5px at 44% 82%, rgba(245,158,79,0.5), transparent),
            radial-gradient(1px 1px at 86% 16%, rgba(122,196,232,0.5), transparent),
            radial-gradient(1px 1px at 12% 74%, rgba(245,215,110,0.35), transparent),
            radial-gradient(1.5px 1.5px at 62% 22%, rgba(245,160,79,0.45), transparent),
            radial-gradient(1px 1px at 91% 86%, rgba(183,148,246,0.5), transparent),
            radial-gradient(1px 1px at 31% 91%, rgba(122,196,232,0.4), transparent),
            radial-gradient(2px 2px at 76% 46%, rgba(245,215,110,0.45), transparent),
            radial-gradient(1px 1px at 6% 52%, rgba(255,255,255,0.5), transparent)
          `,
        }} />
      )}

      {/* Diagonal caution-tape stripe along the very top — sets the tone */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 6,
        background: `repeating-linear-gradient(45deg, ${t.C.amber.fg} 0 16px, ${t.C.amber.bg} 16px 32px)`,
        animation: "drift-tape 4s linear infinite",
        zIndex: 5, opacity: 0.85,
      }} />

      {/* Top-right theme toggle */}
      <div style={{ position: "absolute", top: 24, right: 28, zIndex: 10 }}>
        <NeuIconBtn t={t} onClick={() => setThemeName(isDark ? "light" : "dark")}>
          {isDark ? "☀" : "☾"}
        </NeuIconBtn>
      </div>

      {/* Top-left brand label */}
      <div style={{
        position: "absolute", top: 26, left: 36, zIndex: 10,
        fontSize: 11, color: t.textTertiary, fontWeight: 500,
        letterSpacing: 1.5, textTransform: "uppercase",
      }}>Nimbus · Kairos</div>

      {/* Main content */}
      <main style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "80px 32px 40px", position: "relative", zIndex: 1,
        gap: 32,
      }}>

        {/* The illustration */}
        <div className="illu" style={{ marginBottom: -8 }}>
          <ConstructionCloud size={220} t={t} />
        </div>

        {/* Hero text card */}
        <div className="card" style={{
          background: t.bg,
          boxShadow: t.neu.raised,
          borderRadius: 28,
          padding: "36px 48px",
          maxWidth: 620,
          textAlign: "center",
          position: "relative",
        }}>
          {/* "Status: bezig" pill at the top */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: t.C.amber.bg, boxShadow: t.neu.insetSm,
            padding: "5px 14px", borderRadius: 99,
            fontSize: 11, fontWeight: 600, color: t.C.amber.fg,
            letterSpacing: 0.5, textTransform: "uppercase",
            marginBottom: 20,
            ['--pulse-color']: t.C.amber.fg + "60",
          }}>
            <PulseDot color={t.C.amber.fg} t={t} />
            Onderhoud bezig
          </div>

          {/* Headline — playful weather metaphor (fits the cloud brand) */}
          <h1 style={{
            fontSize: 36, fontWeight: 700, color: t.textPrimary,
            letterSpacing: "-1px", lineHeight: 1.1,
            marginBottom: 12,
          }}>
            We zijn even <span style={{ color: t.cloudDeep, fontStyle: "italic" }}>aan het bouwen</span>
          </h1>

          {/* Sub-headline */}
          <p style={{
            fontSize: 15, color: t.textSecondary, lineHeight: 1.55,
            maxWidth: 480, margin: "0 auto",
          }}>
            Onze wolken krijgen wat extra steigers. We zijn binnenkort weer in de lucht — beloofd.
          </p>
        </div>

        {/* Two-up info cards */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 16, width: "100%", maxWidth: 620,
        }}>

          {/* Elapsed / ETA card */}
          <div className="card delay1" style={{
            background: t.bg,
            boxShadow: t.neu.raised,
            borderRadius: 20,
            padding: "20px 22px",
          }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: t.textTertiary,
              letterSpacing: 0.6, textTransform: "uppercase",
              marginBottom: 10,
            }}>Geschatte tijd resterend</div>
            <div style={{
              fontSize: 32, fontWeight: 700, color: t.textPrimary,
              letterSpacing: "-1px", fontFamily: "'Poppins',sans-serif",
              fontVariantNumeric: "tabular-nums", lineHeight: 1,
              marginBottom: 6,
            }}>
              ~15<span style={{ fontSize: 18, color: t.textSecondary, fontWeight: 500 }}> min</span>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 11, color: t.textTertiary, fontVariantNumeric: "tabular-nums",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.cloudDeep }} />
              Gestart {mm}:{ss} geleden
            </div>
          </div>

          {/* What's happening card */}
          <div className="card delay2" style={{
            background: t.bg,
            boxShadow: t.neu.raised,
            borderRadius: 20,
            padding: "20px 22px",
          }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: t.textTertiary,
              letterSpacing: 0.6, textTransform: "uppercase",
              marginBottom: 10,
            }}>Wat doen we?</div>
            <div style={{
              fontSize: 14, color: t.textPrimary, lineHeight: 1.5, marginBottom: 4,
            }}>Een AFAS-pipeline upgrade</div>
            <div style={{
              fontSize: 11, color: t.textSecondary, lineHeight: 1.5,
            }}>Frissere data, snellere periodes.</div>
          </div>
        </div>

        {/* Work steps card — checklist of what's happening */}
        <div className="card delay2" style={{
          background: t.bg,
          boxShadow: t.neu.raised,
          borderRadius: 20,
          padding: "22px 24px",
          width: "100%", maxWidth: 620,
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
            marginBottom: 4,
          }}>
            <span style={{
              fontSize: 10, fontWeight: 600, color: t.textTertiary,
              letterSpacing: 0.6, textTransform: "uppercase",
            }}>Voortgang</span>
            <span style={{
              fontSize: 11, color: t.textSecondary, fontWeight: 500,
              fontVariantNumeric: "tabular-nums",
            }}>2 / 4 stappen</span>
          </div>

          <WorkStep status="done"     label="Database backup voltooid"     t={t} />
          <WorkStep status="done"     label="Cache geleegd"                  t={t} />
          <WorkStep status="active"   label="ETL-pipeline draait"            t={t} />
          <WorkStep status="upcoming" label="Frontend opnieuw deployen"      t={t} />
        </div>

        {/* Contact / status link */}
        <div style={{
          fontSize: 12, color: t.textTertiary, textAlign: "center",
          maxWidth: 480, lineHeight: 1.6,
        }}>
          Vragen of urgent toegang nodig?{" "}
          <button type="button" style={{
            background: "none", border: "none", color: t.cloudDeep,
            fontSize: 12, fontWeight: 500, cursor: "pointer",
            fontFamily: "'Poppins',sans-serif", padding: 0,
            textDecoration: "underline", textDecorationThickness: 1,
            textUnderlineOffset: 3, textDecorationColor: t.cloudLight,
          }}>Neem contact op met IT</button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: "center",
        padding: "16px 32px 24px",
        fontSize: 11, color: t.textTertiary,
        position: "relative", zIndex: 1,
      }}>
        v0.1.0 · © {new Date().getFullYear()} H. Essers
      </footer>

      {/* Bottom caution tape (mirror of the top one) */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 6,
        background: `repeating-linear-gradient(45deg, ${t.C.amber.fg} 0 16px, ${t.C.amber.bg} 16px 32px)`,
        animation: "drift-tape 4s linear infinite reverse",
        zIndex: 5, opacity: 0.85,
      }} />
    </div>
  );
}
