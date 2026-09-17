import type { PlanningInput } from "@/types";

export type OutcomeClass = "offer" | "artifact" | "body" | "capital" | "role" | "system" | "general";

export function classifyOutcome(input: Pick<PlanningInput, "title" | "description">): OutcomeClass {
  const text = `${input.title} ${input.description}`;
  if (/\b(client|customer|pay|paid|offer|sell|invoice|pricing|advisory)\b/i.test(text)) return "offer";
  if (/\b(publish|write|book|essay|article|site|page|draft|manuscript)\b/i.test(text)) return "artifact";
  if (/\b(train|health|weight|sleep|rehab|body|recover|therapy)\b/i.test(text)) return "body";
  if (/\b(save|debt|earn|revenue|money|capital|invoice)\b/i.test(text)) return "capital";
  if (/\b(hire|role|job|employ|relocate|move|notice)\b/i.test(text)) return "role";
  if (/\b(system|process|install|replace|automate|pipeline)\b/i.test(text)) return "system";
  return "general";
}

export const SIMILAR: Record<OutcomeClass, { proof: string; research: string; artifact: string }> = {
  offer: {
    proof: "A priced offer exists in the world and one real person has been asked to buy or book it.",
    research:
      "Similar commercial outcomes require a specific offer, first market contact, and a recorded yes or no. Private planning does not close.",
    artifact: "Put a priced offer in front of one real person and record the response.",
  },
  artifact: {
    proof: "A complete piece exists where a third party can inspect it.",
    research:
      "Similar publishing outcomes require a finished artifact in the world. Notes and outlines are not the work.",
    artifact: "Produce the smallest complete public draft and place it where it can be seen.",
  },
  body: {
    proof: "One prescribed session is completed and the metric is recorded.",
    research:
      "Similar physical outcomes require repeated load under constraint, not a new program. The first session is the proof.",
    artifact: "Complete one prescribed session and record the metric named in the vision.",
  },
  capital: {
    proof: "One real money movement has occurred toward the stated evidence.",
    research:
      "Similar capital outcomes require a transaction: send, file, collect, or cut. A revised budget is not the result.",
    artifact: "Execute one money movement that a third party could verify.",
  },
  role: {
    proof: "One decision has left your head: sent, held, filed, or delivered.",
    research:
      "Similar role and move outcomes require a decision in the world. Preparation without contact does not change position.",
    artifact: "Make one external move: send, schedule, file, or hold the conversation.",
  },
  system: {
    proof: "The system has carried real work once, not only existed as a diagram.",
    research:
      "Similar system outcomes require the process to carry load. Documentation without a run is not a system.",
    artifact: "Run the system once on real work and record what it carried.",
  },
  general: {
    proof: "The smallest complete artifact that would count toward the stated outcome exists.",
    research:
      "Similar outcomes require a first visible proof, an honest capacity tradeoff, repetition under load, and a method that survives contact with responsibilities.",
    artifact: "Produce the smallest complete artifact that would count toward the stated outcome.",
  },
};
