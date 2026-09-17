import { countsTowardThreshold } from "@/lib/evidence";
import type { AppState, EvidenceRecord, Plan, PossibilityTurningPoint } from "@/types";

export const TURNING_POINT_THRESHOLD = {
  minProvenActions: 2,
  minEvidenceRecords: 2,
} as const;

export const THRESHOLD_HEADING = "Threshold Reached";

export const THRESHOLD_DECLARATION =
  "The accumulated evidence indicated that the outcome had moved from theoretical to demonstrably reachable.";

export const THRESHOLD_CAPITALIZATION =
  "Following this threshold, the plan shifted into the capitalization phase.";

export type ThresholdReading = {
  visionId: string;
  alreadyDeclared: boolean;
  provenActions: number;
  evidenceCount: number;
  triggeringEvidenceIds: string[];
  crossed: boolean;
};

export function visionEvidence(state: AppState, visionId: string): EvidenceRecord[] {
  return state.evidence
    .filter((item) => item.visionId === visionId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function provenActionIds(plan: Plan, evidence: EvidenceRecord[]): string[] {
  const proven = new Set(evidence.filter(countsTowardThreshold).map((item) => item.actionId));
  return plan.actions
    .filter((action) => action.status === "completed" && proven.has(action.id))
    .sort((a, b) => a.order - b.order)
    .map((action) => action.id);
}

export function readThreshold(state: AppState, visionId: string, plan: Plan): ThresholdReading {
  const alreadyDeclared = state.turningPoints.some((item) => item.visionId === visionId);
  const evidence = visionEvidence(state, visionId);
  const proven = provenActionIds(plan, evidence);
  const triggering = evidence.filter(
    (item) => proven.includes(item.actionId) && countsTowardThreshold(item)
  );

  return {
    visionId,
    alreadyDeclared,
    provenActions: proven.length,
    evidenceCount: triggering.length,
    triggeringEvidenceIds: triggering.map((item) => item.id),
    crossed:
      !alreadyDeclared &&
      proven.length >= TURNING_POINT_THRESHOLD.minProvenActions &&
      triggering.length >= TURNING_POINT_THRESHOLD.minEvidenceRecords,
  };
}

export function shouldDeclareTurningPoint(state: AppState, visionId: string, plan: Plan): boolean {
  return readThreshold(state, visionId, plan).crossed;
}

export function createTurningPoint(
  reading: ThresholdReading,
  input: { id: string; createdAt: string }
): PossibilityTurningPoint {
  return {
    id: input.id,
    visionId: reading.visionId,
    triggeringEvidenceIds: reading.triggeringEvidenceIds,
    declaration: THRESHOLD_DECLARATION,
    createdAt: input.createdAt,
  };
}

export function evidenceForTurningPoint(
  evidence: EvidenceRecord[],
  point: PossibilityTurningPoint
): EvidenceRecord[] {
  const ids = new Set(point.triggeringEvidenceIds);
  return evidence
    .filter((item) => ids.has(item.id))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function thresholdDate(iso: string): string {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function shortEvidenceResult(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  const stop = trimmed.search(/[.!?](\s|$)/);
  const sentence = stop >= 0 ? trimmed.slice(0, stop + 1) : trimmed;
  return sentence.length > 160 ? sentence.slice(0, 160).trimEnd() : sentence;
}

export function supportingEvidenceLine(actionTitle: string, recordedAt: string, result: string): string {
  return `${actionTitle} — ${thresholdDate(recordedAt)} — ${shortEvidenceResult(result)}`;
}
