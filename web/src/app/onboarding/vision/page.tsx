"use client";

import { useRouter } from "next/navigation";

import { EmptyState, Shell } from "@/components/ui";
import { VisionCapture } from "@/components/vision";
import { visionFromExtraction } from "@/lib/extraction";
import type { VisionDraft } from "@/lib/vision-capture";
import { captureVision } from "@/stores/app-store";
import { useApp } from "@/stores/provider";

export default function VisionPage() {
  const router = useRouter();
  const { state, commit } = useApp();

  function complete(draft: VisionDraft) {
    let planId = "";
    commit((current) => {
      const result = captureVision(current, draft);
      planId = result.plan.id;
      return result.state;
    });
    router.replace(`/plan/${planId}`);
  }

  if (!state.profile) {
    return (
      <Shell overline="Vision Capture" title="Context missing">
        <EmptyState
          title="Requirement"
          body="Clarifying context is required before a vision can be captured."
        />
      </Shell>
    );
  }

  return (
    <VisionCapture
      profile={state.profile}
      initial={
        state.zeroState?.extraction
          ? visionFromExtraction(state.zeroState.extraction.answers)
          : undefined
      }
      onComplete={complete}
    />
  );
}
