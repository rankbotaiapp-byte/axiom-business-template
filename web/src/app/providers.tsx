"use client";

import type { ReactNode } from "react";

import { AppProvider } from "@/stores/provider";
import type { AppState } from "@/types";

export function Providers({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: { userId: string; state: AppState } | null;
}) {
  return <AppProvider initial={initial}>{children}</AppProvider>;
}
