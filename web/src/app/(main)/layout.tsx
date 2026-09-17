"use client";

import { MainNav, RecordStatus } from "@/components/ui";
import { useAllowedPath } from "@/hooks/use-session-route";

export default function MainLayout({ children }: LayoutProps<"/">) {
  const allowed = useAllowedPath();
  if (!allowed) return <RecordStatus />;
  return (
    <>
      <MainNav />
      {children}
    </>
  );
}
