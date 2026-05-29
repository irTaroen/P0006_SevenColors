"use client"

import * as React from "react"

interface ActiveClientContextValue {
  activeClientId: string | null
  setActiveClientId: (id: string | null) => void
}

const ActiveClientContext = React.createContext<ActiveClientContextValue>({
  activeClientId: null,
  setActiveClientId: () => {},
})

export function ActiveClientProvider({ children }: { children: React.ReactNode }) {
  const [activeClientId, setActiveClientId] = React.useState<string | null>(null)

  return (
    <ActiveClientContext.Provider value={{ activeClientId, setActiveClientId }}>
      {children}
    </ActiveClientContext.Provider>
  )
}

export function useActiveClient() {
  return React.useContext(ActiveClientContext)
}
