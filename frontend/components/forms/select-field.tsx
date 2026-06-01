import { cn } from "@/lib/utils"

const selectFieldClassName =
  "neu-input h-7 w-full min-w-0 px-3 py-0.5 text-xs disabled:pointer-events-none disabled:opacity-50"

export function SelectField({
  value,
  onChange,
  children,
  className,
  id,
  required,
}: {
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
  className?: string
  id?: string
  required?: boolean
}) {
  return (
    <select
      id={id}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(selectFieldClassName, className)}
    >
      {children}
    </select>
  )
}
