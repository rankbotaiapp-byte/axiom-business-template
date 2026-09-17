import type { EffortLevel, PlanningInput, PlanRoute } from "@/types";

export type CapacityContext = {
  availableHours: number;
  energyLevel: PlanningInput["capacity"]["energyLevel"];
  load: string;
  competing: string;
  constraints: string;
  defaultRoute: PlanRoute;
  maxEffort: EffortLevel;
};

export function capacityContext(input: PlanningInput): CapacityContext {
  const availableHours = input.capacity.availableHoursPerWeek;
  const nonNegotiable = input.responsibilities
    .filter((item) => item.isNonNegotiable)
    .map((item) => item.title);
  const load =
    (nonNegotiable.length > 0
      ? nonNegotiable
      : input.responsibilities.map((item) => item.title)
    ).join(", ") || "unlisted load";
  const competing =
    input.competingGoals
      .slice()
      .sort((a, b) => a.priority - b.priority)
      .map((item) => item.title)
      .join(", ") || "none recorded";
  const constraints = input.constraints.join("; ") || "none recorded";
  const tight = availableHours < 5 || input.capacity.energyLevel === "low";
  return {
    availableHours,
    energyLevel: input.capacity.energyLevel,
    load,
    competing,
    constraints,
    defaultRoute: tight ? "compressed" : "necessary",
    maxEffort: input.capacity.energyLevel === "low" || availableHours < 4 ? "medium" : "high",
  };
}

export function hoursToEffort(hours: number, maxEffort: EffortLevel): EffortLevel {
  const raw: EffortLevel = hours <= 1.2 ? "low" : hours <= 3 ? "medium" : "high";
  if (raw === "high" && maxEffort === "medium") return "medium";
  return raw;
}

export function clampHours(value: number, ceiling: number): number {
  return Math.max(0.5, Math.min(ceiling, Math.round(value * 10) / 10));
}

export function sessionHours(availableHours: number, fraction: number, ceiling: number): number {
  return clampHours(availableHours * fraction, ceiling);
}

export const ROUTE_COPY: Record<PlanRoute, { title: string; why: string }> = {
  necessary: {
    title: "Necessary sequence",
    why: "Full causal path: define the proof, make the capacity tradeoff, produce, record, repeat under load, stabilize a method.",
  },
  compressed: {
    title: "Compressed sequence",
    why: "Same requirements, fewer commitments. Used when hours or energy cannot carry administrative overhead before contact with the work.",
  },
  direct_proof: {
    title: "Direct proof sequence",
    why: "The first artifact is immediate. Capacity and method are recorded after contact, not before it.",
  },
};
