/**
 * Domain-level walk of the primary Z Point loop.
 * Run: npx --yes tsx scripts/e2e-flow.ts
 */
import { assessDraft, emptyClarifyingDraft, type ClarifyingDraft } from "../src/lib/clarifying";
import { assessNomination } from "../src/lib/connections";
import { assessEvidence, type EvidenceDraft } from "../src/lib/evidence";
import { firstRequiredActions, hasCapitalizationActions, needsCapitalizationReview, stressTest, toPlanningInput } from "../src/lib/planning";
import { firstRoute, isAllowedPath } from "../src/lib/utils/session";
import { assessVisionDraft } from "../src/lib/vision-capture";
import { assessObservation } from "../src/lib/zero-state";
import {
  acceptStandard,
  captureVision,
  completeClarifying,
  completeZeroState,
  emptyState,
  lockCapitalization,
  lockPlan,
  nominateConnection,
  recordEvidence,
  saveConnectionDraft,
} from "../src/stores/app-store";
import { portfolioByVision } from "../src/lib/portfolio";
import type { AppState } from "../src/types";

type Issue = { severity: "blocker" | "major" | "minor"; stage: string; detail: string };

const issues: Issue[] = [];
const log: string[] = [];

function note(stage: string, message: string) {
  log.push(`[${stage}] ${message}`);
}

function issue(severity: Issue["severity"], stage: string, detail: string) {
  issues.push({ severity, stage, detail });
  log.push(`!! ${severity.toUpperCase()} · ${stage}: ${detail}`);
}

function assert(stage: string, condition: boolean, detail: string, severity: Issue["severity"] = "blocker") {
  if (!condition) issue(severity, stage, detail);
}

function standardEvidence(extra = ""): EvidenceDraft {
  return {
    type: "text",
    content: `The signed page is on file with the landlord. The invoice was sent to the client.${extra}`,
    result: "The signed page is on file. The invoice was sent. The desk is clear.",
  };
}

function dump(label: string, value: unknown) {
  log.push(`${label}: ${JSON.stringify(value, null, 2)}`);
}

function clarifyingDraft(): ClarifyingDraft {
  const draft = emptyClarifyingDraft();
  draft.responsibilities = [
    { id: "r1", title: "Client delivery", isNonNegotiable: true, timeDemand: "medium" },
  ];
  draft.competingGoals = [];
  draft.noCompetingGoals = true;
  draft.capacity = { availableHoursPerWeek: 12, energyLevel: "medium" };
  draft.constraints = ["No travel this quarter"];
  draft.noHardConstraints = false;
  return draft;
}

