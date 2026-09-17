import type { StrategicConnection, StrategicRole, Vision } from "@/types";

const MIN_NAME = 2;
const MIN_CONTEXT = 24;
const MIN_DRAFT = 80;

export function assessNomination(input: { name: string; context: string }): { ok: boolean; notes: string[] } {
  const notes: string[] = [];
  if (input.name.trim().length < MIN_NAME) {
    notes.push("Name the person. Initials are not sufficient if you can name them.");
  }
  if (input.context.trim().length < MIN_CONTEXT) {
    notes.push("State why this specific person fits the role. Do not paste a profile. Write what you already know.");
  }
  return { ok: notes.length === 0, notes };
}

export function assessContactDraft(draft: string): { ok: boolean; notes: string[] } {
  const text = draft.trim();
  const notes: string[] = [];
  if (text.length < MIN_DRAFT) {
    notes.push("The first-contact draft is too short. Name the reason, the ask, and why this person.");
  }
  if (/\b(hey|circling back|just wanted to|love your work|synergy)\b/i.test(text)) {
    notes.push("Remove filler. State the work, the reason, and the specific request.");
  }
  return { ok: notes.length === 0, notes };
}

export function draftFirstContact(input: {
  vision: Vision;
  role: StrategicRole;
  connection: Pick<StrategicConnection, "name" | "context">;
}): string {
  const ask =
    input.role.kind === "decision_maker"
      ? "one clear yes, no, or next step"
      : input.role.kind === "collaborator"
        ? "whether you will inspect or participate in one defined piece of work"
        : input.role.kind === "introducer"
          ? "whether you will make one specific introduction"
          : "one concrete piece of method from work you have already done";
  return [
    `${input.connection.name} —`,
    "",
    `I am writing because ${input.connection.context.trim()}.`,
    "",
    `I am executing this outcome: ${input.vision.title}. ${input.role.reason}`,
    "",
    `I am asking for ${ask}. I am not asking for a general conversation.`,
    "",
    "If this is not useful, a short no is sufficient.",
  ].join("\n");
}
