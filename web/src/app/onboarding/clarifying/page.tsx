"use client";

import { useRouter } from "next/navigation";

import { ClarifyingEngine } from "@/components/clarifying";
import type { ClarifyingDraft } from "@/lib/clarifying";
import { clarifyingFromExtraction } from "@/lib/extraction";
import { completeClarifying } from "@/stores/app-store";
import { useApp } from "@/stores/provider";

export default function ClarifyingPage() {
  const router = useRouter();
  const { state, commit } = useApp();
  const seed = state.zeroState?.extraction
    ? clarifyingFromExtraction(state.zeroState.extraction.answers)
    : null;

  function complete(draft: ClarifyingDraft) {
    commit((current) => completeClarifying(current, draft));
    router.replace("/onboarding/vision");
  }

  return <ClarifyingEngine profile={state.profile} seed={seed} onComplete={complete} />;
}
