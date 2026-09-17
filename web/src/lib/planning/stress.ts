import type { EffortLevel, FailurePatternWarning, Plan, PlanAction, PlanningInput, PlanRoute } from "@/types";

import { summarizeFailurePattern } from "../failure-patterns";
import { capacityContext } from "./capacity";

export const EFFORT_HOURS: Record<EffortLevel, number> = {
  low: 1.2,
  medium: 3,
  high: 5,
};

export const CAPACITY_ADJUST_REASON =
  "Too long for recorded capacity. Reduce overhead and cluster.";

export type StressSeverity = "clear" | "strained" | "misaligned";

export type StressFinding = {
  id: string;
  level: "warning" | "critical";
  title: string;
  detail: string;
};

export type CapacityProjectionWeek = {
  week: number;
  demand: number;
  available: number;
  delta: number;
  risk: "clear" | "warning" | "critical";
  note: string;
};

export type CapacityForecast = {
  summary: string;
  risk: "clear" | "warning" | "critical";
  weeks: CapacityProjectionWeek[];
};

export type StressReport = {
  severity: StressSeverity;
  findings: StressFinding[];
  openingHours: number;
  totalHours: number;
  availableHours: number;
  highEffortCount: number;
  reading: string;
  forecast: CapacityForecast;
  failureWarnings: FailurePatternWarning[];
};

function actionHours(action: PlanAction): number {
  return EFFORT_HOURS[action.estimatedEffort];
}

function consecutiveHigh(actions: PlanAction[]): number {
  let max = 0;
  let run = 0;
  for (const action of actions) {
    if (action.estimatedEffort === "high") {
      run += 1;
      max = Math.max(max, run);
    } else {
      run = 0;
    }
  }
  return max;
}

function makeCapacityForecast(plan: Plan, input: PlanningInput): CapacityForecast {
  const ctx = capacityContext(input);
  const actions = [...plan.actions].sort((a, b) => a.order - b.order);
  if (actions.length === 0 || ctx.availableHours <= 0) {
    return {
      summary: "The plan cannot be projected against a zero-hour or missing capacity record.",
      risk: "critical",
      weeks: [],
    };
  }

  const totalHours = actions.reduce((sum, action) => sum + actionHours(action), 0);
  const weeksNeeded = Math.max(2, Math.ceil(totalHours / Math.max(ctx.availableHours, 1)));
  const actionsPerWeek = Math.max(1, Math.ceil(actions.length / weeksNeeded));
  const weeks: CapacityProjectionWeek[] = [];
  let worst: "clear" | "warning" | "critical" = "clear";

  for (let week = 1; week <= weeksNeeded; week += 1) {
    const start = (week - 1) * actionsPerWeek;
    const slice = actions.slice(start, start + actionsPerWeek);
    const demand = slice.reduce((sum, action) => sum + actionHours(action), 0);
    const delta = demand - ctx.availableHours;
    let risk: CapacityProjectionWeek["risk"] = "clear";
    let note = `Projected demand: ${demand.toFixed(1)}h against ${ctx.availableHours}h available.`;

    if (demand > ctx.availableHours) {
      risk = "critical";
      note = `Week ${week} exceeds recorded capacity by ${Math.abs(delta).toFixed(1)}h.`;
      worst = "critical";
    } else if (demand > ctx.availableHours * 0.8) {
      risk = "warning";
      note = `Week ${week} uses ${demand.toFixed(1)}h of ${ctx.availableHours}h available and leaves little recovery.`;
      if (worst === "clear") worst = "warning";
    }

    weeks.push({
      week,
      demand: Number(demand.toFixed(1)),
      available: ctx.availableHours,
      delta: Number(delta.toFixed(1)),
      risk,
      note,
    });
  }

  const atRisk = weeks.filter((item) => item.risk !== "clear").length;
  const summary =
    worst === "critical"
      ? `Projected load exceeds weekly capacity in ${atRisk} week${atRisk === 1 ? "" : "s"}. The plan is not workable without an adjusted route or reduced scope.`
      : worst === "warning"
        ? `Projected load remains within the week but exceeds 80% of available capacity in ${atRisk} week${atRisk === 1 ? "" : "s"}. Breakage risk remains active.`
        : "Projected load remains within the recorded capacity envelope across the sequence.";

  return {
    summary,
    risk: worst,
    weeks,
  };
}

