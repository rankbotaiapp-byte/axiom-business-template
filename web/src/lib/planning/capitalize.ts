import { CAPITALIZATION_PHASE } from "@/lib/turning-points";
import type { PlanningInput } from "@/types";

import { capacityContext, clampHours, hoursToEffort, sessionHours } from "./capacity";
import { classifyOutcome, SIMILAR } from "./classify";
import type { ActionDraft } from "./routes";

export function capitalizationActions(
  input: PlanningInput,
  provenTitles: string[],
  alternate = false
): ActionDraft[] {
  const ctx = capacityContext(input);
  const similar = SIMILAR[classifyOutcome(input)];
  const session = sessionHours(ctx.availableHours, 0.7, 6);
  const admin = clampHours(Math.min(1, ctx.availableHours * 0.2), 1.5);
  const proven = provenTitles.join("; ") || "the recorded foundation";
  const tight = ctx.availableHours < 5 || ctx.energyLevel === "low";

  const convert: ActionDraft = {
    title: "Convert the proven method",
    phase: CAPITALIZATION_PHASE,
    estimatedEffort: hoursToEffort(admin, ctx.maxEffort),
    description: `The foundation proved: ${proven}. Write the next leverage move that uses that method to advance "${input.title}" inside ${ctx.availableHours}h after ${ctx.load}. Constraints: ${ctx.constraints}. Record: the written conversion — one move, one artifact, one deadline.`,
  };

  const apply: ActionDraft = {
    title: "Apply capacity to the leverage point",
    phase: CAPITALIZATION_PHASE,
    estimatedEffort: hoursToEffort(session, ctx.maxEffort),
    description: `Execute the conversion. Take the hours from ${ctx.load}. Competing intentions that do not get those hours: ${ctx.competing}. ${similar.artifact} It must count toward: ${input.description}. Record: the artifact or contact a third party can inspect.`,
  };

  const close: ActionDraft = alternate
    ? {
        title: "Close one real instance",
        phase: CAPITALIZATION_PHASE,
        estimatedEffort: hoursToEffort(session, ctx.maxEffort),
        description: `Use the same method to close one instance of the outcome: ${similar.proof} Stay inside ${ctx.availableHours}h. Do not start a new foundation. Record: the closed instance — yes, no, delivered, or filed.`,
      }
    : {
        title: "Produce the outcome-facing result",
        phase: CAPITALIZATION_PHASE,
        estimatedEffort: hoursToEffort(session, ctx.maxEffort),
        description: `Produce the result a third party would count as "${input.title}" existing. Proof standard: ${similar.proof} Stay inside ${ctx.availableHours}h and do not drop ${ctx.load}. Record: the result in the world, not a plan to produce it.`,
      };

  const loop: ActionDraft = {
    title: "Install the conversion loop",
    phase: CAPITALIZATION_PHASE,
    estimatedEffort: hoursToEffort(clampHours(Math.min(1.2, ctx.availableHours * 0.25), 2), ctx.maxEffort),
    description: `Write the capitalization loop in ordered steps: convert, apply, produce. It must be repeatable under ${ctx.load} and ${ctx.availableHours}h. Record: a loop of at least three steps that names the next instance.`,
  };

  return tight ? [convert, apply, close] : [convert, apply, close, loop];
}

export const CAPITALIZATION_COPY = {
  title: "Capitalization sequence",
  why: "The foundation is proven. This sequence converts that method into the stated outcome. Fewer actions, higher leverage, same capacity constraints.",
} as const;
