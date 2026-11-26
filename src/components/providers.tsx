"use client";

import { useEffect, type ReactNode } from "react";
import { AuthProvider } from "@/lib/auth-context";
import { WorkspaceProvider } from "@/lib/workspace-context";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Evita cache em desenvolvimento; o service worker só roda no build de produção.
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const registrar = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Falha de registro não impede o uso do sistema.
      });
    };

    if (document.readyState === "complete") registrar();
    else window.addEventListener("load", registrar);

    return () => window.removeEventListener("load", registrar);
  }, []);

  return (
    <AuthProvider>
      <WorkspaceProvider>{children}</WorkspaceProvider>
    </AuthProvider>
  );
}
