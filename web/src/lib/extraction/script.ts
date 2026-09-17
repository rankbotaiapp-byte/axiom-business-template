import type { ExtractionQuestionId } from "@/types";

export type ExtractionClipId = "induction" | "exit" | "reprompt" | ExtractionQuestionId;

export type ExtractionSegmentKind = "induction" | "question" | "exit" | "reprompt";

export type ExtractionSegment = {
  id: ExtractionClipId;
  kind: ExtractionSegmentKind;
  questionId?: ExtractionQuestionId;
  src: string;
  title: string;
  script: string;
};

export const EXTRACTION_DIR = "/audio/extraction";

export const EXTRACTION_SEGMENTS: ExtractionSegment[] = [
  {
    id: "induction",
    kind: "induction",
    src: `${EXTRACTION_DIR}/induction.mp3`,
    title: "Induction",
    script: `This is a guided extraction session.

Remain still. Do not improve your mood. Do not perform calm.

Breathe at a steady rate. Let the jaw unclench. Let the hands rest.

You are not here to feel a future. You are here to name what will exist, and what currently consumes your hours.

When I ask a question, answer out loud. Use objects, numbers, names, and dates. If you do not know, say that you do not know.

We begin.`,
  },
  {
    id: "outcome",
    kind: "question",
    questionId: "outcome",
    src: `${EXTRACTION_DIR}/q-outcome.mp3`,
    title: "Stated outcome",
    script:
      "What will exist when this is complete? Name what a third party would see, hold, or inspect. Rooms, documents, money moved, a signed page. Not a feeling.",
  },
  {
    id: "title",
    kind: "question",
    questionId: "title",
    src: `${EXTRACTION_DIR}/q-title.mp3`,
    title: "Title",
    script: "Give this outcome a short title a third party could identify. One line.",
  },
  {
    id: "responsibilities",
    kind: "question",
    questionId: "responsibilities",
    src: `${EXTRACTION_DIR}/q-responsibilities.mp3`,
    title: "Responsibilities",
    script:
      "What current responsibilities consume real hours? Name the roles and obligations that will still be in force while you execute this.",
  },
  {
    id: "load",
    kind: "question",
    questionId: "load",
    src: `${EXTRACTION_DIR}/q-load.mp3`,
    title: "Load",
    script:
      "Which of those are non-negotiable, and how heavy is the time demand — low, medium, or high?",
  },
  {
    id: "hours",
    kind: "question",
    questionId: "hours",
    src: `${EXTRACTION_DIR}/q-hours.mp3`,
    title: "Weekly hours",
    script:
      "After those obligations, how many hours per week are actually available for this work? Give a number.",
  },
  {
    id: "energy",
    kind: "question",
    questionId: "energy",
    src: `${EXTRACTION_DIR}/q-energy.mp3`,
    title: "Energy",
    script: "At that weekly load, what energy is sustainable — low, medium, or high? Do not inflate it.",
  },
  {
    id: "competing",
    kind: "question",
    questionId: "competing",
    src: `${EXTRACTION_DIR}/q-competing.mp3`,
    title: "Competing goals",
    script: "What other intentions are competing for the same hours? If there are none, say none.",
  },
  {
    id: "constraints",
    kind: "question",
    questionId: "constraints",
    src: `${EXTRACTION_DIR}/q-constraints.mp3`,
    title: "Hard constraints",
    script: "Name the hard constraints: money, location, health, legal, deadline. If none apply, say none.",
  },
  {
    id: "exit",
    kind: "exit",
    src: `${EXTRACTION_DIR}/exit.mp3`,
    title: "Clean exit",
    script: `That is sufficient.

The record now holds what you named. You will confirm it in writing next. Nothing has been completed. Input has been extracted.

Open your eyes if they were closed. Sit up. We end.`,
  },
  {
    id: "reprompt",
    kind: "reprompt",
    src: `${EXTRACTION_DIR}/reprompt.mp3`,
    title: "Re-prompt",
    script: "No usable answer was recorded. State it again, in concrete terms.",
  },
];

export const EXTRACTION_QUESTIONS = EXTRACTION_SEGMENTS.filter(
  (segment): segment is ExtractionSegment & { questionId: ExtractionQuestionId } =>
    segment.kind === "question" && Boolean(segment.questionId)
);

export function extractionSegment(id: ExtractionClipId): ExtractionSegment {
  const segment = EXTRACTION_SEGMENTS.find((item) => item.id === id);
  if (!segment) throw new Error(`Unknown extraction clip: ${id}`);
  return segment;
}
