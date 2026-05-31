import * as React from "react"

import { cn } from "@/lib/utils"

export function ExpandedDetailColumn({
  label,
  align = "left",
  children,
}: {
  label: string
  align?: "left" | "right"
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5 py-0.5">
      <span
        className={cn(
          "text-[10px] font-medium uppercase tracking-wide text-muted-foreground",
          align === "right" && "text-right",
        )}
      >
        {label}
      </span>
      <div className={cn("flex flex-col gap-1", align === "right" && "items-end")}>{children}</div>
    </div>
  )
}
