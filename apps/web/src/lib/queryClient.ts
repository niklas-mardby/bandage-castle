import { QueryClient } from '@tanstack/react-query'

// One QueryClient for the whole app. New pages should use React Query
// (see hooks/queries.ts) instead of useApi / apiFetch in useEffect.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
