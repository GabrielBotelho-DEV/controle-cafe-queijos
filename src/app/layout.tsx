import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestão Café & Queijos",
  description:
    "Sistema isolado de gestão das operações de café e queijos: produção, compras, vendas e estoque.",
  applicationName: "Gestão Café & Queijos",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Café & Queijos",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#4A2C2A",
};

const scriptTema = `(function(){try{var t=localStorage.getItem("sistema-cafe-queijo:tema")||"claro";var e=t==="sistema"?(matchMedia("(prefers-color-scheme: dark)").matches?"escuro":"claro"):t;var r=document.documentElement;r.classList.toggle("dark",e==="escuro");r.dataset.tema=e;r.style.colorScheme=e==="escuro"?"dark":"light";}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
