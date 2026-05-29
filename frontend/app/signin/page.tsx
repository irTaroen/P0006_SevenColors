"use client"

import { useState } from "react"
import { useTheme } from "next-themes"

const CloudLogo = ({ size = 80 }: { size?: number }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} style={{ display: "block" }}>
    <path
      d="M16 22 Q12 22 10 25 Q8 28 10 31 Q11 33 14 33 L22 33 Q25 33 25 30 Q25 27 22 26 Q22 22 18 22 Z"
      fill="var(--k-cloud-light)" stroke="#2a2438" strokeWidth="1.8" strokeLinejoin="round"
    />
    <path
      d="M30 18 Q22 18 20 25 Q14 26 14 32 Q14 38 22 38 L46 38 Q54 38 54 30 Q54 24 47 23 Q46 16 38 16 Q33 16 30 18 Z"
      fill="var(--k-cloud-light)" stroke="#2a2438" strokeWidth="2" strokeLinejoin="round"
    />
    <path
      d="M32 38 Q25 38 24 44 Q20 45 20 49 Q20 53 26 53 L46 53 Q52 53 52 48 Q52 43 46 43 Q45 38 38 38 Q35 38 32 38 Z"
      fill="var(--k-cloud-mid)" stroke="#2a2438" strokeWidth="2" strokeLinejoin="round"
    />
  </svg>
)

const NeuIconBtn = ({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick?: () => void
}) => {
  const [hov, setHov] = useState(false)
  const [pressed, setPressed] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: "var(--k-bg)",
        boxShadow: pressed
          ? "var(--k-shadow-inset-sm)"
          : hov
            ? "var(--k-shadow-lifted-sm)"
            : "var(--k-shadow-raised-sm)",
        transform: pressed ? "translateY(0)" : hov ? "translateY(-1px)" : "translateY(0)",
        border: "none", outline: "none",
        width: 42, height: 42, borderRadius: "50%", cursor: "pointer",
        color: hov || pressed ? "var(--k-cloud-deep)" : "var(--k-text-primary)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "box-shadow 0.2s ease, transform 0.15s ease, color 0.2s ease",
        fontSize: 16,
      }}
    >
      {children}
    </button>
  )
}

const GoogleIcon = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} style={{ display: "block", flexShrink: 0 }}>
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.1 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3c-2 1.4-4.5 2.5-7.3 2.5-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.3 5.3C42 35 44 30 44 24c0-1.3-.1-2.6-.4-3.9z" />
  </svg>
)

