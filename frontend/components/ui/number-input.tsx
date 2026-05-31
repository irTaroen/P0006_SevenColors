"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

function formatNumberDisplay(value: number, emptyWhenZero: boolean) {
  if (emptyWhenZero && value === 0) return ""
  return String(value)
}

function parseNumberInput(text: string) {
  if (text === "" || text === ".") return 0
  const parsed = Number(text)
  return Number.isNaN(parsed) ? 0 : parsed
}

type NumberInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange" | "inputMode"
> & {
  value: number
  onChange: (value: number) => void
  /** When true, only whole numbers are allowed. Default false (decimals allowed). */
  integerOnly?: boolean
  /** Show an empty field when the value is 0. Default true. */
  emptyWhenZero?: boolean
}

export function NumberInput({
  value,
  onChange,
  integerOnly = false,
  emptyWhenZero = true,
  className,
  onFocus,
  onBlur,
  ...props
}: NumberInputProps) {
  const [text, setText] = React.useState(() => formatNumberDisplay(value, emptyWhenZero))
  const isFocusedRef = React.useRef(false)
  const pattern = integerOnly ? /^\d*$/ : /^\d*\.?\d*$/

  React.useEffect(() => {
    if (!isFocusedRef.current) {
      setText(formatNumberDisplay(value, emptyWhenZero))
    }
  }, [value, emptyWhenZero])

  return (
    <Input
      {...props}
      type="text"
      inputMode={integerOnly ? "numeric" : "decimal"}
      value={text}
      className={cn("tabular-nums", className)}
      onFocus={(e) => {
        isFocusedRef.current = true
        e.currentTarget.select()
        onFocus?.(e)
      }}
      onBlur={(e) => {
        isFocusedRef.current = false
        const parsed = parseNumberInput(text)
        const final = integerOnly ? Math.trunc(parsed) : parsed
        onChange(final)
        setText(formatNumberDisplay(final, emptyWhenZero))
        onBlur?.(e)
      }}
      onChange={(e) => {
        const next = e.target.value
        if (next !== "" && !pattern.test(next)) return
        setText(next)
        if (next !== "" && next !== ".") {
          const parsed = Number(next)
          if (!Number.isNaN(parsed)) {
            onChange(integerOnly ? Math.trunc(parsed) : parsed)
          }
        }
      }}
    />
  )
}
