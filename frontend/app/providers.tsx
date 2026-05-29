"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ActiveClientProvider } from "@/providers/active-client"

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 1000 * 60, retry: 1 },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ActiveClientProvider>{children}</ActiveClientProvider>
    </QueryClientProvider>
  )
}
