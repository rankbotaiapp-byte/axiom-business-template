import { CONNECTION_STAGE_LABEL } from "@/lib/connections";
import { evidencePreview, evidenceWeight } from "@/lib/evidence";
import {
  evidenceForTurningPoint,
  institutionalPhaseName,
  shortEvidenceResult,
  supportingEvidenceLine,
  thresholdDate,
  THRESHOLD_CAPITALIZATION,
  THRESHOLD_DECLARATION,
  THRESHOLD_HEADING,
  turningPointFor,
} from "@/lib/turning-points";
import type { AppState, EvidenceRecord, Plan, PlanAction, Vision } from "@/types";

import {
  currentRecordedState,
  executionPeriod,
  executionRecordId,
  executionStatus,
  finalRecordedState,
  formatTimestamp,
  slug,
  type ExecutionStatus,
} from "./execution-record";

export type ExportDetail = "full" | "summary";
export type ExportScope = "vision" | "portfolio";

export type RecordedActionLine = {
  order: number;
  phase: string;
  title: string;
  status: string;
  date: string | null;
  result: string | null;
  reference: string | null;
};

export type RecordedPhase = {
  name: string;
  actions: RecordedActionLine[];
};

export type RecordedThreshold = {
  date: string;
  heading: string;
  declaration: string;
  capitalization: string;
  supporting: string[];
};

export type RecordedConnection = {
  name: string;
  role: string;
  stage: string;
  channel: string;
  context: string;
};

export type RecordedOutcome = {
  kind: "current" | "final";
  heading: string;
  statement: string;
  keyResults: string[];
};

export type VerificationSummary = {
  title: string;
  status: string;
  source: string;
  kind: string;
  note: string;
  recordedAt: string;
  visibility: string;
};

export type VisionExecutionModel = {
  recordId: string;
  title: string;
  status: ExecutionStatus;
  institutionalPhase: string;
  period: string;
  realization: number;
  exportGenerated: string;
  description: string;
  context: {
    hours: number;
    energy: string;
    nonNegotiables: string[];
    constraints: string[];
    competing: string[];
  };
  phases: RecordedPhase[];
  thresholds: RecordedThreshold[];
  verification: VerificationSummary | null;
  connections: RecordedConnection[];
  outcome: RecordedOutcome;
};

export type ExecutionExport = {
  scope: ExportScope;
  detail: ExportDetail;
  generatedAt: string;
  exportGenerated: string;
  period: string;
  recordId: string;
  filename: string;
  visions: VisionExecutionModel[];
};

function statusLabel(status: PlanAction["status"]): string {
  if (status === "in_progress") return "in progress";
  if (status === "skipped") return "released after threshold";
  return status;
}

