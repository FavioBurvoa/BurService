import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { KcPage } from "./kc.gen";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {!window.kcContext ? (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: "12px",
          fontFamily: "sans-serif",
          color: "#6b7280",
          background: "#f8fafc"
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "white"
          }}
        >
          S
        </div>
        <p style={{ margin: 0, fontWeight: 600, color: "#374151" }}>Saga Ops — Keycloak Theme</p>
        <p style={{ margin: 0, fontSize: "0.875rem" }}>
          Ejecuta <code style={{ background: "#e5e7eb", padding: "2px 6px", borderRadius: 4 }}>npm run storybook</code> para desarrollar el tema.
        </p>
      </div>
    ) : (
      <KcPage kcContext={window.kcContext} />
    )}
  </StrictMode>
);
