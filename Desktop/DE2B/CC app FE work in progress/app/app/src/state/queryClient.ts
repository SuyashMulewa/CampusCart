/**
 * Configured QueryClient singleton for TanStack Query.
 *
 * Central configuration for:
 * - Default stale time, retry policy, refetch behavior
 * - Global error handler (logs ApiError instances)
 *
 * Usage: import { queryClient } from '@/state/queryClient';
 *        <QueryClientProvider client={queryClient}>
 */
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/models';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 30 seconds — prevents unnecessary refetches
      staleTime: 30_000,
      // Cache persists for 5 minutes after component unmount
      gcTime: 5 * 60_000,
      // Retry once for network-like errors, never for 4xx client errors
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.code >= 400 && error.code < 500) {
          return false;
        }
        return failureCount < 1;
      },
      // Don't refetch on window focus for mock API (no real data changes externally)
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Never retry mutations
      retry: false,
    },
  },
});
