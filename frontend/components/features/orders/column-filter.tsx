"use client"

import { useState } from "react"

export function ColumnFilter({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const [focused, setFocused] = useState(false)

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      className="w-full rounded-full border-none px-2.5 py-1.5 text-[11px] outline-none"
      style={{
        background: "var(--color-bg)",
        boxShadow: focused
          ? "var(--shadow-inset-xs), 0 0 0 2px var(--color-cloud-light)"
          : "var(--shadow-inset-xs)",
        color: "var(--color-text-primary)",
        transition: "box-shadow 0.2s ease",
      }}
    />
  )
}
