import { classifyOutcome } from "@/lib/planning/classify";
import type { ConnectionRoleKind, PlanningInput, StrategicRole } from "@/types";
import { newId } from "@/lib/utils/ids";

export type RoleDraft = {
  kind: ConnectionRoleKind;
  title: string;
  reason: string;
};

export const CONNECTION_PHASE = "Strategic connection";

const ROLES: Record<ReturnType<typeof classifyOutcome>, RoleDraft[]> = {
  offer: [
    {
      kind: "decision_maker",
      title: "Decision-maker who can approve or buy the offer",
      reason: "The offer does not exist as a commercial fact until a real person is asked and answers.",
    },
    {
      kind: "practitioner",
      title: "Someone who has sold a comparable offer",
      reason: "A person who has already closed this class of work can name the proof that actually matters.",
    },
  ],
  artifact: [
    {
      kind: "practitioner",
      title: "Someone who has published this form of work",
      reason: "A finished artifact is judged by people who have already put one in the world.",
    },
    {
      kind: "collaborator",
      title: "A reader or editor who will inspect the draft",
      reason: "Inspection by a named person is the difference between a private file and a public object.",
    },
  ],
  body: [
    {
      kind: "practitioner",
      title: "A practitioner who has completed this protocol",
      reason: "Load and recovery are specific. Someone who has done the work can confirm the first session is real.",
    },
  ],
  capital: [
    {
      kind: "decision_maker",
      title: "Counterparty on the money movement",
      reason: "Capital outcomes require a transaction with a named other party.",
    },
    {
      kind: "practitioner",
      title: "Someone who has executed this class of transfer",
      reason: "The first real movement is easier to specify if a prior execution is in view.",
    },
  ],
  role: [
    {
      kind: "decision_maker",
      title: "Decision-maker in the target organization or process",
      reason: "A role change is not internal. It requires a decision that leaves your head.",
    },
    {
      kind: "practitioner",
      title: "Someone who has already made this move",
      reason: "The first external action is clearer when named against a completed example.",
    },
  ],
  system: [
    {
      kind: "collaborator",
      title: "Operator who will run the system on real work",
      reason: "A system that no one operates is a diagram. Name the person who will run it once.",
    },
    {
      kind: "practitioner",
      title: "Someone who has installed a similar system",
      reason: "The first live run should be specified against a method that has already carried load.",
    },
  ],
  general: [
    {
      kind: "decision_maker",
      title: "Person whose decision or participation would make the outcome real",
      reason: "If the result depends on another human, that role belongs in the plan, not in a later hope.",
    },
    {
      kind: "practitioner",
      title: "Someone who has already produced this class of result",
      reason: "A completed example defines the first inspectable proof.",
    },
  ],
};

export function identifyStrategicRoles(input: Pick<PlanningInput, "title" | "description">): RoleDraft[] {
  return ROLES[classifyOutcome(input)];
}

export function materializeRoles(
  drafts: RoleDraft[],
  input: { planId: string; visionId: string }
): StrategicRole[] {
  return drafts.map((draft, index) => ({
    id: newId(),
    planId: input.planId,
    visionId: input.visionId,
    kind: draft.kind,
    title: draft.title,
    reason: draft.reason,
    order: index + 1,
  }));
}