function latestEvidence(records: EvidenceRecord[], actionId: string): EvidenceRecord | undefined {
  return records
    .filter((item) => item.actionId === actionId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
}

function actionLine(
  action: PlanAction,
  records: EvidenceRecord[],
  detail: ExportDetail
): RecordedActionLine {
  const evidence = latestEvidence(records, action.id);
  const raw = evidence ? evidence.result.trim() || evidencePreview(evidence) : null;
  return {
    order: action.order,
    phase: action.phase,
    title: action.title,
    status: statusLabel(action.status),
    date: evidence ? thresholdDate(evidence.timestamp) : null,
    result: raw ? (detail === "summary" ? shortEvidenceResult(raw) : raw) : null,
    reference: evidence?.reference ?? null,
  };
}

function keyResults(records: EvidenceRecord[]): string[] {
  return [...records]
    .sort((a, b) => {
      const weight = evidenceWeight(b.grade) - evidenceWeight(a.grade);
      if (weight !== 0) return weight;
      return b.timestamp.localeCompare(a.timestamp);
    })
    .map((record) => shortEvidenceResult(record.result.trim() || evidencePreview(record)))
    .filter((result, index, list) => result.length > 0 && list.indexOf(result) === index)
    .slice(0, 3);
}

function outcomeFor(
  state: AppState,
  vision: Vision,
  plan: Plan | undefined,
  generatedAt: Date
): RecordedOutcome {
  const point = turningPointFor(state, vision.id);
  const closed = vision.status === "completed" || vision.status === "archived";
  const block = closed
    ? finalRecordedState(state, vision, plan, point)
    : currentRecordedState(state, vision, plan, point, generatedAt);
  const lines = (block ?? "No recorded state.").split("\n").filter((line) => line.length > 0);
  const heading = closed ? "Final recorded state" : "Current recorded state";
  const results = keyResults(state.evidence.filter((item) => item.visionId === vision.id));
  return {
    kind: closed ? "final" : "current",
    heading,
    statement: lines.join(" "),
    keyResults: results,
  };
}

export function buildVisionModel(
  state: AppState,
  visionId: string,
  detail: ExportDetail,
  generatedAt = new Date()
): VisionExecutionModel | null {
  const vision = state.visions.find((item) => item.id === visionId);
  if (!vision) return null;

  const plan = state.plans.find((item) => item.visionId === visionId);
  const records = state.evidence
    .filter((item) => item.visionId === visionId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const snap = vision.contextSnapshot;
  const point = turningPointFor(state, visionId);
  const actions = [...(plan?.actions ?? [])].sort((a, b) => a.order - b.order);
  const phaseNames = plan?.phases.length
    ? plan.phases
    : [...new Set(actions.map((action) => action.phase))];

  const phases: RecordedPhase[] = phaseNames
    .map((name) => {
      const lines = actions
        .filter((action) => action.phase === name)
        .map((action) => actionLine(action, records, detail))
        .filter((line) => (detail === "summary" ? Boolean(line.reference) : true));
      return { name, actions: lines };
    })
    .filter((phase) => phase.actions.length > 0);

  const thresholds: RecordedThreshold[] = point
    ? [
        {
          date: thresholdDate(point.createdAt),
          heading: THRESHOLD_HEADING,
          declaration: point.declaration || THRESHOLD_DECLARATION,
          capitalization: THRESHOLD_CAPITALIZATION,
          supporting: evidenceForTurningPoint(records, point).map((record) => {
            const action = actions.find((item) => item.id === record.actionId);
            const result = record.result.trim() || evidencePreview(record);
            return supportingEvidenceLine(action?.title ?? record.reference ?? "Recorded evidence", record.timestamp, result);
          }),
        },
      ]
    : [];

  const verification = state.verifications.find((item) => item.visionId === visionId) ?? null;

  const connections = state.connections
    .filter((item) => item.visionId === visionId)
    .map((connection) => {
      const role = state.roles.find((item) => item.id === connection.roleId);
      return {
        name: connection.name,
        role: role?.title ?? "Nominated connection",
        stage: CONNECTION_STAGE_LABEL[connection.stage],
        channel: connection.channel,
        context: connection.context,
      };
    });

  return {
    recordId: executionRecordId(vision),
    title: vision.title,
    status: executionStatus(vision.status),
    institutionalPhase: institutionalPhaseName(plan, vision, point),
    period: executionPeriod(vision),
    realization: Math.round(vision.livingDensity),
    exportGenerated: formatTimestamp(generatedAt.toISOString()),
    description: vision.description,
    context: {
      hours: snap.capacity.availableHoursPerWeek,
      energy: snap.capacity.energyLevel,
      nonNegotiables: snap.responsibilities.filter((item) => item.isNonNegotiable).map((item) => item.title),
      constraints: snap.constraints ?? [],
      competing: [...snap.competingGoals].sort((a, b) => a.priority - b.priority).map((item) => item.title),
    },
    phases,
    thresholds,
    verification: verification
      ? {
          title: verification.title,
          status: verification.kind === "third_party" ? "Externally verified" : "Internal record",
          source: verification.sourceLabel,
          kind: verification.kind,
          note: verification.note,
          recordedAt: thresholdDate(verification.confirmedAt),
          visibility: verification.visibility,
        }
      : null,
    connections: detail === "full" ? connections : [],
    outcome: outcomeFor(state, vision, plan, generatedAt),
  };
}

function portfolioPeriod(visions: Vision[]): string {
  if (visions.length === 0) return "None recorded";
  const starts = visions.map((item) => item.createdAt).sort();
  const open = visions.some((item) => item.status !== "completed" && item.status !== "archived");
  const ends = visions
    .filter((item) => item.status === "completed" || item.status === "archived")
    .map((item) => item.updatedAt)
    .sort();
  const start = thresholdDate(starts[0]);
  const end = open || ends.length === 0 ? "Present" : thresholdDate(ends[ends.length - 1]);
  return `${start} – ${end}`;
}

export function portfolioRecordId(visions: Vision[]): string {
  const compact = visions
    .map((item) => item.id.replace(/-/g, ""))
    .join("")
    .slice(0, 12)
    .toUpperCase();
  return `ZR-LP-${compact || "EMPTY"}`;
}

export function buildExecutionExport(
  state: AppState,
  input: { visionId?: string; detail: ExportDetail; generatedAt?: Date }
): ExecutionExport | null {
  const generatedAt = input.generatedAt ?? new Date();
  const visions = input.visionId
    ? state.visions.filter((item) => item.id === input.visionId)
    : [...state.visions].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  if (visions.length === 0) return null;

  const models = visions
    .map((vision) => buildVisionModel(state, vision.id, input.detail, generatedAt))
    .filter((item): item is VisionExecutionModel => Boolean(item));
  if (models.length === 0) return null;

  const scope: ExportScope = input.visionId ? "vision" : "portfolio";
  const detailTag = input.detail === "summary" ? "summary" : "full";
  const filename =
    scope === "vision"
      ? `z-point-execution-record-${slug(models[0].title)}-${detailTag}.pdf`
      : `z-point-life-portfolio-${detailTag}.pdf`;

  return {
    scope,
    detail: input.detail,
    generatedAt: generatedAt.toISOString(),
    exportGenerated: formatTimestamp(generatedAt.toISOString()),
    period: input.visionId ? models[0].period : portfolioPeriod(visions),
    recordId: input.visionId ? models[0].recordId : portfolioRecordId(visions),
    filename,
    visions: models,
  };
}
