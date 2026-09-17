import { CONNECTION_PHASE } from "@/lib/connections/roles";
import { newId } from "@/lib/utils/ids";
import { CAPITALIZATION_PHASE } from "@/lib/turning-points";
import type { Plan, PlanAction, PlanningInput, PlanRoute } from "@/types";

import { capitalizationActions } from "./capitalize";
import { capacityContext, ROUTE_COPY } from "./capacity";
import { classifyOutcome, SIMILAR } from "./classify";
import { compressedActions, directProofActions, necessaryActions, type ActionDraft } from "./routes";

export type GeneratedPlan = {
  route: PlanRoute;
  phases: string[];
  actions: PlanAction[];
};

const ROUTES: PlanRoute[] = ["necessary", "compressed", "direct_proof"];

export function nextRoute(current: PlanRoute, reason: string): PlanRoute {
  const text = reason.toLowerCase();
  if (/\b(too much|unnecessary|overhead|admin|paper|long)\b/.test(text) && current !== "compressed") {
    return "compressed";
  }
  if (/\b(wrong|incorrect|skip|not the work|direct)\b/.test(text) && current !== "direct_proof") {
    return "direct_proof";
  }
  if (/\b(full|necessary|complete|missing)\b/.test(text) && current !== "necessary") {
    return "necessary";
  }
  return ROUTES[(ROUTES.indexOf(current) + 1) % ROUTES.length];
}

export function generatePlan(input: PlanningInput, route: PlanRoute): GeneratedPlan {
  const drafts =
    route === "compressed"
      ? compressedActions(input)
      : route === "direct_proof"
        ? directProofActions(input)
        : necessaryActions(input);
  const actions = materialize(drafts);
  const phases = [...new Set(actions.map((action) => action.phase))];
  return { route, phases, actions };
}

export function planSources(input: PlanningInput, route: PlanRoute) {
  const ctx = capacityContext(input);
  const similar = SIMILAR[classifyOutcome(input)];
  return {
    vision: input.title,
    capacity: `${ctx.availableHours}h / week · ${ctx.energyLevel} energy after ${ctx.load}. Competing: ${ctx.competing}. Constraints: ${ctx.constraints}.`,
    research: similar.research,
    route: ROUTE_COPY[route],
  };
}

export function generateCapitalization(input: PlanningInput, provenTitles: string[], alternate = false): GeneratedPlan {
  const actions = materialize(capitalizationActions(input, provenTitles, alternate));
  return { route: "compressed", phases: [CAPITALIZATION_PHASE], actions };
}

export function hasCapitalizationActions(plan: Plan): boolean {
  return plan.actions.some((action) => action.phase === CAPITALIZATION_PHASE);
}

export function needsCapitalizationReview(plan: Plan): boolean {
  return hasCapitalizationActions(plan) && !plan.capitalizationLocked;
}

function isConnectionAction(action: PlanAction): boolean {
  return action.phase === CONNECTION_PHASE;
}

function isCapitalizationAction(action: PlanAction): boolean {
  return action.phase === CAPITALIZATION_PHASE;
}

export function releaseAbandonedFoundation(plan: Plan): Plan {
  return {
    ...plan,
    actions: plan.actions.map((action) => {
      if (isCapitalizationAction(action) || isConnectionAction(action)) return action;
      if (action.status === "completed") return action;
      return { ...action, status: "skipped" as const };
    }),
  };
}

export function primaryActionPool(plan: Plan): PlanAction[] {
  if (!hasCapitalizationActions(plan)) return plan.actions.filter((action) => action.status !== "skipped");
  if (!plan.capitalizationLocked) return [];
  const capitalization = plan.actions.filter(isCapitalizationAction);
  const capitalizationDone = capitalization.every((action) => action.status === "completed");
  const outreach = plan.actions.filter(isConnectionAction);
  return capitalizationDone ? [...capitalization, ...outreach] : capitalization;
}

export function dependencySatisfied(plan: Plan, depId: string, completed: Set<string>): boolean {
  if (completed.has(depId)) return true;
  const dep = plan.actions.find((action) => action.id === depId);
  if (!dep) return true;
  if (dep.status === "skipped") return true;
  if (!hasCapitalizationActions(plan) || !plan.capitalizationLocked) return false;
  return !isCapitalizationAction(dep) && !isConnectionAction(dep);
}

export function isPrimarySequenceComplete(plan: Plan): boolean {
  const pool = primaryActionPool(plan);
  return pool.length > 0 && pool.every((action) => action.status === "completed");
}

export function firstRequiredActions(plan: Plan): PlanAction[] {
  const pool = primaryActionPool(plan);
  const completed = new Set(plan.actions.filter((action) => action.status === "completed").map((action) => action.id));
  return pool
    .filter((action) => action.status === "pending" || action.status === "in_progress")
    .filter((action) => action.dependencies.every((id) => dependencySatisfied(plan, id, completed)))
    .sort((a, b) => a.order - b.order);
}

function materialize(drafts: ActionDraft[]): PlanAction[] {
  const ids = drafts.map(() => newId());
  return drafts.map((draft, index) => ({
    id: ids[index],
    title: draft.title,
    description: draft.description,
    phase: draft.phase,
    order: index + 1,
    status: "pending",
    dependencies: index === 0 ? [] : [ids[index - 1]],
    estimatedEffort: draft.estimatedEffort,
  }));
}
