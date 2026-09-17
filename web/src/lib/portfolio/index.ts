import { CONNECTION_STAGE_LABEL } from "@/lib/connections";
import { evidencePreview } from "@/lib/evidence";
import { THRESHOLD_DECLARATION, THRESHOLD_HEADING } from "@/lib/turning-points";
import type { AppState, LifePortfolioEntry, LifePortfolioType } from "@/types";

export type ResolvedPortfolioEntry = LifePortfolioEntry & {
  heading: string;
  body: string;
};

export function resolvePortfolioEntry(
  state: AppState,
  entry: LifePortfolioEntry
): ResolvedPortfolioEntry {
  if (entry.type === "vision") {
    const vision = state.visions.find((item) => item.id === entry.referenceId);
    return {
      ...entry,
      heading: vision?.title ?? "Vision",
      body: vision?.description ?? "Vision recorded.",
    };
  }
  if (entry.type === "action") {
    const action = state.plans
      .flatMap((plan) => plan.actions)
      .find((item) => item.id === entry.referenceId);
    return {
      ...entry,
      heading: action?.title ?? "Action",
      body: action?.description ?? "Action completed.",
    };
  }
  if (entry.type === "connection") {
    const connection = state.connections.find((item) => item.id === entry.referenceId);
    const role = connection ? state.roles.find((item) => item.id === connection.roleId) : undefined;
    return {
      ...entry,
      heading: connection ? `Strategic asset · ${connection.name}` : "Strategic connection",
      body: connection
        ? `${role?.title ?? "Role"} · ${CONNECTION_STAGE_LABEL[connection.stage]}. ${connection.context}`
        : "A nominated connection is on record.",
    };
  }
  if (entry.type === "evidence") {
    const record = state.evidence.find((item) => item.id === entry.referenceId);
    return {
      ...entry,
      heading: record ? `Evidence · ${record.reference || record.payload.type}` : "Evidence",
      body: record ? evidencePreview(record) : "Evidence recorded.",
    };
  }
  if (entry.type === "verification") {
    const verification = state.verifications.find((item) => item.id === entry.referenceId);
    return {
      ...entry,
      heading: verification ? `Verification · ${verification.title}` : "Verification",
      body: verification
        ? `${verification.sourceLabel}${verification.sourceUrl ? ` · ${verification.sourceUrl}` : ""}${verification.note ? ` · ${verification.note}` : ""}`
        : "Outcome verification on record.",
    };
  }
  const point = state.turningPoints.find((item) => item.id === entry.referenceId);
  return {
    ...entry,
    heading: THRESHOLD_HEADING,
    body: point?.declaration ?? THRESHOLD_DECLARATION,
  };
}

export function portfolioByVision(state: AppState): {
  visionId: string;
  title: string;
  entries: ResolvedPortfolioEntry[];
}[] {
  const grouped = new Map<string, ResolvedPortfolioEntry[]>();
  const chronological = [...state.portfolio].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  for (const entry of chronological) {
    const resolved = resolvePortfolioEntry(state, entry);
    const list = grouped.get(entry.visionId) ?? [];
    list.push(resolved);
    grouped.set(entry.visionId, list);
  }
  return [...grouped.entries()].map(([visionId, entries]) => ({
    visionId,
    title: state.visions.find((item) => item.id === visionId)?.title ?? visionId,
    entries,
  }));
}

export { buildExecutionRecord, downloadExecutionRecord, executionPeriod, executionStatus } from "./execution-record";
export type { ExecutionRecordDoc, ExecutionStatus } from "./execution-record";
export { buildExecutionExport, buildVisionModel } from "./record-model";
export type { ExecutionExport, ExportDetail, ExportScope, VisionExecutionModel } from "./record-model";
export { downloadExecutionPdf } from "./pdf-download";

export const PORTFOLIO_ORDER: LifePortfolioType[] = [
  "vision",
  "action",
  "evidence",
  "verification",
  "turning_point",
  "connection",
];
