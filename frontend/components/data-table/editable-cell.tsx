"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface EditableCellProps {
  value: string | number | null | undefined
  onSave: (value: string) => void
  type?: "text" | "number" | "email" | "tel" | "date"
  className?: string
  readOnly?: boolean
}

export function EditableCell({
  value,
  onSave,
  type = "text",
  className,
  readOnly = false,
}: EditableCellProps) {
  const [editing, setEditing] = React.useState(false)
  const [localValue, setLocalValue] = React.useState(String(value ?? ""))
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setLocalValue(String(value ?? ""))
  }, [value])

  React.useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const handleSave = () => {
    setEditing(false)
    if (localValue !== String(value ?? "")) {
      onSave(localValue)
    }
  }

  if (readOnly) {
    return (
      <span className={cn("block w-full px-1 py-0.5 text-muted-foreground", className)}>
        {value ?? "—"}
      </span>
    )
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave()
          if (e.key === "Escape") {
            setLocalValue(String(value ?? ""))
            setEditing(false)
          }
        }}
        className="h-6 w-full px-1 text-xs"
      />
    )
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn(
        "block h-6 w-full cursor-text truncate rounded px-1 py-0.5 leading-5 hover:bg-muted/60 hover:ring-1 hover:ring-border",
        className,
      )}
    >
      {value != null && value !== "" ? value : (
        <span className="italic text-muted-foreground/40">click to edit</span>
      )}
    </span>
  )
}
