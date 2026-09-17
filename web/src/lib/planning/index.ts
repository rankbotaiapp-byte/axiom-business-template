import type { PlanningInput, UserProfile, Vision } from "@/types";

export { capacityContext, ROUTE_COPY } from "./capacity";
export { classifyOutcome } from "./classify";
export { CAPITALIZATION_COPY } from "./capitalize";
export {
  dependencySatisfied,
  firstRequiredActions,
  generateCapitalization,
  generatePlan,
  hasCapitalizationActions,
  isPrimarySequenceComplete,
  needsCapitalizationReview,
  nextRoute,
  planSources,
  primaryActionPool,
  releaseAbandonedFoundation,
} from "./generate";
export type { GeneratedPlan } from "./generate";
export { canCommitLock, CAPACITY_ADJUST_REASON, EFFORT_HOURS, lockBlockedByStress, stressTest } from "./stress";
export type { LockStressInput, StressFinding, StressReport, StressSeverity } from "./stress";

export function toPlanningInput(vision: Vision, profile: UserProfile): PlanningInput {
  return {
    visionId: vision.id,
    title: vision.title,
    description: vision.description,
    livingDensity: vision.livingDensity,
    capacity: vision.contextSnapshot.capacity,
    responsibilities: vision.contextSnapshot.responsibilities,
    competingGoals: vision.contextSnapshot.competingGoals,
    constraints: vision.contextSnapshot.constraints ?? profile.constraints,
    capturedAt: vision.createdAt,
  };
}
