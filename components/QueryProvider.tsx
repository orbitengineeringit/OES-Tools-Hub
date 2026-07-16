'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

// Wraps the app in a TanStack Query client.
// Instantiated in a client component so each browser session gets its own client
// (avoids cross-request data leaks in server rendering).
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute fresh time
            gcTime: 10 * 60 * 1000, // 10 minutes cache retention
            refetchOnWindowFocus: false, // Prevent wasteful tab-switch refetches
            refetchOnReconnect: false,
            retry: 1,
          },
        },
      }),
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
