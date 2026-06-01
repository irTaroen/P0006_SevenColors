"use client"

import { useState } from "react"

export function ActionButton({
  label,
  variant = "secondary",
  onClick,
}: {
  label: string
  variant?: "primary" | "secondary"
  onClick?: () => void
}) {
  const [hover, setHover] = useState(false)
  const [pressed, setPressed] = useState(false)
  const isPrimary = variant === "primary"

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false)
        setPressed(false)
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      className="cursor-pointer rounded-full border-none px-3.5 py-1.5 text-[11px] whitespace-nowrap transition-all outline-none"
      style={{
        background: "var(--color-bg)",
        boxShadow: pressed
          ? "var(--shadow-inset-sm)"
          : hover
            ? "var(--shadow-lifted-sm)"
            : "var(--shadow-raised-sm)",
        transform: pressed ? "translateY(0)" : hover ? "translateY(-1px)" : "none",
        fontWeight: isPrimary ? 600 : 500,
        color: isPrimary
          ? hover || pressed
            ? "var(--color-cloud-deep)"
            : "var(--color-text-primary)"
          : "var(--color-text-secondary)",
      }}
    >
      {label}
    </button>
  )
}
