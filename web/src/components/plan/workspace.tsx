"use client";

import { useEffect, useMemo, useState } from "react";

import { EvidenceConfirmation } from "@/components/evidence";
import { EmptyState, Shell } from "@/components/ui";
import { TurningPointDeclaration } from "@/components/turning-points";
import { LivingVision } from "@/components/vision";
import type { EvidenceDraft } from "@/lib/evidence";
import { capacityContext, isPrimarySequenceComplete, needsCapitalizationReview, toPlanningInput } from "@/lib/planning";
import { evidenceForTurningPoint } from "@/lib/turning-points";
import {
  ensurePlanGenerated,
  ensureRolesGenerated,
  lockCapitalization,
  lockPlan,
  recordEvidence,
  requestAlternativeRoute,
  requestCapitalizationAlternative,
} from "@/stores/app-store";
import { useApp } from "@/stores/provider";
import { workFor } from "@/stores/selectors";

import { ActivePath } from "./active-path";
import { PhaseIndicator } from "./phase-indicator";
import { PlanReview } from "./review";

export function PlanWorkspace({ planId }: { planId: string }) {
  const { state, commit } = useApp();
  const { plan, vision, turningPoint } = workFor(state, planId);
  const [busy, setBusy] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [recorded, setRecorded] = useState(false);

  useEffect(() => {
    if (!plan || plan.actions.length > 0 || !state.profile) return;
    commit((current) => ensurePlanGenerated(current, planId));
  }, [plan, planId, state.profile]);

  useEffect(() => {
    if (!plan || plan.isLocked) return;
    commit((current) => ensureRolesGenerated(current, planId));
  }, [plan, planId]);

  const input = useMemo(() => {
    if (!vision || !state.profile) return null;
    return toPlanningInput(vision, state.profile);
  }, [state.profile, vision]);

  const route = plan
    ? (state.planRoutes[plan.id] ?? (input ? capacityContext(input).defaultRoute : "necessary"))
    : "necessary";
  const reviewingCapitalization = plan ? needsCapitalizationReview(plan) : false;

  function alternative(reason: string) {
    if (busy) return;
    setBusy(true);
    commit((current) =>
      reviewingCapitalization
        ? requestCapitalizationAlternative(current, planId)
        : requestAlternativeRoute(current, planId, reason)
    );
    setBusy(false);
  }

  function confirmLock(input?: { acknowledged?: boolean; acceptMisalignment?: boolean }) {
    if (busy) return;
    setBusy(true);
    commit((current) =>
      reviewingCapitalization
        ? lockCapitalization(current, planId, input)
        : lockPlan(current, planId, input)
    );
    setBusy(false);
  }

  function record(actionId: string, draft: EvidenceDraft) {
    if (busy) return;
    setBusy(true);
    setRecorded(false);
    setPlacing(true);
    let wrote = false;
    commit((current) => {
      const result = recordEvidence(current, { actionId, draft });
      wrote = Boolean(result.evidence);
      return result.state;
    });
    if (!wrote) {
      setPlacing(false);
      setBusy(false);
      return;
    }
    window.setTimeout(() => {
      setPlacing(false);
      setRecorded(true);
      setBusy(false);
    }, 700);
  }

  if (!plan || !vision || !input) {
    return (
      <Shell overline="Plan" title="No plan">
        <EmptyState
          title="Missing record"
          body="This identifier is not in the record, or clarifying context is absent."
        />
      </Shell>
    );
  }

  const overline = !plan.isLocked
    ? "Plan"
    : reviewingCapitalization
      ? "Capitalization"
      : isPrimarySequenceComplete(plan) || vision.status === "completed"
        ? "Completed path"
        : "Committed path";

  return (
    <Shell overline={overline} title={vision.title}>
      {recorded || placing ? <EvidenceConfirmation placing={placing} /> : null}
      {!plan.isLocked ? (
        <PlanReview
          plan={plan}
          input={input}
          route={route}
          busy={busy}
          onAlternative={alternative}
          onLock={confirmLock}
        />
      ) : reviewingCapitalization ? (
        <>
          <LivingVision vision={vision} threshold={turningPoint} />
          {turningPoint ? (
            <TurningPointDeclaration
              point={turningPoint}
              evidence={evidenceForTurningPoint(state.evidence, turningPoint)}
            />
          ) : null}
          <PhaseIndicator plan={plan} vision={vision} turningPoint={turningPoint} />
          <PlanReview
            plan={plan}
            input={input}
            route={route}
            mode="capitalization"
            busy={busy}
            onAlternative={alternative}
            onLock={confirmLock}
          />
        </>
      ) : (
        <ActivePath
          plan={plan}
          vision={vision}
          turningPoint={turningPoint}
          evidence={state.evidence}
          recording={busy}
          onRecord={record}
        />
      )}
    </Shell>
  );
}
