import { QueryClient } from '@tanstack/react-query'

/** Shared client so auth/logout can wipe cached user data. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
})

/** Drop all cached queries/mutations (call on login + logout). */
export function clearAppCache() {
  queryClient.clear()
}
