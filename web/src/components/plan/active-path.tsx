import { StrategicConnectionPanel } from "@/components/connections";
import { Panel } from "@/components/ui";
import { EvidenceLog } from "@/components/evidence";
import { LivingVision } from "@/components/vision";
import { TurningPointDeclaration } from "@/components/turning-points";
import type { EvidenceDraft } from "@/lib/evidence";
import { firstRequiredActions, isPrimarySequenceComplete } from "@/lib/planning";
import { evidenceForTurningPoint } from "@/lib/turning-points";
import type { EvidenceRecord, Plan, PossibilityTurningPoint, Vision } from "@/types";

import { PhaseIndicator } from "./phase-indicator";
import { PlanSequence } from "./sequence";

export function ActivePath({
  plan,
  vision,
  turningPoint,
  evidence,
  recording,
  onRecord,
}: {
  plan: Plan;
  vision: Vision;
  turningPoint: PossibilityTurningPoint | undefined;
  evidence: EvidenceRecord[];
  recording: boolean;
  onRecord: (actionId: string, draft: EvidenceDraft) => void;
}) {
  const required = firstRequiredActions(plan);
  const complete = isPrimarySequenceComplete(plan) || vision.status === "completed";
  const crossed = turningPoint
    ? evidenceForTurningPoint(evidence, turningPoint)
    : [];

  return (
    <>
      <p className="lede">
        {complete
          ? "The primary path is complete. Released foundation steps remain on the record and were not executed after the threshold."
          : `Locked ${plan.lockedAt ? `at ${new Date(plan.lockedAt).toLocaleString()}` : ""}. This is the primary path. An action is complete only when evidence is recorded.`}
      </p>

      <LivingVision vision={vision} threshold={turningPoint} />

      {turningPoint ? (
        <TurningPointDeclaration point={turningPoint} evidence={crossed} actions={plan.actions} />
      ) : null}

      <PhaseIndicator plan={plan} vision={vision} turningPoint={turningPoint} />

      <StrategicConnectionPanel planId={plan.id} visionId={vision.id} locked />

      <Panel>
        <p className="kicker">
          Required now
        </p>
        {required.length === 0 ? (
          <p className="copy">
            {isPrimarySequenceComplete(plan)
              ? "No open action. The primary path is complete."
              : "No open action on the primary path."}
          </p>
        ) : (
          required.map((action) => (
            <div key={action.id} className="flex flex-col gap-2">
              <p className="title-block">{action.title}</p>
              <p className="copy">{action.description}</p>
              <p className="quiet">
                {action.phase} · {action.estimatedEffort} effort · {action.status.replace("_", " ")}
              </p>
            </div>
          ))
        )}
      </Panel>

      {required[0] ? (
        <EvidenceLog
          key={required[0].id}
          action={required[0]}
          busy={recording}
          onRecord={(draft) => onRecord(required[0].id, draft)}
        />
      ) : null}

      <PlanSequence plan={plan} />
    </>
  );
}
