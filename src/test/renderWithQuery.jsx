// src/test/renderWithQuery.jsx
import PropTypes from "prop-types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Świeży klient per użycie, retry wyłączony (błędy natychmiast widoczne w teście).
export function makeQueryWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  function Wrapper({ children }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  Wrapper.propTypes = { children: PropTypes.node };
  return Wrapper;
}
