import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";

// QueryClient is the cache — it stores every API response so components
// don't re-fetch data they already have. Created once here, shared everywhere.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // data stays fresh for 30 seconds
      retry: 1, // retry failed requests once before showing error
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
