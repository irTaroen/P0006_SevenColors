"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

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
}

export function NumberInput({
  value,
  onChange,
  integerOnly = false,
  className,
  onFocus,
  onBlur,
  ...props
}: NumberInputProps) {
  const [text, setText] = React.useState(() => String(value))
  const isFocusedRef = React.useRef(false)
  const pattern = integerOnly ? /^\d*$/ : /^\d*\.?\d*$/

  React.useEffect(() => {
    if (!isFocusedRef.current) {
      setText(String(value))
    }
  }, [value])

  const commit = (raw: string) => {
    const parsed = parseNumberInput(raw)
    const final = integerOnly ? Math.trunc(parsed) : parsed
    onChange(final)
    return String(final)
  }

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
        setText(commit(text))
        onBlur?.(e)
      }}
      onChange={(e) => {
        const next = e.target.value
        if (next !== "" && !pattern.test(next)) return
        if (next === "" || next === ".") {
          onChange(0)
          setText("")
          return
        }
        setText(next)
        const parsed = Number(next)
        if (!Number.isNaN(parsed)) {
          onChange(integerOnly ? Math.trunc(parsed) : parsed)
        }
      }}
    />
  )
}
