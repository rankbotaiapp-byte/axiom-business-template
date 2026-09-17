"use client";

import { EmptyState, Panel, Shell } from "@/components/ui";
import { ExportExecutionRecord } from "@/components/portfolio";
import { TurningPointDeclaration } from "@/components/turning-points";
import { LivingVision } from "@/components/vision";
import { evidenceGradeLabel, evidencePreview, verificationStatusLabel } from "@/lib/evidence";
import { evidenceForTurningPoint, turningPointFor } from "@/lib/turning-points";
import { useApp } from "@/stores/provider";

export function LivingVisionPage({ visionId }: { visionId: string }) {
  const { state } = useApp();
  const vision = state.visions.find((item) => item.id === visionId);
  const threshold = vision ? turningPointFor(state, vision.id) : undefined;
  const records = state.evidence.filter((item) => item.visionId === visionId);
  const actions = state.plans.find((item) => item.visionId === visionId)?.actions ?? [];

  if (!vision) {
    return (
      <Shell overline="Living Vision" title="No vision">
        <EmptyState title="Missing record" body="This identifier is not in the record." />
      </Shell>
    );
  }

  return (
    <Shell overline="Living Vision" title={vision.title}>
      <p className="lede">
        The picture densifies only as evidence is logged. There is no other progress measure.
      </p>
      <LivingVision vision={vision} threshold={threshold} showLink={false} />
      {threshold ? (
        <TurningPointDeclaration
          point={threshold}
          evidence={evidenceForTurningPoint(records, threshold)}
          actions={actions}
        />
      ) : null}
      <Panel>
        <p className="kicker">Outcome verification</p>
        <p className="copy">
          {verificationStatusLabel(vision.verificationStatus)}
          {vision.verificationSummary ? ` · ${vision.verificationSummary}` : ""}
        </p>
      </Panel>
      <Panel>
        <p className="kicker">
          Evidence on this vision
        </p>
        {records.length === 0 ? (
          <p className="copy">
            No evidence is yet on record for this vision. Completion is only acknowledged once a concrete result is logged.
          </p>
        ) : (
          records.map((record) => (
            <p key={record.id} className="copy">
              {record.reference} · {new Date(record.timestamp).toLocaleString()} · {record.payload.type} ·{" "}
              {evidenceGradeLabel(record.grade)} · {evidencePreview(record)}
            </p>
          ))
        )}
      </Panel>
      <ExportExecutionRecord visionId={vision.id} />
    </Shell>
  );
}
