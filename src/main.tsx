import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AdminApp } from "./admin/AdminApp";
import "./index.css";
import { installButtonClickSound } from "./lib/sound";
import { WinterBackdrop } from "./components/WinterBackdrop";

const isAdminRoute = window.location.hash === "#admin";

installButtonClickSound();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isAdminRoute ? (
      <AdminApp />
    ) : (
      <>
        <WinterBackdrop />
        <App />
      </>
    )}
  </StrictMode>,
);
