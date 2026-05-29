"use client"

import { useState } from "react"
import { KpiSection } from "@/components/features/kpi"

export default function Page() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  function handleFilter(key: string) {
    setActiveFilter((prev) => (prev === key ? null : key))
  }

  return (
    <div className="px-5 pt-5">
      <KpiSection
        activeFilter={activeFilter}
        onFilterChange={handleFilter}
      />
    </div>
  )
}
