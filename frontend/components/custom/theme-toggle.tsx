"use client"

import { useTheme } from "next-themes"
import { SunIcon, MoonIcon } from "lucide-react"

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ${className ?? ""}`}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <SunIcon className="size-4 dark:hidden" style={{ color: "var(--k-text-secondary)" }} />
      <MoonIcon className="size-4 hidden dark:block" style={{ color: "var(--k-text-secondary)" }} />
    </button>
  )
}
