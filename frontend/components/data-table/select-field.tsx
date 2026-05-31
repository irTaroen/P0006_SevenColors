import { cn } from "@/lib/utils"

const selectClassName =
  "h-7 w-full rounded-md border border-input bg-input/20 px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"

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
      className={cn(selectClassName, className)}
    >
      {children}
    </select>
  )
}

export { selectClassName }