export default function SignInPage() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [pwHover, setPwHover] = useState(false)
  const [pwPressed, setPwPressed] = useState(false)
  const [googleHover, setGoogleHover] = useState(false)
  const [googlePressed, setGooglePressed] = useState(false)

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!email || !password) {
      setError("Vul beide velden in om in te loggen.")
      return
    }
    setError(null)
  }

  const inputShadow = (focused: boolean) =>
    focused
      ? "var(--k-shadow-inset-sm), 0 0 0 2px var(--k-cloud-light)"
      : "var(--k-shadow-inset-sm)"

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @keyframes signin-float-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes signin-drift {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }
        .signin-card { animation: signin-float-up 0.6s ease both; }
        .signin-logo { animation: signin-drift 6s ease-in-out infinite; }
        .signin-input::placeholder { color: var(--k-text-tertiary); }
      `}</style>

      {/* Theme toggle */}
      <div style={{ position: "absolute", top: 24, right: 28, zIndex: 10 }}>
        <NeuIconBtn onClick={() => setTheme(isDark ? "light" : "dark")}>
          {isDark ? "☀" : "☾"}
        </NeuIconBtn>
      </div>

      {/* Centered card */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          className="signin-card"
          style={{
            background: "var(--k-bg)",
            boxShadow: "var(--k-shadow-raised)",
            borderRadius: 28,
            padding: "44px 44px 36px",
            width: "100%",
            maxWidth: 420,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Logo plate */}
          <div
            className="signin-logo"
            style={{
              width: 96, height: 96, borderRadius: 26,
              background: "var(--k-bg)",
              boxShadow: "var(--k-shadow-raised)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <CloudLogo size={56} />
          </div>

          {/* Brand label */}
          <div
            style={{
              fontSize: 11,
              color: "var(--k-text-tertiary)",
              fontWeight: 500,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Nimbus · Kairos
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: 28, fontWeight: 700,
              color: "var(--k-text-primary)",
              letterSpacing: "-0.5px",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Welkom terug
          </h1>

          {/* Subhead */}
          <p
            style={{
              fontSize: 13,
              color: "var(--k-text-secondary)",
              marginBottom: 32,
              textAlign: "center",
            }}
          >
            Log in om verder te gaan met je workforce roster.
          </p>

          {/* Form */}
          <form
            onSubmit={submit}
            style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}
          >
            {/* Email */}
            <div>
              <label
                style={{
                  display: "block", fontSize: 11, fontWeight: 500,
                  color: "var(--k-text-secondary)", marginBottom: 6,
                  letterSpacing: 0.4, textTransform: "uppercase",
                }}
              >
                E-mail
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                    color: focusedField === "email" ? "var(--k-cloud-deep)" : "var(--k-text-tertiary)",
                    fontSize: 14, transition: "color 0.2s ease",
                  }}
                >
                  ✉
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null) }}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="naam@essers.com"
                  autoComplete="email"
                  className="signin-input"
                  style={{
                    width: "100%", padding: "13px 16px 13px 42px",
                    background: "var(--k-bg)",
                    boxShadow: inputShadow(focusedField === "email"),
                    border: "none", outline: "none", borderRadius: 99,
                    fontSize: 14, color: "var(--k-text-primary)", fontFamily: "inherit",
                    transition: "box-shadow 0.2s ease",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div
                style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "baseline", marginBottom: 6,
                }}
              >
                <label
                  style={{
                    fontSize: 11, fontWeight: 500, color: "var(--k-text-secondary)",
                    letterSpacing: 0.4, textTransform: "uppercase",
                  }}
                >
                  Wachtwoord
                </label>
                <button
                  type="button"
                  style={{
                    background: "none", border: "none", outline: "none",
                    color: "var(--k-cloud-deep)", fontSize: 11, fontWeight: 500,
                    fontFamily: "inherit", cursor: "pointer", letterSpacing: 0.3,
                  }}
                >
                  Vergeten?
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                    color: focusedField === "password" ? "var(--k-cloud-deep)" : "var(--k-text-tertiary)",
                    fontSize: 14, transition: "color 0.2s ease",
                  }}
                >
                  ⚿
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null) }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="signin-input"
                  style={{
                    width: "100%", padding: "13px 16px 13px 42px",
                    background: "var(--k-bg)",
                    boxShadow: inputShadow(focusedField === "password"),
                    border: "none", outline: "none", borderRadius: 99,
                    fontSize: 14, color: "var(--k-text-primary)", fontFamily: "inherit",
                    transition: "box-shadow 0.2s ease",
                  }}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  fontSize: 12, color: "var(--k-red-fg)",
                  background: "var(--k-red-bg)",
                  boxShadow: "var(--k-shadow-inset-sm)",
                  padding: "8px 14px", borderRadius: 99,
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <span
                  style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: "var(--k-red-fg)", flexShrink: 0,
                  }}
                />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              onMouseEnter={() => setPwHover(true)}
              onMouseLeave={() => { setPwHover(false); setPwPressed(false) }}
              onMouseDown={() => setPwPressed(true)}
              onMouseUp={() => setPwPressed(false)}
              style={{
                marginTop: 6,
                background: "var(--k-bg)",
                boxShadow: pwPressed
                  ? "var(--k-shadow-inset)"
                  : pwHover
                    ? "var(--k-shadow-lifted)"
                    : "var(--k-shadow-raised)",
                transform: pwPressed ? "translateY(0)" : pwHover ? "translateY(-2px)" : "translateY(0)",
                border: "none", outline: "none",
                padding: "14px 24px", borderRadius: 99, cursor: "pointer",
                fontSize: 14, fontWeight: 600,
                color: pwHover || pwPressed ? "var(--k-cloud-deep)" : "var(--k-text-primary)",
                fontFamily: "inherit",
                transition: "box-shadow 0.25s ease, transform 0.2s ease, color 0.2s ease",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              Inloggen
              <span style={{ fontSize: 16, lineHeight: 1 }}>→</span>
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: 12,
              width: "100%", margin: "22px 0 18px",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "var(--k-divider)" }} />
            <span
              style={{
                fontSize: 10, color: "var(--k-text-tertiary)", fontWeight: 500,
                letterSpacing: 1, textTransform: "uppercase",
              }}
            >
              of
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--k-divider)" }} />
          </div>

          {/* Google */}
          <button
            type="button"
            onMouseEnter={() => setGoogleHover(true)}
            onMouseLeave={() => { setGoogleHover(false); setGooglePressed(false) }}
            onMouseDown={() => setGooglePressed(true)}
            onMouseUp={() => setGooglePressed(false)}
            style={{
              width: "100%",
              background: "var(--k-bg)",
              boxShadow: googlePressed
                ? "var(--k-shadow-inset-sm)"
                : googleHover
                  ? "var(--k-shadow-lifted-sm)"
                  : "var(--k-shadow-raised-sm)",
              transform: googlePressed ? "translateY(0)" : googleHover ? "translateY(-1px)" : "translateY(0)",
              border: "none", outline: "none",
              padding: "12px 20px", borderRadius: 99, cursor: "pointer",
              fontSize: 13, fontWeight: 500,
              color: "var(--k-text-primary)", fontFamily: "inherit",
              transition: "box-shadow 0.2s ease, transform 0.15s ease",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            }}
          >
            <GoogleIcon size={18} />
            Doorgaan met Google
          </button>

          {/* Footer link */}
          <div
            style={{
              marginTop: 28,
              fontSize: 11, color: "var(--k-text-tertiary)",
              textAlign: "center", lineHeight: 1.6,
            }}
          >
            Toegang nodig?{" "}
            <button
              type="button"
              style={{
                background: "none", border: "none", color: "var(--k-cloud-deep)",
                fontSize: 11, fontWeight: 500, cursor: "pointer",
                fontFamily: "inherit", padding: 0,
              }}
            >
              Neem contact op met je beheerder
            </button>
          </div>
        </div>
      </main>

      <footer
        style={{
          textAlign: "center",
          padding: "16px 32px 24px",
          fontSize: 11, color: "var(--k-text-tertiary)",
          position: "relative", zIndex: 1,
        }}
      >
        v0.1.0 · © 2026 H. Essers
      </footer>
    </div>
  )
}
