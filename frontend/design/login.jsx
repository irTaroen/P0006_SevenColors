import { useState } from "react";

// ─── Design tokens (mirrors the dashboard's THEMES object) ───────────────────
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
      red:   { fg: "#b04545", bg: "#f0c8c8" },
      green: { fg: "#5a8a4a", bg: "#d2e2c0" },
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
      red:   { fg: "#e87878", bg: "#3a1f1f" },
      green: { fg: "#9bcf85", bg: "#1f2e1a" },
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

// ─── Cloud logo — same as dashboard ───────────────────────────────────────────
const CloudLogo = ({ size = 80, t }) => (
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

// ─── Google G icon SVG ────────────────────────────────────────────────────────
const GoogleIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} style={{ display: "block", flexShrink: 0 }}>
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.1 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3c-2 1.4-4.5 2.5-7.3 2.5-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.3 5.3C42 35 44 30 44 24c0-1.3-.1-2.6-.4-3.9z"/>
  </svg>
);

// ─── Sign-in page ─────────────────────────────────────────────────────────────
export default function SignInPage() {
  const [themeName, setThemeName] = useState("light");
  const t = { ...THEMES[themeName] };
  t.neu = makeNeu(t);
  const isDark = themeName === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [pwHover, setPwHover] = useState(false);
  const [pwPressed, setPwPressed] = useState(false);
  const [googleHover, setGoogleHover] = useState(false);
  const [googlePressed, setGooglePressed] = useState(false);

  const submit = (e) => {
    e?.preventDefault?.();
    if (!email || !password) {
      setError("Vul beide velden in om in te loggen.");
      return;
    }
    setError(null);
    // Real app: trigger NextAuth credentials provider
  };

  const inputShadow = (focused) => focused
    ? `${t.neu.insetSm}, 0 0 0 2px ${t.cloudLight}`
    : t.neu.insetSm;

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
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes drift {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .signin-card { animation: float-up 0.6s ease both; }
        .signin-logo { animation: drift 6s ease-in-out infinite; }
        input::placeholder { color: ${t.textTertiary}; }
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
            radial-gradient(1px 1px at 6% 52%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 55% 8%, rgba(255,255,255,0.4), transparent),
            radial-gradient(1.5px 1.5px at 38% 50%, rgba(183,148,246,0.4), transparent)
          `,
        }} />
      )}

      {/* Top-right theme toggle */}
      <div style={{
        position: "absolute", top: 24, right: 28, zIndex: 10,
      }}>
        <NeuIconBtn t={t} onClick={() => setThemeName(isDark ? "light" : "dark")}>
          {isDark ? "☀" : "☾"}
        </NeuIconBtn>
      </div>

      {/* Centered card */}
      <main style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 32, position: "relative", zIndex: 1,
      }}>
        <div className="signin-card" style={{
          background: t.bg,
          boxShadow: t.neu.raised,
          borderRadius: 28,
          padding: "44px 44px 36px",
          width: "100%", maxWidth: 420,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
        }}>
          {/* Logo in raised neu plate */}
          <div className="signin-logo" style={{
            width: 96, height: 96, borderRadius: 26,
            background: t.bg, boxShadow: t.neu.raised,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 24,
          }}>
            <CloudLogo size={56} t={t} />
          </div>

          {/* Brand label */}
          <div style={{
            fontSize: 11, color: t.textTertiary, fontWeight: 500,
            letterSpacing: 1.5, textTransform: "uppercase",
            marginBottom: 6,
          }}>Nimbus · Kairos</div>

          {/* Heading */}
          <h1 style={{
            fontSize: 28, fontWeight: 700, color: t.textPrimary,
            letterSpacing: "-0.5px", marginBottom: 8, textAlign: "center",
          }}>Welkom terug</h1>

          {/* Subhead */}
          <p style={{
            fontSize: 13, color: t.textSecondary,
            marginBottom: 32, textAlign: "center",
          }}>Log in om verder te gaan met je workforce roster.</p>

          {/* Form */}
          <form onSubmit={submit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Email field */}
            <div>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 500,
                color: t.textSecondary, marginBottom: 6,
                letterSpacing: 0.4, textTransform: "uppercase",
              }}>E-mail</label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                  color: focusedField === "email" ? t.cloudDeep : t.textTertiary,
                  fontSize: 14, transition: "color 0.2s ease",
                }}>✉</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="naam@essers.com"
                  autoComplete="email"
                  style={{
                    width: "100%", padding: "13px 16px 13px 42px",
                    background: t.bg, boxShadow: inputShadow(focusedField === "email"),
                    border: "none", outline: "none",
                    borderRadius: 99,
                    fontSize: 14, color: t.textPrimary,
                    fontFamily: "'Poppins',sans-serif",
                    transition: "box-shadow 0.2s ease",
                  }}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <label style={{
                  fontSize: 11, fontWeight: 500, color: t.textSecondary,
                  letterSpacing: 0.4, textTransform: "uppercase",
                }}>Wachtwoord</label>
                <button type="button" style={{
                  background: "none", border: "none", outline: "none",
                  color: t.cloudDeep, fontSize: 11, fontWeight: 500,
                  fontFamily: "'Poppins',sans-serif", cursor: "pointer",
                  letterSpacing: 0.3,
                }}>Vergeten?</button>
              </div>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                  color: focusedField === "password" ? t.cloudDeep : t.textTertiary,
                  fontSize: 14, transition: "color 0.2s ease",
                }}>⚿</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width: "100%", padding: "13px 16px 13px 42px",
                    background: t.bg, boxShadow: inputShadow(focusedField === "password"),
                    border: "none", outline: "none",
                    borderRadius: 99,
                    fontSize: 14, color: t.textPrimary,
                    fontFamily: "'Poppins',sans-serif",
                    transition: "box-shadow 0.2s ease",
                  }}
                />
              </div>
            </div>

            {/* Error inline */}
            {error && (
              <div style={{
                fontSize: 12, color: t.C.red.fg,
                background: t.C.red.bg, boxShadow: t.neu.insetSm,
                padding: "8px 14px", borderRadius: 99,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.C.red.fg, flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Primary submit button */}
            <button
              type="submit"
              onMouseEnter={() => setPwHover(true)}
              onMouseLeave={() => { setPwHover(false); setPwPressed(false); }}
              onMouseDown={() => setPwPressed(true)}
              onMouseUp={() => setPwPressed(false)}
              style={{
                marginTop: 6,
                background: t.bg,
                boxShadow: pwPressed ? t.neu.inset : (pwHover ? t.neu.lifted : t.neu.raised),
                transform: pwPressed ? "translateY(0)" : (pwHover ? "translateY(-2px)" : "translateY(0)"),
                border: "none", outline: "none",
                padding: "14px 24px", borderRadius: 99, cursor: "pointer",
                fontSize: 14, fontWeight: 600,
                color: pwHover || pwPressed ? t.cloudDeep : t.textPrimary,
                fontFamily: "'Poppins',sans-serif",
                transition: "box-shadow 0.25s ease, transform 0.2s ease, color 0.2s ease",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              Inloggen
              <span style={{ fontSize: 16, lineHeight: 1 }}>→</span>
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            width: "100%", margin: "22px 0 18px",
          }}>
            <div style={{ flex: 1, height: 1, background: t.divider }} />
            <span style={{
              fontSize: 10, color: t.textTertiary, fontWeight: 500,
              letterSpacing: 1, textTransform: "uppercase",
            }}>of</span>
            <div style={{ flex: 1, height: 1, background: t.divider }} />
          </div>

          {/* Google sign-in */}
          <button
            type="button"
            onMouseEnter={() => setGoogleHover(true)}
            onMouseLeave={() => { setGoogleHover(false); setGooglePressed(false); }}
            onMouseDown={() => setGooglePressed(true)}
            onMouseUp={() => setGooglePressed(false)}
            style={{
              width: "100%",
              background: t.bg,
              boxShadow: googlePressed ? t.neu.insetSm : (googleHover ? t.neu.liftedSm : t.neu.raisedSm),
              transform: googlePressed ? "translateY(0)" : (googleHover ? "translateY(-1px)" : "translateY(0)"),
              border: "none", outline: "none",
              padding: "12px 20px", borderRadius: 99, cursor: "pointer",
              fontSize: 13, fontWeight: 500,
              color: t.textPrimary,
              fontFamily: "'Poppins',sans-serif",
              transition: "box-shadow 0.2s ease, transform 0.15s ease",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            }}
          >
            <GoogleIcon size={18} />
            Doorgaan met Google
          </button>

          {/* Bottom helper */}
          <div style={{
            marginTop: 28,
            fontSize: 11, color: t.textTertiary,
            textAlign: "center", lineHeight: 1.6,
          }}>
            Toegang nodig?{" "}
            <button type="button" style={{
              background: "none", border: "none", color: t.cloudDeep,
              fontSize: 11, fontWeight: 500, cursor: "pointer",
              fontFamily: "'Poppins',sans-serif", padding: 0,
            }}>Neem contact op met je beheerder</button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: "center",
        padding: "16px 32px 24px",
        fontSize: 11, color: t.textTertiary,
        position: "relative", zIndex: 1,
        fontFamily: "'Poppins',sans-serif",
      }}>
        v0.1.0 · © {new Date().getFullYear()} H. Essers
      </footer>
    </div>
  );
}
