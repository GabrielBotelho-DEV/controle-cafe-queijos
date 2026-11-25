"use client";

import type { ReactNode } from "react";
import { QueijosProvider } from "@/modules/queijos/queijos-context";

export default function QueijosLayout({ children }: { children: ReactNode }) {
  return <QueijosProvider>{children}</QueijosProvider>;
}
