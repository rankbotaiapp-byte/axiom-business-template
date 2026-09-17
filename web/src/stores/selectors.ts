import { turningPointFor } from "@/lib/turning-points";
import type { AppState, Plan, PossibilityTurningPoint, Vision } from "@/types";

export function primaryPlan(state: AppState): Plan | undefined {
  return state.plans.find((plan) => plan.isLocked) ?? state.plans[0];
}

export function primaryVision(state: AppState): Vision | undefined {
  const plan = primaryPlan(state);
  if (plan) return state.visions.find((vision) => vision.id === plan.visionId);
  return state.visions[0];
}

export function workFor(
  state: AppState,
  planId?: string
): {
  plan: Plan | undefined;
  vision: Vision | undefined;
  turningPoint: PossibilityTurningPoint | undefined;
} {
  const plan = planId ? state.plans.find((item) => item.id === planId) : primaryPlan(state);
  const vision = plan ? state.visions.find((item) => item.id === plan.visionId) : primaryVision(state);
  return {
    plan,
    vision,
    turningPoint: vision ? turningPointFor(state, vision.id) : undefined,
  };
}
