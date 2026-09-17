"use client";

import { useEffect, useMemo, useState } from "react";

import { StrategicConnectionPanel } from "@/components/connections";
import { Button, CheckRow, Field, Panel } from "@/components/ui";
import { CAPITALIZATION_COPY, planSources, stressTest } from "@/lib/planning";
import { CAPITALIZATION_PHASE } from "@/lib/turning-points";
import type { Plan, PlanningInput, PlanRoute } from "@/types";

import { PlanSequence } from "./sequence";
import { ConstraintStressTest } from "./stress-test";

export function PlanReview({
  plan,
  input,
  route,
  busy,
  mode = "foundation",
  onAlternative,
  onLock,
}: {
  plan: Plan;
  input: PlanningInput;
  route: PlanRoute;
  busy: boolean;
  mode?: "foundation" | "capitalization";
  onAlternative: (reason: string) => void;
  onLock: (input?: { acknowledged?: boolean; acceptMisalignment?: boolean }) => void;
}) {
  const [reason, setReason] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [path, setPath] = useState(false);
  const [record, setRecord] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [overrideMisaligned, setOverrideMisaligned] = useState(false);
  const actionKey = plan.actions.map((action) => action.id).join(":");

  useEffect(() => {
    setReviewed(false);
    setPath(false);
    setRecord(false);
    setAcknowledged(false);
    setOverrideMisaligned(false);
  }, [actionKey]);

  const sources = planSources(input, route);
  const reviewPlan =
    mode === "capitalization"
      ? {
          ...plan,
          phases: [CAPITALIZATION_PHASE],
          actions: plan.actions.filter((action) => action.phase === CAPITALIZATION_PHASE),
        }
      : plan;
  const report = useMemo(() => {
    const scoped =
      mode === "capitalization"
        ? {
            ...plan,
            phases: [CAPITALIZATION_PHASE],
            actions: plan.actions.filter((action) => action.phase === CAPITALIZATION_PHASE),
          }
        : plan;
    return stressTest(scoped, input, route);
  }, [input, mode, plan, route]);
  const risksAccepted = report.findings.length === 0 || acknowledged;
  const overrideReady = report.severity !== "misaligned" || overrideMisaligned;
  const canAlternative =
    mode === "capitalization" ? !busy : reason.trim().length >= 16 && !busy;
  const canLock =
    reviewed &&
    path &&
    record &&
    risksAccepted &&
    overrideReady &&
    !busy &&
    reviewPlan.actions.length > 0;

  return (
    <>
      <p className="lede">
        {mode === "capitalization"
          ? "The foundation threshold has been crossed. The system has generated a capitalization sequence. Review it. Once locked, these actions become the primary path."
          : "Read the sequence carefully. Once locked, these actions become the primary path. Evidence will attach to each action."}
      </p>

      <Panel>
        <p className="kicker">
          Generated from
        </p>
        <p className="kicker">
          Stated vision
        </p>
        <p className="copy">{sources.vision}</p>
        <p className="kicker">
          Responsibilities and capacity
        </p>
        <p className="copy">{sources.capacity}</p>
        <p className="kicker">
          What similar outcomes require
        </p>
        <p className="copy">{sources.research}</p>
        <p className="kicker">
          {mode === "capitalization" ? CAPITALIZATION_COPY.title : sources.route.title}
        </p>
        <p className="lede">
          {mode === "capitalization" ? CAPITALIZATION_COPY.why : sources.route.why}
        </p>
      </Panel>

      <PlanSequence plan={reviewPlan} />

      {mode === "foundation" ? (
        <StrategicConnectionPanel planId={plan.id} visionId={input.visionId} locked={plan.isLocked} />
      ) : null}

      <ConstraintStressTest
        report={report}
        acknowledged={acknowledged}
        onAcknowledge={() => setAcknowledged((value) => !value)}
        onAdjust={onAlternative}
        busy={busy}
        showAdjust
      />

      <Panel>
        <p className="kicker">
          {mode === "capitalization" ? "Alternate leverage sequence" : "Alternative route"}
        </p>
        <p className="lede">
          {mode === "capitalization"
            ? "Request an alternate sequence if this conversion is not the highest-leverage path. Capacity and constraints stay in force."
            : "Request an alternative if this sequence is not correct or not necessary. The next route is still built from the same vision, capacity, and constraints."}
        </p>
        {mode === "foundation" ? (
          <Field
            label="Why this sequence is not correct or not necessary"
            value={reason}
            onChange={setReason}
            placeholder="Too much administration before the first artifact. The constraint step is already obvious."
            rows={4}
          />
        ) : null}
        <Button tone="neutral" onClick={() => onAlternative(reason.trim())} disabled={!canAlternative}>
          {busy
            ? "Revising"
            : mode === "capitalization"
              ? "Request alternate sequence"
              : "Request alternative route"}
        </Button>
      </Panel>

      <Panel>
        <p className="kicker">
          You are about to lock this sequence
        </p>
        <p className="copy">
          By confirming, you agree to treat the following actions as the committed path and to
          record evidence of completion. This lock is permanent for this{" "}
          {mode === "capitalization" ? "capitalization sequence" : "plan"}.
        </p>
        {reviewPlan.actions
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((action, index) => (
            <p key={action.id} className="quiet">
              {index + 1}. {action.title}
            </p>
          ))}
        <CheckRow
          label="I have reviewed the full sequence."
          checked={reviewed}
          onToggle={() => setReviewed((value) => !value)}
        />
        <CheckRow
          label="I will treat these actions as my committed path."
          checked={path}
          onToggle={() => setPath((value) => !value)}
        />
        <CheckRow
          label="I will record evidence of completion."
          checked={record}
          onToggle={() => setRecord((value) => !value)}
        />
        {report.severity === "misaligned" ? (
          <CheckRow
            label="I understand this lock contradicts a failed constraint stress test."
            checked={overrideMisaligned}
            onToggle={() => setOverrideMisaligned((value) => !value)}
          />
        ) : null}
        <p className="lede">
          {report.severity === "misaligned"
            ? "Lock is blocked until the failed test is overridden. The adjusted route is the correct next step."
            : "Confirm only if you are prepared to execute."}
        </p>
        <Button
          onClick={() =>
            onLock({
              acknowledged: risksAccepted,
              acceptMisalignment: report.severity === "misaligned" && overrideMisaligned,
            })
          }
          disabled={!canLock}
          tone={report.severity === "misaligned" ? "neutral" : "accent"}
        >
          {busy
            ? "Entering commitment"
            : report.severity === "misaligned"
              ? "Lock despite misalignment"
              : "Confirm — I am prepared to execute"}
        </Button>
      </Panel>
    </>
  );
}
