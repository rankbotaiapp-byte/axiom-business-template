import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { executionPdfInstance } from "../src/lib/portfolio/pdf-document";
import { buildExecutionExport } from "../src/lib/portfolio/record-model";
import { emptyState } from "../src/stores/app-store";
import type { AppState } from "../src/types";

const now = "2026-03-15T12:00:00.000Z";

const state: AppState = {
  ...emptyState(),
  visions: [
    {
      id: "11111111-1111-1111-1111-111111111111",
      userId: "user",
      title: "Signed lease for studio",
      description:
        "The signed lease is on file. The studio keys are in hand. The landlord has the deposit.",
      livingDensity: 84,
      status: "active",
      verificationStatus: "internal",
      contextSnapshot: {
        capacity: { availableHoursPerWeek: 12, energyLevel: "medium" },
        responsibilities: [
          { id: "r1", title: "Client delivery", isNonNegotiable: true, timeDemand: "medium" },
        ],
        competingGoals: [],
        constraints: ["No travel this quarter"],
      },
      createdAt: "2026-01-10T00:00:00.000Z",
      updatedAt: now,
    },
  ],
  plans: [
    {
      id: "p1",
      visionId: "11111111-1111-1111-1111-111111111111",
      phases: ["Establish the proof", "Capitalization"],
      isLocked: true,
      lockedAt: now,
      capitalizationLocked: true,
      createdAt: now,
      updatedAt: now,
      actions: [
        {
          id: "a1",
          title: "Define the first proof",
          description: "Write the inspectable proof.",
          phase: "Establish the proof",
          order: 1,
          status: "completed",
          dependencies: [],
          estimatedEffort: "medium",
        },
        {
          id: "a2",
          title: "Convert the proven method",
          description: "Write the next leverage move.",
          phase: "Capitalization",
          order: 2,
          status: "completed",
          dependencies: ["a1"],
          estimatedEffort: "low",
        },
      ],
    },
  ],
  evidence: [
    {
      id: "e1",
      actionId: "a1",
      visionId: "11111111-1111-1111-1111-111111111111",
      payload: { type: "text", content: "The signed page is on file." },
      result: "The signed page is on file. The invoice was sent.",
      grade: "standard",
      reference: "EV-0001",
      timestamp: "2026-02-01T00:00:00.000Z",
    },
    {
      id: "e2",
      actionId: "a2",
      visionId: "11111111-1111-1111-1111-111111111111",
      payload: { type: "text", content: "The conversion memo is on file." },
      result: "The conversion memo was filed. The next instance is dated.",
      grade: "standard",
      reference: "EV-0002",
      timestamp: "2026-03-01T00:00:00.000Z",
    },
  ],
  turningPoints: [
    {
      id: "t1",
      visionId: "11111111-1111-1111-1111-111111111111",
      triggeringEvidenceIds: ["e1", "e2"],
      declaration:
        "The accumulated evidence indicated that the outcome had moved from theoretical to demonstrably reachable.",
      createdAt: "2026-03-01T00:00:00.000Z",
    },
  ],
};

async function main() {
  const model = buildExecutionExport(state, { detail: "full", generatedAt: new Date(now) });
  if (!model) throw new Error("Model failed.");
  const blob = await executionPdfInstance(model).toBlob();
  const buffer = Buffer.from(await blob.arrayBuffer());
  if (buffer.subarray(0, 4).toString() !== "%PDF") {
    throw new Error("Output is not a PDF.");
  }
  const out = join(process.cwd(), "scripts", "execution-record-smoke.pdf");
  writeFileSync(out, buffer);
  console.log(`wrote ${buffer.length} bytes ${model.filename}`);
}

void main();
