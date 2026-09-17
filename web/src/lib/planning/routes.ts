import type { EffortLevel, PlanningInput } from "@/types";

import {
  capacityContext,
  clampHours,
  hoursToEffort,
  sessionHours,
  type CapacityContext,
} from "./capacity";
import { classifyOutcome, SIMILAR } from "./classify";

export type ActionDraft = {
  title: string;
  description: string;
  phase: string;
  estimatedEffort: EffortLevel;
};

function effort(hours: number, ctx: CapacityContext): EffortLevel {
  return hoursToEffort(hours, ctx.maxEffort);
}

export function necessaryActions(input: PlanningInput): ActionDraft[] {
  const ctx = capacityContext(input);
  const similar = SIMILAR[classifyOutcome(input)];
  const session = sessionHours(ctx.availableHours, 0.55, 6);
  const admin = clampHours(Math.min(1, ctx.availableHours * 0.2), 1.5);
  return [
    {
      title: "Define the first proof",
      phase: "Establish the proof",
      estimatedEffort: effort(admin, ctx),
      description: `Write a one-week proof test for: "${input.title}". It must fit ${ctx.availableHours} available hours after ${ctx.load}. The proof must match what similar outcomes require: ${similar.proof} Record: the written test, deadline, and visible artifact.`,
    },
    {
      title: "Make the capacity tradeoff",
      phase: "Establish the proof",
      estimatedEffort: effort(admin, ctx),
      description: `State which of these will lose time so the proof can happen: ${ctx.load}. Competing intentions: ${ctx.competing}. Hard constraints: ${ctx.constraints}. If none can move, shrink the proof until it fits ${ctx.availableHours} hours. Record: hours taken from where, or the reduced proof.`,
    },
    {
      title: "Produce the first artifact",
      phase: "Establish the proof",
      estimatedEffort: effort(session, ctx),
      description: `${similar.artifact} It must count toward: ${input.description}. Stay inside ${ctx.availableHours} hours and do not drop ${ctx.load}. Record: the artifact exists where a third party can inspect it.`,
    },
    {
      title: "Record the outcome without interpretation",
      phase: "Stabilize under load",
      estimatedEffort: effort(0.5, ctx),
      description:
        "Write what was produced, what was not, and the next physical action. Do not record how it felt. Record: an outcome entry a third party could understand.",
    },
    {
      title: "Repeat once under real load",
      phase: "Stabilize under load",
      estimatedEffort: effort(session, ctx),
      description: `Repeat the same class of action once without dropping ${ctx.load}. Stay inside ${ctx.availableHours} hours. Energy level in force: ${ctx.energyLevel}. Record: a second documented artifact or outcome.`,
    },
    {
      title: "Write the working method",
      phase: "Stabilize under load",
      estimatedEffort: effort(Math.min(1.5, ctx.availableHours * 0.3), ctx),
      description: `From the two outcomes, write the method in ordered steps a stranger could follow toward: ${input.title}. Record: a method of at least four steps.`,
    },
  ];
}

export function compressedActions(input: PlanningInput): ActionDraft[] {
  const ctx = capacityContext(input);
  const similar = SIMILAR[classifyOutcome(input)];
  const session = sessionHours(ctx.availableHours, 0.6, 6);
  const admin = clampHours(Math.min(1.2, ctx.availableHours * 0.25), 2);
  return [
    {
      title: "Proof and tradeoff in one pass",
      phase: "Proof under constraint",
      estimatedEffort: effort(admin, ctx),
      description: `Write a proof test for "${input.title}" that already names the hours taken from ${ctx.load}. Competing: ${ctx.competing}. Constraints: ${ctx.constraints}. Fit ${ctx.availableHours}h. Aim at: ${similar.proof} Record: a proof test that includes the capacity tradeoff.`,
    },
    {
      title: "Produce and record the first artifact",
      phase: "Proof under constraint",
      estimatedEffort: effort(session, ctx),
      description: `${similar.artifact} Then write what was produced and what was not. Outcome: ${input.description}. Record: artifact plus a recorded outcome.`,
    },
    {
      title: "Repeat once under real load",
      phase: "Stabilize under load",
      estimatedEffort: effort(session, ctx),
      description: `Repeat the same class of action once without dropping ${ctx.load}. Stay inside ${ctx.availableHours} hours. Record: a second documented outcome.`,
    },
    {
      title: "Write the working method",
      phase: "Stabilize under load",
      estimatedEffort: effort(Math.min(1.2, ctx.availableHours * 0.25), ctx),
      description: `Write the method a stranger could follow toward: ${input.title}. Record: a method of at least four steps.`,
    },
  ];
}

export function directProofActions(input: PlanningInput): ActionDraft[] {
  const ctx = capacityContext(input);
  const similar = SIMILAR[classifyOutcome(input)];
  const session = sessionHours(ctx.availableHours, 0.65, 6);
  return [
    {
      title: "Produce the first proof now",
      phase: "Direct proof",
      estimatedEffort: effort(session, ctx),
      description: `${similar.artifact} Do it inside ${ctx.availableHours} available hours and around ${ctx.load}. Constraints: ${ctx.constraints}. It must count toward: ${input.description}. Record: ${similar.proof}`,
    },
    {
      title: "Record the outcome and the tradeoff",
      phase: "Direct proof",
      estimatedEffort: effort(0.75, ctx),
      description: `Write what was produced, what was not, and which of ${ctx.load} paid for the hours. Competing goals not used: ${ctx.competing}. Record: an outcome entry that includes the capacity cost.`,
    },
    {
      title: "Repeat once under real load",
      phase: "Stabilize under load",
      estimatedEffort: effort(session, ctx),
      description: `Repeat the same class of action once. Stay inside ${ctx.availableHours} hours. Record: a second documented outcome.`,
    },
    {
      title: "Write the working method",
      phase: "Stabilize under load",
      estimatedEffort: effort(Math.min(1.2, ctx.availableHours * 0.25), ctx),
      description: `Write the method toward: ${input.title}. Record: a method of at least four steps.`,
    },
  ];
}
