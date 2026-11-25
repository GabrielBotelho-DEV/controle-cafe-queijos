import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestão Café & Queijos",
  description:
    "Sistema isolado de gestão das operações de café e queijos: produção, compras, vendas e estoque.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
