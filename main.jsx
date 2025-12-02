import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/main.css"; // keep consistent with App

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Could not find #root element in index.html");
}

createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
