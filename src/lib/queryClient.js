import { QueryClient } from "@tanstack/react-query";

// Katalog jest read-heavy i rzadko się zmienia (backend cache'uje w Redis) —
// długi staleTime, brak refetch on focus, jedna próba retry.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 10 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
