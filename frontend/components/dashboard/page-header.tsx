import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export function OverviewPageHeader({
  icon: Icon,
  title,
  titleAccent = "overview",
  description,
  descriptionClassName,
  className,
}: {
  icon: LucideIcon
  title: string
  titleAccent?: string
  description: ReactNode
  descriptionClassName?: string
  className?: string
}) {
  return (
    <div className={cn("animate-fade-up max-w-2xl pt-4 pl-4", className)}>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-3">
          <Icon
            className="mt-1 size-7 shrink-0"
            style={{ color: "var(--color-cloud-deep)" }}
            aria-hidden
          />
          <h2
            className="min-w-0 text-[28px] font-bold tracking-[-0.6px]"
            style={{ color: "var(--color-text-primary)" }}
          >
            {title}{" "}
            <span
              className="italic"
              style={{ color: "var(--color-cloud-deep)" }}
            >
              {titleAccent}
            </span>
          </h2>
        </div>
        <p
          className={cn("text-[13px] leading-relaxed", descriptionClassName)}
          style={{ color: "var(--color-text-secondary)" }}
        >
          {description}
        </p>
      </div>
    </div>
  )
}
