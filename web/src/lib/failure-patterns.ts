import { newId, nowIso } from "@/lib/utils/ids";
import type {
  FailurePatternActionKind,
  FailurePatternContext,
  FailurePatternRecord,
  FailurePatternType,
  FailurePatternWarning,
  Plan,
  PlanningInput,
} from "@/types";

export const FAILURE_PATTERN_KIND_COPY: Record<FailurePatternActionKind, string> = {
  administrative: "administrative work",
  documentation: "documentation and filing",
  handoff: "handoff and coordination",
  delivery: "delivery and execution",
  research: "research and preparation",
  technical: "technical execution",
  review: "review and approval",
  general: "general action work",
};

export const FAILURE_PATTERN_CONTEXT_COPY: Record<FailurePatternContext, string> = {
  high_load: "high load context",
  low_capacity: "low-capacity context",
  competing_priorities: "competing priorities",
  external_dependency: "external dependency",
  repeated_review: "repeated review cycle",
  new_context: "new context",
  general: "general operating context",
};

function inferActionKind(plan: Plan): FailurePatternActionKind {
  const kinds = plan.actions.map((action) => action.phase.toLowerCase());
  if (kinds.some((value) => value.includes("review") || value.includes("approval"))) return "review";
  if (kinds.some((value) => value.includes("handoff") || value.includes("contact") || value.includes("coord"))) return "handoff";
  if (kinds.some((value) => value.includes("document") || value.includes("file") || value.includes("record"))) return "documentation";
  if (kinds.some((value) => value.includes("build") || value.includes("technical") || value.includes("setup"))) return "technical";
  if (kinds.some((value) => value.includes("research") || value.includes("design") || value.includes("analysis"))) return "research";
  if (kinds.some((value) => value.includes("deliver") || value.includes("launch") || value.includes("ship"))) return "delivery";
  if (kinds.some((value) => value.includes("admin") || value.includes("process"))) return "administrative";
  return "general";
}

function inferContext(input: PlanningInput): FailurePatternContext {
  const hasCompeting = input.competingGoals.length > 0;
  const lowCapacity = input.capacity.availableHoursPerWeek <= 8;
  const highLoad = input.responsibilities.some((item) => item.isNonNegotiable && item.timeDemand === "high");
  const externalDependency = input.constraints.some((value) => /wait|vendor|approval|review|third party|partner/i.test(value));
  if (highLoad) return "high_load";
  if (lowCapacity) return "low_capacity";
  if (hasCompeting) return "competing_priorities";
  if (externalDependency) return "external_dependency";
  if (input.constraints.some((value) => /review|approval|rework/i.test(value))) return "repeated_review";
  return "general";
}

export function summarizeFailurePattern(plan: Plan, input: PlanningInput): FailurePatternWarning[] {
  const riskScore = Math.min(
    1,
    (plan.actions.length > 6 ? 0.25 : 0) +
      (input.capacity.availableHoursPerWeek <= 8 ? 0.25 : 0) +
      (input.competingGoals.length > 0 ? 0.2 : 0) +
      (input.constraints.length > 2 ? 0.2 : 0) +
      (plan.actions.filter((action) => action.estimatedEffort === "high").length > 1 ? 0.15 : 0)
  );

  const kind = inferActionKind(plan);
  const context = inferContext(input);
  const warnings: FailurePatternWarning[] = [];

  if (riskScore >= 0.6) {
    warnings.push({
      id: newId(),
      title: "Repeated delay pattern detected",
      detail: `This plan contains a high-risk pattern in ${FAILURE_PATTERN_KIND_COPY[kind]} during ${FAILURE_PATTERN_CONTEXT_COPY[context]}.`,
      risk: Math.round(riskScore * 100),
      actionKind: kind,
      contextTag: context,
      recommendation: "Reduce the action cluster, add a simpler handoff, or re-sequence the path before lock.",
    });
  }

  if (plan.actions.filter((action) => action.estimatedEffort === "high").length >= 2) {
    warnings.push({
      id: newId(),
      title: "High-effort concentration risk",
      detail: `The plan holds multiple high-effort actions in a single sequence. This pattern often slows completion in a constrained context.`,
      risk: 72,
      actionKind: kind,
      contextTag: context,
      recommendation: "Separate the high-effort work into smaller, more recoverable intervals.",
    });
  }

  return warnings;
}

export function normalizeFailurePattern(record: FailurePatternRecord): FailurePatternRecord {
  return {
    ...record,
    occurrences: Math.max(1, record.occurrences || 1),
    riskScore: Math.max(0, Math.min(100, Number(record.riskScore) || 0)),
  };
}

export function recordFailurePattern(
  actionKind: FailurePatternActionKind,
  contextTag: FailurePatternContext,
  patternType: FailurePatternType,
  occurrences = 1
): FailurePatternRecord {
  return normalizeFailurePattern({
    id: newId(),
    actionKind,
    contextTag,
    patternType,
    occurrences,
    lastObservedAt: nowIso(),
    riskScore: Math.min(100, Math.max(30, occurrences * 25)),
    createdAt: nowIso(),
  });
}
