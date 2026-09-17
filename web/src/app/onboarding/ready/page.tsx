"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { RecordStatus } from "@/components/ui";

export default function ReadyPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/onboarding/zero-state");
  }, [router]);

  return <RecordStatus />;
}
