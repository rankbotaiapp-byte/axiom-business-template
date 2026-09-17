"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { firstRoute, isAllowedPath } from "@/lib/utils/session";
import { useApp } from "@/stores/provider";

export function useAllowedPath(): boolean {
  const { state, hydrated } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    if (!hydrated) return;

    if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
      setAllowed(true);
      return;
    }

    if (isAllowedPath(state, pathname)) {
      setAllowed(true);
      return;
    }

    setAllowed(false);
    router.replace(firstRoute(state));
  }, [hydrated, pathname, router, state]);

  return hydrated ? allowed : true;
}
