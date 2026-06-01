"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ActiveClientProvider } from "@/providers/active-client"
import { DbSyncProvider } from "@/providers/db-sync"

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 0, retry: 1 },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <DbSyncProvider>
        <ActiveClientProvider>{children}</ActiveClientProvider>
      </DbSyncProvider>
    </QueryClientProvider>
  )
}
