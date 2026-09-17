import { countsTowardThreshold, evidencePreview, evidenceWeight } from "@/lib/evidence";
import {
  CAPITALIZATION_PHASE,
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
import type { AppState, CompetingGoal, EvidenceRecord, Plan, PossibilityTurningPoint, Responsibility, Vision, VisionStatus } from "@/types";

export type ExecutionStatus = "Active" | "Completed" | "Archived";

export type ExecutionRecordDoc = {
  filename: string;
  text: string;
};

export function executionStatus(status: VisionStatus): ExecutionStatus {
  if (status === "completed") return "Completed";
  if (status === "archived") return "Archived";
  return "Active";
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

export function slug(title: string): string {
  const trimmed = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return trimmed || "vision";
}

function listOrNone(items: string[]): string {
  return items.length ? items.join("; ") : "None recorded";
}

function nonNegotiableTitles(responsibilities: Responsibility[]): string[] {
  return responsibilities.filter((item) => item.isNonNegotiable).map((item) => item.title);
}

function competingTitles(goals: CompetingGoal[]): string[] {
  return [...goals].sort((a, b) => a.priority - b.priority).map((item) => item.title);
}

export function initiationContext(vision: Vision): string {
  const snap = vision.contextSnapshot;
  const hours = snap.capacity.availableHoursPerWeek;
  const energy = snap.capacity.energyLevel;
  return [
    "The stated objective for this record was:",
    "",
    `“${vision.description}”`,
    "",
    "Context at initiation:",
    `• Available capacity: ${hours} hours per week, ${energy} energy`,
    `• Non-negotiable responsibilities: ${listOrNone(nonNegotiableTitles(snap.responsibilities))}`,
    `• Key constraints: ${listOrNone(snap.constraints ?? [])}`,
    `• Competing priorities at the time: ${listOrNone(competingTitles(snap.competingGoals))}`,
  ].join("\n");
}

function isoDate(iso: string): string {
  return thresholdDate(iso);
}

export function completedWorkEntry(state: AppState, visionId: string, plan: Plan | undefined): string {
  const actions = plan?.actions ?? state.plans.flatMap((item) => item.actions);
  const evidence = state.evidence
    .filter((item) => item.visionId === visionId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  if (!evidence.length) return "No completed work on record.";

  return evidence
    .map((record) => {
      const action = actions.find((item) => item.id === record.actionId);
      const title = action?.title ?? "Recorded evidence";
      const result = record.result.trim() || evidencePreview(record);
      return [`${isoDate(record.timestamp)} — ${title}`, `Result: ${result}`, `Evidence reference: ${record.reference}`].join(
        "\n"
      );
    })
    .join("\n\n");
}

export function thresholdReachedEntry(
  state: AppState,
  plan: Plan | undefined,
  point: PossibilityTurningPoint | undefined
): string | null {
  if (!point) return null;
  const actions = plan?.actions ?? state.plans.flatMap((item) => item.actions);
  const supporting = evidenceForTurningPoint(state.evidence, point).map((record) => {
    const action = actions.find((item) => item.id === record.actionId);
    const result = record.result.trim() || evidencePreview(record);
    return `• ${supportingEvidenceLine(action?.title ?? "Recorded evidence", record.timestamp, result)}`;
  });

  return [
    `${THRESHOLD_HEADING} — ${thresholdDate(point.createdAt)}`,
    "",
    THRESHOLD_DECLARATION,
    "",
    "Supporting evidence:",
    ...(supporting.length ? supporting : ["• None recorded."]),
    "",
    THRESHOLD_CAPITALIZATION,
  ].join("\n");
}

function visionEvidence(state: AppState, visionId: string): EvidenceRecord[] {
  return state.evidence
    .filter((item) => item.visionId === visionId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function keyResults(evidence: EvidenceRecord[]): string[] {
  return [...evidence]
    .sort((a, b) => {
      const weight = evidenceWeight(b.grade) - evidenceWeight(a.grade);
      if (weight !== 0) return weight;
      return b.timestamp.localeCompare(a.timestamp);
    })
    .map((record) => shortEvidenceResult(record.result.trim() || evidencePreview(record)))
    .filter((result, index, list) => result.length > 0 && list.indexOf(result) === index)
    .slice(0, 3);
}

export function finalRecordedState(
  state: AppState,
  vision: Vision,
  plan: Plan | undefined,
  point: PossibilityTurningPoint | undefined
): string | null {
  if (vision.status !== "completed" && vision.status !== "archived") return null;

  const evidence = visionEvidence(state, vision.id);
  const completed = plan?.actions.filter((action) => action.status === "completed") ?? [];
  const total = plan?.actions.filter((action) => action.status !== "skipped").length ?? 0;
  const proven = evidence.filter(countsTowardThreshold);
  const results = keyResults(proven.length ? proven : evidence);

  let achieved: string;
  if (total > 0 && completed.length === total) {
    achieved = `The planned sequence is complete. ${completed.length} actions have recorded evidence.`;
  } else if (completed.length > 0 && total > 0) {
    achieved = `${completed.length} of ${total} planned actions have recorded evidence.`;
  } else {
    achieved = "The vision is closed. No completed actions are on record.";
  }
  if (point) {
    achieved += ` A turning point was declared on ${isoDate(point.createdAt)}.`;
  }
  if (plan?.actions.some((action) => action.phase === CAPITALIZATION_PHASE)) {
    const cap = plan.actions.filter((action) => action.phase === CAPITALIZATION_PHASE);
    const capDone = cap.filter((action) => action.status === "completed").length;
    achieved += ` Capitalization: ${capDone} of ${cap.length} actions recorded.`;
  }

  return [
    `Final recorded state of the vision as of ${isoDate(vision.updatedAt)}:`,
    "",
    achieved,
    "",
    "Key results:",
    ...(results.length ? results.map((result) => `• ${result}`) : ["• None recorded."]),
    "",
    `Realization level at completion: ${Math.round(vision.livingDensity)}%`,
  ].join("\n");
}

export function currentRecordedState(
  state: AppState,
  vision: Vision,
  plan: Plan | undefined,
  point: PossibilityTurningPoint | undefined,
  asOf: Date
): string | null {
  if (vision.status === "completed" || vision.status === "archived") return null;

  const completed = plan?.actions.filter((action) => action.status === "completed") ?? [];
  const pending = (plan?.actions ?? [])
    .filter((action) => action.status !== "completed" && action.status !== "skipped")
    .sort((a, b) => a.order - b.order);
  const total = plan?.actions.filter((action) => action.status !== "skipped").length ?? 0;

  let progress: string;
  if (total === 0) {
    progress = "No sequence is on record.";
  } else if (completed.length === 0) {
    progress = `0 of ${total} planned actions have recorded evidence.`;
  } else {
    progress = `${completed.length} of ${total} planned actions have recorded evidence.`;
  }
  if (pending[0]) {
    progress += ` Next required: ${pending[0].title}.`;
  }
  if (point) {
    progress += ` A turning point was declared on ${isoDate(point.createdAt)}.`;
  }
  if (plan?.actions.some((action) => action.phase === CAPITALIZATION_PHASE)) {
    const cap = plan.actions.filter((action) => action.phase === CAPITALIZATION_PHASE);
    const capDone = cap.filter((action) => action.status === "completed").length;
    progress += plan.capitalizationLocked
      ? ` Capitalization is locked. ${capDone} of ${cap.length} actions recorded.`
      : " Capitalization is generated and not yet locked.";
  }

  return [
    `Current recorded state of the vision as of ${isoDate(asOf.toISOString())}:`,
    "",
    progress,
    "",
    "The sequence remains active. Further actions are pending.",
  ].join("\n");
}

export function executionRecordId(vision: Vision): string {
  const compact = vision.id.replace(/-/g, "").toUpperCase();
  return `ZR-${compact.slice(0, 12)}`;
}

export function recordAttestation(vision: Vision, generatedAt: Date): string {
  return [
    "This document is a permanent execution record generated from Z Point.",
    "All actions and results listed above were logged with supporting evidence at the time of completion.",
    `Export timestamp: ${formatTimestamp(generatedAt.toISOString())}`,
    `Record ID: ${executionRecordId(vision)}`,
  ].join("\n");
}

export function executionPeriod(vision: Vision): string {
  const start = formatDate(vision.createdAt);
  const closed = vision.status === "completed" || vision.status === "archived";
  const end = closed ? formatDate(vision.updatedAt) : "Present";
  return `${start} – ${end}`;
}

export function buildExecutionRecord(
  state: AppState,
  visionId: string,
  generatedAt = new Date()
): ExecutionRecordDoc | null {
  const vision = state.visions.find((item) => item.id === visionId);
  if (!vision) return null;

  const plan = state.plans.find((item) => item.visionId === visionId);
  const threshold = turningPointFor(state, visionId);

  const phase = institutionalPhaseName(plan, vision, threshold);
  const header = [
    "Z POINT – EXECUTION RECORD",
    "",
    `Vision: ${vision.title}`,
    `Status: ${executionStatus(vision.status)}`,
    `Institutional Phase: ${phase}`,
    `Period: ${executionPeriod(vision)}`,
    `Realization Level: ${Math.round(vision.livingDensity)}%`,
    `Export Generated: ${formatTimestamp(generatedAt.toISOString())}`,
  ].join("\n");

  const sequence = plan?.actions.length
    ? plan.actions
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((action) => `${action.order}. ${action.title} — ${action.status.replace("_", " ")}`)
        .join("\n")
    : "No sequence on record.";

  return {
    filename: `z-point-execution-record-${slug(vision.title)}.txt`,
    text:
      [
        header,
        initiationContext(vision),
        completedWorkEntry(state, visionId, plan),
        thresholdReachedEntry(state, plan, threshold),
        `SEQUENCE\n${sequence}`,
        currentRecordedState(state, vision, plan, threshold, generatedAt),
        finalRecordedState(state, vision, plan, threshold),
        recordAttestation(vision, generatedAt),
      ]
        .filter((section): section is string => Boolean(section))
        .join("\n\n") + "\n",
  };
}

export function downloadExecutionRecord(doc: ExecutionRecordDoc): void {
  const blob = new Blob([doc.text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = doc.filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
