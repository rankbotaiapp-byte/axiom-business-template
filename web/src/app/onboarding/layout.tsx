"use client";

import type { ReactNode } from "react";

import { RecordStatus } from "@/components/ui";
import { useAllowedPath } from "@/hooks/use-session-route";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  const allowed = useAllowedPath();
  if (!allowed) return <RecordStatus />;
  return children;
}
