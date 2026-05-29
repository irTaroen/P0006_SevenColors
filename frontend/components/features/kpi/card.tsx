/**
 * Individual KPI check card for the Kairos dashboard.
 *
 * Uses neumorphic raised/lifted/inset shadows (from globals.css CSS vars) directly
 * instead of shadcn Card, so the interactive press-state transitions feel physical.
 * Each card has a colored icon well whose hue maps to the check type:
 * amber=incomplete, red=unapproved, purple=payroll, grey=capacity, yellow=double.
 */
"use client"

import { useState } from "react"
import { Check } from "lucide-react"

const ICON_STYLES: Record<string, { fg: string; bg: string; icon: string }> = {
  checkCompleet:        { fg: "var(--k-amber-fg)",  bg: "var(--k-amber-bg)",  icon: "📋" },
  checkGeaccordeerd:    { fg: "var(--k-red-fg)",    bg: "var(--k-red-bg)",    icon: "✓"  },
  checkPayroll:         { fg: "var(--k-purple-fg)", bg: "var(--k-purple-bg)", icon: "€"  },
  checkWithinCapacity:  { fg: "var(--k-grey-fg)",   bg: "var(--k-grey-bg)",   icon: "▲"  },
  checkNietDubbel:      { fg: "var(--k-yellow-fg)", bg: "var(--k-yellow-bg)", icon: "⊞"  },
}

interface KpiCardProps {
  title: string
  value: number
  checkKey: string
  zeroText?: string
  onClick?: () => void
  isActive?: boolean
}

export function KpiCard({ title, value, checkKey, zeroText, onClick, isActive }: KpiCardProps) {
  const [hov, setHov] = useState(false)
  const [pressed, setPressed] = useState(false)
  const isPressed = pressed || isActive

  const style = ICON_STYLES[checkKey] ?? { fg: "var(--k-text-secondary)", bg: "var(--k-divider)", icon: "•" }

  const shadow = isPressed
    ? "var(--k-shadow-inset)"
    : hov
      ? "var(--k-shadow-lifted)"
      : "var(--k-shadow-raised)"

  const transform = isPressed ? "scale(0.99)" : hov ? "translateY(-2px)" : "none"

  if (value === 0 && zeroText) {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => { setHov(false); setPressed(false) }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        style={{
          background: "var(--k-bg)", boxShadow: shadow, transform,
          border: "none", outline: "none", borderRadius: 20, padding: "18px",
          cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 14,
          transition: "box-shadow 0.25s ease, transform 0.2s ease",
          width: "100%", position: "relative",
        }}
      >
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: "var(--k-green-bg)", boxShadow: "var(--k-shadow-inset-sm)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Check size={18} style={{ color: "var(--k-green-fg)" }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 11.5, color: "var(--k-text-secondary)", lineHeight: 1.4, fontWeight: 400 }}>
            {zeroText}
          </div>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: "var(--k-bg)", boxShadow: shadow, transform,
        border: "none", outline: "none", borderRadius: 20, padding: "18px",
        cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 14,
        transition: "box-shadow 0.25s ease, transform 0.2s ease",
        width: "100%", position: "relative",
      }}
    >
      {/* Colored icon well */}
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: style.bg, boxShadow: "var(--k-shadow-inset-sm)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, color: style.fg, flexShrink: 0, fontWeight: 600,
        transform: hov && !isPressed ? "scale(1.05)" : "scale(1)",
        transition: "transform 0.2s ease",
      }}>{style.icon}</div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 28, fontWeight: 600, letterSpacing: "-0.5px", lineHeight: 1, marginBottom: 6,
          color: hov && !isPressed ? "var(--k-cloud-deep)" : "var(--k-text-primary)",
          transition: "color 0.2s ease",
        }}>
          {value.toLocaleString("nl-NL")}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--k-text-secondary)", lineHeight: 1.3, fontWeight: 400, wordBreak: "break-word" }}>
          {title}
        </div>
      </div>

      {isActive && (
        <div style={{
          position: "absolute", top: 12, right: 14,
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--k-cloud-deep)",
          boxShadow: "0 0 0 3px var(--k-bg), 0 0 0 4px var(--k-cloud-light)",
        }} />
      )}
    </button>
  )
}
