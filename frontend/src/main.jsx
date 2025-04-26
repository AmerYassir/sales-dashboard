import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import AuthProvider from "./context/AuthProvider";
import DataProvider from "./context/DataProvider";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </AuthProvider>
  </StrictMode>
);
