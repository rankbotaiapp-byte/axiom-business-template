import type { AppState, Plan, PossibilityTurningPoint, Vision } from "@/types";

export const CAPITALIZATION_PHASE = "Capitalization";

export const INSTITUTIONAL_PHASES = [
  "Initiation",
  "Committed Execution",
  "Threshold Pending",
  "Demonstrably Reachable",
  "Capitalization",
  "Realized",
] as const;

export type InstitutionalPhase = (typeof INSTITUTIONAL_PHASES)[number];

export const INSTITUTIONAL_PHASE_COPY: Record<InstitutionalPhase, string> = {
  Initiation:
    "The vision is being formalized. The record is still in the initial orientation phase before a committed sequence is locked.",
  "Committed Execution":
    "The sequence is locked and execution is the governing condition. Every action must be evidenced before it is treated as complete.",
  "Threshold Pending":
    "The evidence stream is strong enough to suggest the threshold, but the outcome is not yet formally declared as demonstrably reachable.",
  "Demonstrably Reachable":
    "The threshold has been reached. The outcome has crossed from theoretical to established and is now a documented operating reality.",
  Capitalization:
    "The proven path is being converted into repeatable leverage and durable operational capacity.",
  Realized:
    "The vision has been realized. The record is complete and the execution state is closed.",
};

export function withCapitalizationPhase(plan: Plan): Plan {
  if (plan.phases.includes(CAPITALIZATION_PHASE)) return plan;
  return { ...plan, phases: [...plan.phases, CAPITALIZATION_PHASE] };
}

export function isCapitalized(plan: Plan): boolean {
  return plan.phases.includes(CAPITALIZATION_PHASE);
}

export function institutionalPhaseName(
  plan: Plan | undefined,
  vision: Vision | undefined,
  point?: PossibilityTurningPoint
): InstitutionalPhase {
  if (!plan || !vision) return "Initiation";
  if (vision.status === "completed" || vision.status === "archived") return "Realized";
  if (point) {
    if (plan.capitalizationLocked || plan.actions.some((action) => action.phase === CAPITALIZATION_PHASE)) {
      return "Capitalization";
    }
    return "Demonstrably Reachable";
  }
  if (!plan.isLocked) return "Initiation";
  const completed = plan.actions.filter((action) => action.status === "completed").length;
  const hasEvidence = completed > 0 || plan.actions.some((action) => action.status === "in_progress");
  if (hasEvidence && vision.livingDensity >= 35) return "Threshold Pending";
  return "Committed Execution";
}

export function turningPointFor(
  state: AppState,
  visionId: string
): PossibilityTurningPoint | undefined {
  return state.turningPoints.find((item) => item.visionId === visionId);
}
