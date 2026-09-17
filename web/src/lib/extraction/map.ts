import { emptyClarifyingDraft, emptyCompetingGoal, emptyResponsibility, withGoalPriorities } from "@/lib/clarifying";
import { emptyVisionDraft, type VisionDraft } from "@/lib/vision-capture";
import { newId } from "@/lib/utils/ids";
import type { ClarifyingDraft } from "@/lib/clarifying";
import type { EffortLevel, EnergyLevel, ExtractionAnswer, ExtractionQuestionId, ExtractionRecord } from "@/types";

const NONE = /^\s*(none|no|nothing|n\/a|na|nope)\b/i;

function answerText(answers: ExtractionAnswer[], id: ExtractionQuestionId): string {
  return answers.find((item) => item.questionId === id)?.text.trim() ?? "";
}

function splitItems(text: string): string[] {
  if (!text || NONE.test(text)) return [];
  return text
    .split(/\s*(?:;|\.| and |,)\s*/i)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3 && !NONE.test(item));
}

function parseHours(text: string): number {
  const match = text.match(/\b(\d{1,2}(?:\.\d+)?)\b/);
  if (!match) return 0;
  const hours = Number(match[1]);
  if (!Number.isFinite(hours)) return 0;
  return Math.min(70, Math.max(0, Math.round(hours)));
}

function parseEnergy(text: string): EnergyLevel {
  if (/\bhigh\b/i.test(text)) return "high";
  if (/\blow\b/i.test(text)) return "low";
  return "medium";
}

function parseEffort(text: string): EffortLevel {
  if (/\bhigh\b/i.test(text)) return "high";
  if (/\blow\b/i.test(text)) return "low";
  return "medium";
}

export function clarifyingFromExtraction(answers: ExtractionAnswer[]): ClarifyingDraft {
  const draft = emptyClarifyingDraft();
  const named = splitItems(answerText(answers, "responsibilities"));
  const load = answerText(answers, "load");
  const effort = parseEffort(load);
  const responsibilities = (named.length ? named : [""]).map((title) => ({
    ...emptyResponsibility(),
    id: newId(),
    title,
    timeDemand: effort,
    isNonNegotiable: named.length > 0 && (/\bnon-?negotiable\b/i.test(load) || /\ball\b/i.test(load) || named.length === 1),
  }));

  const competingText = answerText(answers, "competing");
  const competing = splitItems(competingText);
  const constraintsText = answerText(answers, "constraints");
  const constraints = splitItems(constraintsText);
  const hours = parseHours(answerText(answers, "hours"));

  return {
    ...draft,
    responsibilities: responsibilities.length ? responsibilities : [emptyResponsibility()],
    competingGoals: competing.length
      ? withGoalPriorities(competing.map((title, index) => ({ ...emptyCompetingGoal(index + 1), id: newId(), title })))
      : [emptyCompetingGoal(1)],
    noCompetingGoals: competing.length === 0 && (NONE.test(competingText) || competingText.length > 0),
    capacity: {
      availableHoursPerWeek: hours,
      energyLevel: parseEnergy(answerText(answers, "energy")),
    },
    constraints: constraints.length ? constraints : [""],
    noHardConstraints: constraints.length === 0 && (NONE.test(constraintsText) || constraintsText.length > 0),
  };
}

export function visionFromExtraction(answers: ExtractionAnswer[]): VisionDraft {
  const title = answerText(answers, "title");
  const outcome = answerText(answers, "outcome");
  return {
    ...emptyVisionDraft(),
    title: title.slice(0, 80),
    description: outcome,
  };
}

export function observedFromExtraction(answers: ExtractionAnswer[]): string {
  return [answerText(answers, "outcome"), answerText(answers, "title")].filter(Boolean).join(" ");
}

export function extractionComplete(record: ExtractionRecord | undefined): boolean {
  return Boolean(record?.answers.length);
}