function walk() {
  let state = emptyState();

  // 1. Onboarding / session gates
  assert("onboarding", isAllowedPath(state, "/onboarding"), "Empty session must allow screen 1");
  assert("onboarding", isAllowedPath(state, "/onboarding/purpose"), "Empty session must allow screen 2");
  assert("onboarding", isAllowedPath(state, "/onboarding/standard"), "Empty session must allow screen 3");
  assert("onboarding", !isAllowedPath(state, "/onboarding/zero-state"), "Zero State must be gated until standard is accepted");
  assert("onboarding", firstRoute(state) === "/onboarding", "firstRoute before standard is /onboarding");

  state = acceptStandard(state);
  assert("onboarding", Boolean(state.session.standardAcceptedAt), "standardAcceptedAt must persist");
  assert("onboarding", firstRoute(state) === "/onboarding/zero-state", "After standard, firstRoute is Zero State");
  assert("onboarding", isAllowedPath(state, "/onboarding/zero-state"), "Zero State allowed after standard");
  assert("onboarding", isAllowedPath(state, "/onboarding/ready"), "Legacy ready route still allowed");
  assert(
    "onboarding",
    !isAllowedPath(state, "/onboarding") && !isAllowedPath(state, "/onboarding/purpose") && !isAllowedPath(state, "/onboarding/standard"),
    "Screens 1–3 must close after the standard is accepted"
  );

  // 2. Zero State
  const observation = "The desk lamp is on. The signed page sits on the table. The calendar hold is visible on the screen.";
  assert("zero-state", assessObservation(observation).ok, "Canonical observation must pass quality");
  assert("zero-state", !assessObservation("I felt aligned and inspired").ok, "Vague observation must fail");
  state = completeZeroState(state, {
    regulated: true,
    settleSeconds: 90,
    visualizationSeconds: 90,
    observed: observation,
  });
  assert("zero-state", Boolean(state.session.zeroStateCompletedAt), "zeroStateCompletedAt must persist");
  assert("zero-state", state.zeroState?.observed === observation, "Observation must be stored");
  assert("zero-state", firstRoute(state) === "/onboarding/clarifying", "Next route is clarifying");
  assert("zero-state", !isAllowedPath(state, "/onboarding/zero-state"), "Zero State closes after completion");

  // 3. Clarifying
  const draft = clarifyingDraft();
  assert("clarifying", assessDraft(draft).ok, `Clarifying draft must pass: ${assessDraft(draft).notes.join("; ")}`);
  state = completeClarifying(state, draft);
  assert("clarifying", Boolean(state.profile), "Profile must exist after clarifying");
  assert("clarifying", state.profile?.capacity.availableHoursPerWeek === 12, "Hours must persist");
  assert("clarifying", state.profile?.constraints.includes("No travel this quarter") ?? false, "Constraints must persist");
  assert("clarifying", state.profile?.competingGoals.length === 0, "No competing goals must persist as empty");
  assert("clarifying", firstRoute(state) === "/onboarding/vision", "Next route is vision capture");

  // 4. Vision capture + plan generation
  const visionDraft = {
    title: "Signed lease for studio",
    description:
      "The signed lease is on file. The studio keys are in hand. The landlord has the deposit. A third party can walk the space on the first of the month.",
    mediaUrls: [] as string[],
  };
  assert("vision", assessVisionDraft(visionDraft).ok, `Vision draft must pass: ${assessVisionDraft(visionDraft).notes.join("; ")}`);
  const captured = captureVision(state, visionDraft);
  state = captured.state;
  const vision = captured.vision;
  const planId = captured.plan.id;
  assert("vision", state.visions.length === 1, "Vision must be stored");
  assert("vision", vision.livingDensity === 0, "Density starts at 0");
  assert("vision", vision.status === "draft", "Vision starts as draft");
  assert("vision", vision.contextSnapshot.constraints.includes("No travel this quarter"), "Context snapshot must include constraints");
  assert("plan", captured.plan.actions.length >= 3, "Generated plan must have a sequence");
  assert("plan", Boolean(state.planRoutes[planId]), "Route must be stored");
  assert("connections", state.roles.length >= 1, "Strategic roles must be generated at capture");
  assert("routing", firstRoute(state) === "/", "After capture, firstRoute is operations");
  assert("routing", isAllowedPath(state, `/plan/${planId}`), "Plan route is allowed after capture");
  assert("routing", isAllowedPath(state, `/vision/${vision.id}`), "Vision route is allowed after capture");
  assert("routing", !isAllowedPath(state, "/onboarding/vision"), "Vision capture closes after a vision exists");

  // 5. Strategic connection nomination (unlocked)
  const role = state.roles[0];
  const nomination = { roleId: role.id, name: "Jordan Hale", context: "Landlord who already walked the space with me last month", channel: "Email" };
  assert("connections", assessNomination(nomination).ok, `Nomination must pass: ${assessNomination(nomination).notes.join("; ")}`);
  state = nominateConnection(state, nomination);
  const connection = state.connections[0];
  assert("connections", Boolean(connection), "Nomination must persist");
  assert("connections", Boolean(connection?.actionId), "Unlocked nomination must add an outreach action");
  assert("connections", Boolean(connection?.draft), "First-contact draft must be generated");
  const outreach = captured.plan.actions.length + 1;
  const afterNom = state.plans.find((item) => item.id === planId);
  assert("connections", (afterNom?.actions.length ?? 0) >= outreach, "Outreach action must be on the plan");
  if (connection) {
    state = saveConnectionDraft(state, {
      connectionId: connection.id,
      draft: connection.draft,
    });
    assert("connections", state.connections[0].stage === "contact_drafted" || state.connections[0].stage === "nominated", "Draft save should advance or keep a valid stage");
  }

  // 6. Constraint stress test + lock
  let plan = state.plans.find((item) => item.id === planId)!;
  const input = toPlanningInput(vision, state.profile!);
  const route = state.planRoutes[planId];
  const report = stressTest(plan, input, route);
  note("stress", report.reading);
  note("stress", `severity=${report.severity} findings=${report.findings.map((item) => item.id).join(",")}`);
  const refused = lockPlan(state, planId);
  if (report.findings.length > 0) {
    assert("lock", refused.plans[0].isLocked === false, "Lock without acknowledgment must be refused when findings exist");
  }
  if (report.severity === "misaligned") {
    const half = lockPlan(state, planId, { acknowledged: true });
    assert("lock", half.plans[0].isLocked === false, "Misaligned lock without override must be refused");
  }
  state = lockPlan(state, planId, {
    acknowledged: report.findings.length === 0 || true,
    acceptMisalignment: report.severity === "misaligned",
  });
  plan = state.plans.find((item) => item.id === planId)!;
  assert("lock", plan.isLocked, "Plan must lock with proper stress acknowledgment");
  assert("lock", state.visions[0].status === "active", "Vision becomes active on lock");
  assert("lock", plan.actions.some((item) => item.status === "in_progress"), "First action must move to in_progress");

  // 7. Evidence + living vision + TP
  const required0 = firstRequiredActions(plan);
  assert("evidence", required0.length > 0, "A required action must exist after lock");
  const firstId = required0[0]?.id;
  const firstResult = recordEvidence(state, { actionId: firstId!, draft: standardEvidence(" First action.") });
  assert("evidence", Boolean(firstResult.evidence), "First standard evidence must record");
  assert("evidence", firstResult.evidence?.reference === "EV-0001", "First evidence reference is EV-0001");
  assert("evidence", firstResult.evidence?.grade === "standard" || firstResult.evidence?.grade === "strong", "Grade must meet standard");
  assert("evidence", !firstResult.turningPoint, "Turning point must not fire after one record");
  state = firstResult.state;
  const density1 = state.visions[0].livingDensity;
  assert("living-vision", density1 > 0, "Density must rise after first evidence");

  const required1 = firstRequiredActions(state.plans[0]);
  assert("evidence", required1.length > 0, "Second required action must exist");
  const second = recordEvidence(state, { actionId: required1[0].id, draft: standardEvidence(" Second action.") });
  assert("turning-point", Boolean(second.turningPoint), "Turning point must declare after two standard records");
  state = second.state;
  plan = state.plans[0];
  assert("turning-point", state.turningPoints.length === 1, "Turning point must persist");
  assert("capitalization", hasCapitalizationActions(plan), "Capitalization actions must attach at threshold");
  assert("capitalization", needsCapitalizationReview(plan), "Plan must enter capitalization review");
  assert("living-vision", state.visions[0].livingDensity >= 80, "Density should reach the threshold band");
  assert("portfolio", state.portfolio.some((item) => item.type === "turning_point"), "Turning point must enter the vault");

  const midFoundation = recordEvidence(state, {
    actionId: plan.actions.find((item) => item.status === "in_progress" && item.phase !== "Capitalization")?.id ?? "missing",
    draft: standardEvidence(" Should be blocked."),
  });
  assert(
    "capitalization",
    midFoundation.evidence === null,
    "Foundation evidence must be refused while capitalization is unlocked (phase gate)"
  );

  const requiredDuringReview = firstRequiredActions(plan);
  assert(
    "capitalization",
    requiredDuringReview.length === 0,
    "Required-now must be empty during capitalization review"
  );

  // 8. Capitalization lock
  const capActions = plan.actions.filter((item) => item.phase === "Capitalization");
  const capReport = stressTest({ ...plan, actions: capActions }, input, route);
  note("cap-stress", `${capReport.severity} ${capReport.reading}`);
  state = lockCapitalization(state, planId, {
    acknowledged: capReport.findings.length === 0 || true,
    acceptMisalignment: capReport.severity === "misaligned",
  });
  plan = state.plans[0];
  assert("capitalization", plan.capitalizationLocked === true, "Capitalization must lock");
  const requiredCap = firstRequiredActions(plan);
  assert("capitalization", requiredCap.length > 0, "A capitalization action must become required after lock");
  assert(
    "capitalization",
    requiredCap[0]?.phase === "Capitalization",
    "First required action after lock should be capitalization"
  );

  // 9. Execute capitalization
  let guard = 0;
  while (guard++ < 12) {
    const required = firstRequiredActions(state.plans[0]);
    const next = required.find((item) => item.phase === "Capitalization");
    if (!next) break;
    const result = recordEvidence(state, { actionId: next.id, draft: standardEvidence(` Cap ${guard}.`) });
    if (!result.evidence) {
      issue("blocker", "capitalization", `Failed to record capitalization action "${next.title}"`);
      break;
    }
    state = result.state;
  }
  plan = state.plans[0];
  const capLeft = plan.actions.filter((item) => item.phase === "Capitalization" && item.status !== "completed");
  assert("capitalization", capLeft.length === 0, "All capitalization actions must complete");

  // 10. Outreach after capitalization
  const outreachAction = plan.actions.find((item) => item.phase === "Strategic connection");
  const requiredAfterCap = firstRequiredActions(plan);
  const outreachRequired = requiredAfterCap.some((item) => item.id === outreachAction?.id);
  if (outreachAction) {
    if (!outreachRequired) {
      issue(
        "blocker",
        "connections",
        `Outreach action "${outreachAction.title}" depends on ${JSON.stringify(outreachAction.dependencies)} and is not required after capitalization. leftover foundation=${plan.actions.filter((a) => a.phase !== "Capitalization" && a.phase !== "Strategic connection" && a.status !== "completed").length}`
      );
    }
    const outreachResult = recordEvidence(state, {
      actionId: outreachAction.id,
      draft: {
        ...standardEvidence(" Message sent."),
        connectionStage: "contact_sent",
      },
    });
    if (!outreachResult.evidence) {
      issue(
        "blocker",
        "connections",
        "recordEvidence refuses Strategic connection actions after capitalization is attached"
      );
    } else {
      state = outreachResult.state;
      assert("connections", state.connections[0].stage === "contact_sent", "Connection stage must update from evidence");
    }
  }

  // 11. Completion + vault
  plan = state.plans[0];
  const leftoverOpen = plan.actions.filter(
    (item) => item.status !== "completed" && item.status !== "skipped"
  );
  const released = plan.actions.filter((item) => item.status === "skipped");
  assert("completion", released.length > 0, "Unfinished foundation must be released after the threshold");
  const visionStatus = state.visions[0].status;
  if (leftoverOpen.length > 0) {
    issue(
      "blocker",
      "completion",
      `Primary path finished but ${leftoverOpen.length} action(s) remain open: ${leftoverOpen.map((a) => `${a.phase}:${a.title}:${a.status}`).join(" | ")}`
    );
  }
  if (visionStatus !== "completed") {
    issue(
      "blocker",
      "completion",
      `Vision status is "${visionStatus}" after the primary path finished. leftover=${leftoverOpen.length}`
    );
  }

  const groups = portfolioByVision(state);
  assert("portfolio", groups.length === 1, "Vault groups the vision");
  assert("portfolio", state.portfolio.some((item) => item.type === "vision"), "Vision entry in vault");
  assert("portfolio", state.portfolio.some((item) => item.type === "evidence"), "Evidence entries in vault");
  assert("portfolio", state.portfolio.some((item) => item.type === "connection"), "Connection entry in vault");
  assert("portfolio", state.evidence.every((item) => /^EV-\d{4}$/.test(item.reference ?? "")), "Every evidence record has a reference");

  // 12. Round-trip shape
  const serialized = JSON.parse(JSON.stringify(state)) as AppState;
  assert("persistence", Array.isArray(serialized.roles), "roles survive serialize");
  assert("persistence", Array.isArray(serialized.connections), "connections survive serialize");
  assert("persistence", serialized.visions[0].contextSnapshot.constraints.length > 0, "constraints survive serialize");

  dump("final-vision", {
    status: state.visions[0].status,
    density: state.visions[0].livingDensity,
    turningPoints: state.turningPoints.length,
    evidence: state.evidence.length,
    actions: state.plans[0].actions.map((a) => ({ title: a.title, phase: a.phase, status: a.status })),
    requiredNow: firstRequiredActions(state.plans[0]).map((a) => a.title),
  });
}

walk();

console.log(log.join("\n"));
console.log("\n--- ISSUE SUMMARY ---");
if (issues.length === 0) {
  console.log("None.");
} else {
  for (const item of issues) {
    console.log(`${item.severity}\t${item.stage}\t${item.detail}`);
  }
}
console.log(`\n${issues.length} issue(s). blockers=${issues.filter((i) => i.severity === "blocker").length}`);
process.exit(issues.some((i) => i.severity === "blocker") ? 1 : 0);
