import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { OgImage } from "./og-main.tsx";

const isOg =
  window.location.pathname === "/og" || new URLSearchParams(window.location.search).has("og");

createRoot(document.getElementById("root")!).render(
  <StrictMode>{isOg ? <OgImage /> : <App />}</StrictMode>,
);
