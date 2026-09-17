"use client";

import { useMemo, useState } from "react";

import { Shell } from "@/components/ui";
import {
  assessDraft,
  CLARIFYING_STAGES,
  draftFromProfile,
  emptyClarifyingDraft,
  type ClarifyingDraft,
  type ClarifyingStage,
} from "@/lib/clarifying";
import type { UserProfile } from "@/types";

import { CapacityStep } from "./capacity";
import { ConstraintsStep } from "./constraints";
import { GoalsStep } from "./goals";
import { ResponsibilitiesStep } from "./responsibilities";
import { ReviewStep } from "./review";

const TITLE: Record<ClarifyingStage, string> = {
  responsibilities: "Current responsibilities",
  goals: "Competing goals",
  capacity: "Weekly capacity",
  constraints: "Hard constraints",
  review: "Review context",
};

export function ClarifyingEngine({
  profile,
  seed,
  onComplete,
}: {
  profile: UserProfile | null;
  seed?: ClarifyingDraft | null;
  onComplete: (draft: ClarifyingDraft) => void;
}) {
  const [stage, setStage] = useState<ClarifyingStage>("responsibilities");
  const [draft, setDraft] = useState<ClarifyingDraft>(() =>
    seed ?? (profile ? draftFromProfile(profile) : emptyClarifyingDraft())
  );
  const [busy, setBusy] = useState(false);
  const index = CLARIFYING_STAGES.indexOf(stage) + 1;

  const reviewOk = useMemo(() => assessDraft(draft).ok, [draft]);

  function next(from: ClarifyingStage) {
    const at = CLARIFYING_STAGES.indexOf(from);
    setStage(CLARIFYING_STAGES[at + 1] ?? "review");
  }

  function confirm() {
    if (!reviewOk || busy) return;
    setBusy(true);
    onComplete(draft);
  }

  return (
    <Shell overline={`Clarifying · ${index} / ${CLARIFYING_STAGES.length}`} title={TITLE[stage]}>
      {stage === "responsibilities" ? (
        <ResponsibilitiesStep draft={draft} onChange={setDraft} onContinue={() => next("responsibilities")} />
      ) : null}
      {stage === "goals" ? (
        <GoalsStep draft={draft} onChange={setDraft} onContinue={() => next("goals")} />
      ) : null}
      {stage === "capacity" ? (
        <CapacityStep draft={draft} onChange={setDraft} onContinue={() => next("capacity")} />
      ) : null}
      {stage === "constraints" ? (
        <ConstraintsStep draft={draft} onChange={setDraft} onContinue={() => next("constraints")} />
      ) : null}
      {stage === "review" ? (
        <ReviewStep draft={draft} onEdit={setStage} onConfirm={confirm} busy={busy} />
      ) : null}
    </Shell>
  );
}
