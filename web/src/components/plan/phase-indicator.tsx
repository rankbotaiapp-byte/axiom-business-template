import { Panel } from "@/components/ui";
import {
  INSTITUTIONAL_PHASE_COPY,
  institutionalPhaseName,
  type InstitutionalPhase,
} from "@/lib/turning-points";
import type { Plan, PossibilityTurningPoint, Vision } from "@/types";

export function PhaseIndicator({
  plan,
  vision,
  turningPoint,
}: {
  plan: Plan;
  vision?: Vision;
  turningPoint?: PossibilityTurningPoint;
}) {
  const phase = institutionalPhaseName(plan, vision, turningPoint);
  const notice = phaseNotice(phase, plan);

  return (
    <Panel>
      <p className="kicker kicker-accent">
        Institutional phase · {phase}
      </p>
      <p className="copy">{INSTITUTIONAL_PHASE_COPY[phase]}</p>
      {notice ? <p className="quiet">{notice}</p> : null}
    </Panel>
  );
}

function phaseNotice(phase: InstitutionalPhase, plan: Plan): string | null {
  if (phase === "Initiation") {
    return "Designation notice: the record is being formed and no commitment has yet been locked.";
  }
  if (phase === "Committed Execution") {
    return "Designation notice: the record remains in committed execution until the threshold is formally declared.";
  }
  if (phase === "Threshold Pending") {
    return "Designation notice: the threshold is emerging but remains provisional while evidence is still consolidating.";
  }
  if (phase === "Demonstrably Reachable") {
    return "Designation notice: the threshold has crossed and the outcome is now treated as demonstrably reachable.";
  }
  if (phase === "Capitalization") {
    return plan.capitalizationLocked
      ? "Designation notice: the proven method is locked as the primary path for capitalization."
      : "Designation notice: the capitalization sequence is active and is being reviewed before locking.";
  }
  if (phase === "Realized") {
    return "Designation notice: the vision has been realized and the record is closed.";
  }
  return null;
}
