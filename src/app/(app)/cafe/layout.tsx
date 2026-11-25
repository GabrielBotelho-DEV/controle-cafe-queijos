"use client";

import type { ReactNode } from "react";
import { CafeProvider } from "@/modules/cafe/cafe-context";

export default function CafeLayout({ children }: { children: ReactNode }) {
  return <CafeProvider>{children}</CafeProvider>;
}
