import { Panel } from "@/components/ui";
import { evidencePreview } from "@/lib/evidence";
import {
  supportingEvidenceLine,
  thresholdDate,
  THRESHOLD_CAPITALIZATION,
  THRESHOLD_DECLARATION,
  THRESHOLD_HEADING,
} from "@/lib/turning-points";
import type { EvidenceRecord, PlanAction, PossibilityTurningPoint } from "@/types";

export function TurningPointDeclaration({
  point,
  evidence,
  actions = [],
}: {
  point: PossibilityTurningPoint;
  evidence: EvidenceRecord[];
  actions?: PlanAction[];
}) {
  return (
    <Panel>
      <p className="kicker kicker-accent">
        {THRESHOLD_HEADING} — {thresholdDate(point.createdAt)}
      </p>
      <p className="copy">{THRESHOLD_DECLARATION}</p>
      {evidence.length ? (
        <div className="flex flex-col gap-2">
          <p className="kicker">Supporting evidence</p>
          {evidence.map((record) => {
            const action = actions.find((item) => item.id === record.actionId);
            const result = record.result.trim() || evidencePreview(record);
            return (
              <p key={record.id} className="copy">
                {supportingEvidenceLine(action?.title ?? (record.reference || "Recorded evidence"), record.timestamp, result)}
              </p>
            );
          })}
        </div>
      ) : null}
      <p className="copy">{THRESHOLD_CAPITALIZATION}</p>
      <p className="quiet">Permanent in the Life Portfolio.</p>
    </Panel>
  );
}
