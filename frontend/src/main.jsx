import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";

import App from "./App";
import AuthProvider from "./context/AuthProvider";
import DataProvider from "./context/DataProvider";
import "./index.css";

ModuleRegistry.registerModules([AllCommunityModule]);
const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <DataProvider>
          <App />
        </DataProvider>
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>
);