export function stressTest(plan: Plan, input: PlanningInput, route: PlanRoute): StressReport {
  const ctx = capacityContext(input);
  const actions = [...plan.actions].sort((a, b) => a.order - b.order);
  const opening = actions.slice(0, Math.min(3, actions.length));
  const openingHours = opening.reduce((sum, action) => sum + actionHours(action), 0);
  const totalHours = actions.reduce((sum, action) => sum + actionHours(action), 0);
  const highEffort = actions.filter((action) => action.estimatedEffort === "high");
  const nonNegotiable = input.responsibilities.filter((item) => item.isNonNegotiable);
  const heavyLoad = nonNegotiable.filter((item) => item.timeDemand === "high");
  const competing = [...input.competingGoals].sort((a, b) => a.priority - b.priority);
  const topGoals = competing.filter((item) => item.priority === 1);
  const findings: StressFinding[] = [];
  const forecast = makeCapacityForecast(plan, input);
  const failureWarnings = summarizeFailurePattern(plan, input);

  if (ctx.availableHours <= 0) {
    findings.push({
      id: "no-hours",
      level: "critical",
      title: "No weekly hours are recorded",
      detail:
        "The sequence cannot be executed against a zero-hour week. Clarifying capacity is required before lock.",
    });
  } else if (openingHours > ctx.availableHours) {
    findings.push({
      id: "opening-over-hours",
      level: "critical",
      title: "Opening cluster exceeds weekly hours",
      detail: `The first ${opening.length} actions estimate ${openingHours.toFixed(1)}h. Available capacity is ${ctx.availableHours}h after ${ctx.load}.`,
    });
  } else if (openingHours > ctx.availableHours * 0.75) {
    findings.push({
      id: "opening-tight",
      level: "warning",
      title: "Opening cluster consumes most of the week",
      detail: `The first ${opening.length} actions estimate ${openingHours.toFixed(1)}h of ${ctx.availableHours}h available. There is little remainder for ${ctx.load}.`,
    });
  }

  if (highEffort.length > 0 && heavyLoad.length > 0) {
    const names = heavyLoad.map((item) => item.title).join(", ");
    findings.push({
      id: "nonnegotiable-collision",
      level: ctx.availableHours < 8 ? "critical" : "warning",
      title: "High-effort steps collide with non-negotiable load",
      detail: `${highEffort.length} high-effort action${highEffort.length === 1 ? "" : "s"} sit against non-negotiable demand: ${names}. Those hours are not available for this sequence.`,
    });
  } else if (nonNegotiable.length > 0 && ctx.availableHours > 0 && openingHours > ctx.availableHours * 0.5) {
    findings.push({
      id: "nonnegotiable-in-force",
      level: "warning",
      title: "Non-negotiable responsibilities remain in force",
      detail: `Recorded non-negotiables: ${nonNegotiable.map((item) => item.title).join(", ")}. The opening cluster already uses ${openingHours.toFixed(1)}h of ${ctx.availableHours}h. Those obligations were not deferred.`,
    });
  }

  if (ctx.availableHours > 0 && totalHours > ctx.availableHours * 3) {
    findings.push({
      id: "sequence-span",
      level: totalHours > ctx.availableHours * 5 ? "critical" : "warning",
      title: "The sequence exceeds recorded weekly capacity by a wide margin",
      detail: `Estimated ${totalHours.toFixed(1)}h across the sequence against ${ctx.availableHours}h per week. That is more than three weeks of recorded capacity if the work is run as written.`,
    });
  }

  if (ctx.energyLevel === "low" && highEffort.length >= 2) {
    findings.push({
      id: "energy-high-effort",
      level: "critical",
      title: "Energy cannot carry clustered high-effort work",
      detail: `Energy is recorded as low. The sequence contains ${highEffort.length} high-effort actions. That combination is not executable as written.`,
    });
  } else if (ctx.energyLevel === "low" && highEffort.length === 1) {
    findings.push({
      id: "energy-one-high",
      level: "warning",
      title: "A high-effort step sits on low energy",
      detail: `"${highEffort[0].title}" is high-effort while energy is low. Expect slippage unless the action is reduced.`,
    });
  }

  const cluster = consecutiveHigh(actions);
  if (cluster >= 3) {
    findings.push({
      id: "cluster-severe",
      level: "critical",
      title: "Difficult steps are clustered without recovery",
      detail: `${cluster} high-effort actions run in sequence. Recorded capacity does not support that density.`,
    });
  } else if (cluster >= 2 && ctx.availableHours < 10) {
    findings.push({
      id: "cluster-tight",
      level: "warning",
      title: "Difficult steps are adjacent",
      detail: `${cluster} high-effort actions are consecutive. Under ${ctx.availableHours}h and ${ctx.load}, the second step will compete with recovery.`,
    });
  }

  if (
    competing.length > 0 &&
    (openingHours > ctx.availableHours * 0.5 || highEffort.length >= 1 || actions.length >= 4)
  ) {
    const names = competing.map((item) => item.title).join(", ");
    const severe =
      topGoals.length > 0 && (openingHours > ctx.availableHours * 0.75 || highEffort.length >= 2);
    findings.push({
      id: "competing-goals",
      level: severe ? "critical" : "warning",
      title: severe
        ? "Highest-priority competing goals collide with this sequence"
        : "Competing goals remain in force",
      detail: `These still claim attention: ${names}. A loaded sequence will lose hours to them unless they are deferred in the record.`,
    });
  }

  if (input.constraints.length > 0 && (openingHours > ctx.availableHours * 0.6 || highEffort.length > 0)) {
    findings.push({
      id: "constraints-in-force",
      level: "warning",
      title: "Hard constraints are in force on a loaded sequence",
      detail: `Constraints: ${ctx.constraints}. They were not removed by generating this route.`,
    });
  }

  if (route === "necessary" && ctx.defaultRoute === "compressed") {
    findings.push({
      id: "route-mismatch",
      level: "critical",
      title: "The route is heavier than capacity supports",
      detail: `Recorded hours or energy select a compressed route. This sequence is the full necessary path. Locking it as written is a capacity error.`,
    });
  }

  if (forecast.risk !== "clear") {
    findings.push({
      id: "capacity-forecast",
      level: forecast.risk === "critical" ? "critical" : "warning",
      title: forecast.risk === "critical" ? "Projected capacity breakage" : "Projected weekly saturation",
      detail: forecast.summary,
    });
  }

  const critical = findings.some((item) => item.level === "critical");
  const hoursLabel =
    ctx.availableHours > 0
      ? `${openingHours.toFixed(1)}h of ${ctx.availableHours}h available`
      : `${openingHours.toFixed(1)}h against 0h available`;
  return {
    severity: findings.length === 0 ? "clear" : critical ? "misaligned" : "strained",
    findings,
    openingHours,
    totalHours,
    availableHours: ctx.availableHours,
    highEffortCount: highEffort.length,
    reading: `Opening cluster ${hoursLabel} · ${highEffort.length} high-effort · sequence ${totalHours.toFixed(1)}h`,
    forecast,
    failureWarnings,
  };
}

export type LockStressInput = {
  acknowledged?: boolean;
  acceptMisalignment?: boolean;
};

export function canCommitLock(report: StressReport | null, input: LockStressInput = {}): boolean {
  if (!report) return false;
  if (report.findings.length > 0 && !input.acknowledged) return false;
  if (report.severity === "misaligned" && !input.acceptMisalignment) return false;
  return true;
}

export function lockBlockedByStress(report: StressReport, acceptMisalignment: boolean): boolean {
  return !canCommitLock(report, { acknowledged: true, acceptMisalignment });
}
