"use client";

import { finalizeProfileDraft, type ClarifyingDraft } from "@/lib/clarifying";
import {
  assessContactDraft,
  assessNomination,
  CONNECTION_PHASE,
  draftFirstContact,
  replaceRolesForPlan,
} from "@/lib/connections";
import { normalizeVision } from "@/lib/data/mappers";
import { assessEvidence, assignEvidenceRefs, nextEvidenceRef, type EvidenceDraft } from "@/lib/evidence";
import {
  canCommitLock,
  capacityContext,
  dependencySatisfied,
  firstRequiredActions,
  generateCapitalization,
  generatePlan,
  hasCapitalizationActions,
  isPrimarySequenceComplete,
  nextRoute,
  primaryActionPool,
  releaseAbandonedFoundation,
  stressTest,
  toPlanningInput,
  type LockStressInput,
} from "@/lib/planning";
import { CAPITALIZATION_PHASE, createTurningPoint, readThreshold } from "@/lib/turning-points";
import { nextLivingDensity } from "@/lib/vision-engine";
import { emptySession } from "@/lib/utils/session";
import { newId, nowIso } from "@/lib/utils/ids";
import type {
  AppState,
  EvidenceRecord,
  LifePortfolioEntry,
  OutcomeVerification,
  Plan,
  PlanRoute,
  PossibilityTurningPoint,
  Session,
  StrategicConnection,
  UserProfile,
  Vision,
  ZeroStateRecord,
} from "@/types";

const KEY = "zpoint.v2";

export function emptyState(): AppState {
  return {
    session: emptySession(),
    profile: null,
    visions: [],
    plans: [],
    planRoutes: {},
    evidence: [],
    verifications: [],
    failurePatterns: [],
    turningPoints: [],
    portfolio: [],
    roles: [],
    connections: [],
    zeroState: null,
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return emptyState();
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return emptyState();
  try {
    const parsed = { ...emptyState(), ...(JSON.parse(raw) as AppState) };
    return {
      ...parsed,
      roles: Array.isArray(parsed.roles) ? parsed.roles : [],
      connections: Array.isArray(parsed.connections) ? parsed.connections : [],
      plans: parsed.plans ?? [],
      planRoutes: parsed.planRoutes ?? {},
      turningPoints: parsed.turningPoints ?? [],
      portfolio: parsed.portfolio ?? [],
      visions: (parsed.visions ?? []).map(normalizeVision),
      evidence: assignEvidenceRefs(parsed.evidence ?? []),
      verifications: Array.isArray(parsed.verifications) ? parsed.verifications : [],
      failurePatterns: Array.isArray(parsed.failurePatterns) ? parsed.failurePatterns : [],
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state: AppState): void {
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

export function acceptStandard(state: AppState): AppState {
  const accepted: Session = {
    ...state.session,
    standardAcceptedAt: nowIso(),
  };
  return { ...state, session: accepted };
}

export function completeZeroState(
  state: AppState,
  input: Omit<ZeroStateRecord, "completedAt">
): AppState {
  const record: ZeroStateRecord = { ...input, completedAt: nowIso() };
  return {
    ...state,
    zeroState: record,
    session: { ...state.session, zeroStateCompletedAt: record.completedAt },
  };
}

export function completeClarifying(state: AppState, draft: ClarifyingDraft): AppState {
  const now = nowIso();
  const finalized = finalizeProfileDraft(draft);
  const profile: UserProfile = {
    id: state.profile?.id ?? newId(),
    capacity: finalized.capacity,
    responsibilities: finalized.responsibilities,
    competingGoals: finalized.competingGoals,
    constraints: finalized.constraints,
    createdAt: state.profile?.createdAt ?? now,
    updatedAt: now,
  };
  return {
    ...state,
    profile,
    session: { ...state.session, clarifyingCompletedAt: now },
  };
}

export function captureVision(
  state: AppState,
  input: { title: string; description: string; mediaUrls: string[] }
): { state: AppState; vision: Vision; plan: Plan } {
  if (!state.profile) {
    throw new Error("Clarifying context is required before vision capture.");
  }
  const now = nowIso();
  const vision: Vision = {
    id: newId(),
    userId: state.profile.id,
    title: input.title.trim(),
    description: input.description.trim(),
    mediaUrls: input.mediaUrls.length ? input.mediaUrls : undefined,
    livingDensity: 0,
    status: "draft",
    verificationStatus: "internal",
    contextSnapshot: {
      capacity: state.profile.capacity,
      responsibilities: state.profile.responsibilities,
      competingGoals: state.profile.competingGoals,
      constraints: state.profile.constraints,
    },
    createdAt: now,
    updatedAt: now,
  };
  const planning = toPlanningInput(vision, state.profile);
  const route = capacityContext(planning).defaultRoute;
  const generated = generatePlan(planning, route);
  const plan: Plan = {
    id: newId(),
    visionId: vision.id,
    phases: generated.phases,
    actions: generated.actions,
    isLocked: false,
    createdAt: now,
    updatedAt: now,
  };
  const entry: LifePortfolioEntry = {
    id: newId(),
    visionId: vision.id,
    type: "vision",
    referenceId: vision.id,
    timestamp: now,
  };
  const next: AppState = {
    ...state,
    visions: [vision, ...state.visions],
    plans: [plan, ...state.plans],
    planRoutes: { ...state.planRoutes, [plan.id]: generated.route },
    portfolio: [entry, ...state.portfolio],
  };
  return {
    state: replaceRolesForPlan(next, plan, vision.title, vision.description),
    vision,
    plan,
  };
}

function outreachAction(plan: Plan, connection: StrategicConnection, roleTitle: string): Plan["actions"][number] {
  const foundation = plan.actions.filter((action) => action.phase !== CAPITALIZATION_PHASE);
  const last = [...foundation].sort((a, b) => a.order - b.order).at(-1);
  return {
    id: newId(),
    title: `First contact: ${connection.name}`,
    description: `Send the first-contact draft to ${connection.name} for the role “${roleTitle}”. Z Point does not send the message. You send it. Record: the message left your control.`,
    phase: CONNECTION_PHASE,
    order: (last?.order ?? 0) + 1,
    status: "pending",
    dependencies: last ? [last.id] : [],
    estimatedEffort: "medium",
  };
}

export function ensureRolesGenerated(state: AppState, planId: string): AppState {
  if (state.roles.some((item) => item.planId === planId)) return state;
  const plan = state.plans.find((item) => item.id === planId);
  const vision = plan ? state.visions.find((item) => item.id === plan.visionId) : undefined;
  if (!plan || !vision || plan.isLocked) return state;
  return replaceRolesForPlan(state, plan, vision.title, vision.description);
}

export function nominateConnection(
  state: AppState,
  input: { roleId: string; name: string; context: string; channel: string }
): AppState {
  const role = state.roles.find((item) => item.id === input.roleId);
  const plan = role ? state.plans.find((item) => item.id === role.planId) : undefined;
  const vision = role ? state.visions.find((item) => item.id === role.visionId) : undefined;
  if (!role || !plan || !vision) return state;
  if (state.connections.some((item) => item.roleId === role.id)) return state;
  if (!assessNomination(input).ok) return state;

  const now = nowIso();
  const connection: StrategicConnection = {
    id: newId(),
    roleId: role.id,
    planId: plan.id,
    visionId: vision.id,
    name: input.name.trim(),
    context: input.context.trim(),
    channel: input.channel.trim(),
    draft: draftFirstContact({ vision, role, connection: { name: input.name.trim(), context: input.context.trim() } }),
    stage: "nominated",
    createdAt: now,
    updatedAt: now,
  };

  let nextPlan = plan;
  if (!plan.isLocked) {
    const action = outreachAction(plan, connection, role.title);
    connection.actionId = action.id;
    nextPlan = {
      ...plan,
      phases: [...new Set([...plan.phases, CONNECTION_PHASE])],
      actions: [...plan.actions, action],
      updatedAt: now,
    };
  }

  return {
    ...state,
    plans: state.plans.map((item) => (item.id === plan.id ? nextPlan : item)),
    connections: [connection, ...state.connections],
    portfolio: [
      {
        id: newId(),
        visionId: vision.id,
        type: "connection",
        referenceId: connection.id,
        timestamp: now,
      },
      ...state.portfolio,
    ],
  };
}

export function saveConnectionDraft(state: AppState, input: { connectionId: string; draft: string }): AppState {
  if (!assessContactDraft(input.draft).ok) return state;
  const now = nowIso();
  return {
    ...state,
    connections: state.connections.map((item) =>
      item.id === input.connectionId
        ? {
            ...item,
            draft: input.draft.trim(),
            stage: item.stage === "nominated" ? "contact_drafted" : item.stage,
            updatedAt: now,
          }
        : item
    ),
  };
}

export function addVerification(
  state: AppState,
  input: {
    visionId: string;
    title: string;
    kind: OutcomeVerification["kind"];
    sourceLabel: string;
    note: string;
    sourceUrl?: string;
    documentName?: string;
    confirmedAt?: string;
    visibility?: OutcomeVerification["visibility"];
  }
): AppState {
  const vision = state.visions.find((item) => item.id === input.visionId);
  if (!vision) return state;
  const now = nowIso();
  const verification: OutcomeVerification = {
    id: newId(),
    visionId: input.visionId,
    title: input.title.trim(),
    kind: input.kind,
    sourceLabel: input.sourceLabel.trim(),
    sourceUrl: input.sourceUrl?.trim() || undefined,
    documentName: input.documentName?.trim() || undefined,
    note: input.note.trim(),
    confirmedAt: input.confirmedAt ?? now,
    createdAt: now,
    visibility: input.visibility ?? "private",
  };
  const verified = {
    ...vision,
    verificationStatus: "externally_verified" as const,
    verificationSummary: verification.title,
    updatedAt: now,
  };
  return {
    ...state,
    verifications: [verification, ...state.verifications],
    visions: state.visions.map((item) => (item.id === vision.id ? verified : item)),
    portfolio: [
      {
        id: newId(),
        visionId: vision.id,
        type: "verification",
        referenceId: verification.id,
        timestamp: now,
      },
      ...state.portfolio,
    ],
  };
}

function replacePlan(state: AppState, planId: string, next: Plan, route: PlanRoute): AppState {
  return {
    ...state,
    plans: state.plans.map((plan) => (plan.id === planId ? next : plan)),
    planRoutes: { ...state.planRoutes, [planId]: route },
  };
}

export function ensurePlanGenerated(state: AppState, planId: string): AppState {
  const plan = state.plans.find((item) => item.id === planId);
  const vision = plan ? state.visions.find((item) => item.id === plan.visionId) : undefined;
  if (!plan || !vision || !state.profile || plan.actions.length > 0) return state;
  const input = toPlanningInput(vision, state.profile);
  const route = capacityContext(input).defaultRoute;
  const generated = generatePlan(input, route);
  const now = nowIso();
  const generatedPlan = {
    ...plan,
    phases: generated.phases,
    actions: generated.actions,
    updatedAt: now,
  };
  return replaceRolesForPlan(replacePlan(state, planId, generatedPlan, generated.route), generatedPlan, vision.title, vision.description);
}

export function requestAlternativeRoute(state: AppState, planId: string, reason: string): AppState {
  const plan = state.plans.find((item) => item.id === planId);
  const vision = plan ? state.visions.find((item) => item.id === plan.visionId) : undefined;
  if (!plan || !vision || !state.profile || plan.isLocked) return state;
  const input = toPlanningInput(vision, state.profile);
  const current = state.planRoutes[planId] ?? capacityContext(input).defaultRoute;
  const route = nextRoute(current, reason);
  const generated = generatePlan(input, route);
  const generatedPlan = {
    ...plan,
    phases: generated.phases,
    actions: generated.actions,
    updatedAt: nowIso(),
  };
  return replaceRolesForPlan(replacePlan(state, planId, generatedPlan, route), generatedPlan, vision.title, vision.description);
}

function attachCapitalization(
  plan: Plan,
  vision: Vision,
  profile: UserProfile,
  now: string
): Plan {
  if (hasCapitalizationActions(plan)) return plan;
  const proven = plan.actions.filter((action) => action.status === "completed").map((action) => action.title);
  const generated = generateCapitalization(toPlanningInput(vision, profile), proven);
  const start = Math.max(0, ...plan.actions.map((action) => action.order));
  const actions = generated.actions.map((action, index) => ({
    ...action,
    order: start + index + 1,
  }));
  return releaseAbandonedFoundation({
    ...plan,
    phases: [...new Set([...plan.phases, CAPITALIZATION_PHASE])],
    actions: [...plan.actions, ...actions],
    capitalizationLocked: false,
    updatedAt: now,
  });
}

export function requestCapitalizationAlternative(state: AppState, planId: string): AppState {
  const plan = state.plans.find((item) => item.id === planId);
  const vision = plan ? state.visions.find((item) => item.id === plan.visionId) : undefined;
  if (!plan || !vision || !state.profile || plan.capitalizationLocked) return state;
  if (!hasCapitalizationActions(plan)) return state;
  const proven = plan.actions.filter((action) => action.status === "completed").map((action) => action.title);
  const generated = generateCapitalization(toPlanningInput(vision, state.profile), proven, true);
  const foundation = plan.actions.filter((action) => action.phase !== CAPITALIZATION_PHASE);
  const start = Math.max(0, ...foundation.map((action) => action.order));
  const actions = generated.actions.map((action, index) => ({
    ...action,
    order: start + index + 1,
  }));
  return {
    ...state,
    plans: state.plans.map((item) =>
      item.id === planId
        ? {
            ...item,
            phases: [...new Set([...foundation.map((action) => action.phase), CAPITALIZATION_PHASE])],
            actions: [...foundation, ...actions],
            updatedAt: nowIso(),
          }
        : item
    ),
  };
}

function stressFor(state: AppState, plan: Plan, actions = plan.actions) {
  if (!state.profile) return null;
  const vision = state.visions.find((item) => item.id === plan.visionId);
  if (!vision) return null;
  const input = toPlanningInput(vision, state.profile);
  const route = state.planRoutes[plan.id] ?? capacityContext(input).defaultRoute;
  return stressTest({ ...plan, actions }, input, route);
}

export function lockCapitalization(state: AppState, planId: string, input?: LockStressInput): AppState {
  const plan = state.plans.find((item) => item.id === planId);
  if (!plan || plan.capitalizationLocked || !hasCapitalizationActions(plan)) return state;
  const capitalization = plan.actions.filter((action) => action.phase === CAPITALIZATION_PHASE);
  const report = stressFor(state, plan, capitalization);
  if (!canCommitLock(report, input)) return state;
  const now = nowIso();
  const firstId = plan.actions
    .filter((action) => action.phase === CAPITALIZATION_PHASE)
    .sort((a, b) => a.order - b.order)[0]?.id;
  return {
    ...state,
    plans: state.plans.map((item) =>
      item.id === planId
        ? {
            ...item,
            capitalizationLocked: true,
            capitalizationLockedAt: now,
            updatedAt: now,
            actions: item.actions.map((action) =>
              action.id === firstId ? { ...action, status: "in_progress" as const } : action
            ),
          }
        : item
    ),
    visions: state.visions.map((vision) =>
      vision.id === plan.visionId && vision.status !== "active"
        ? { ...vision, status: "active" as const, updatedAt: now }
        : vision
    ),
  };
}

export function lockPlan(state: AppState, planId: string, input?: LockStressInput): AppState {
  const plan = state.plans.find((item) => item.id === planId);
  if (!plan || plan.isLocked || plan.actions.length === 0) return state;
  const report = stressFor(state, plan);
  if (!canCommitLock(report, input)) return state;
  const now = nowIso();
  const firstId = [...plan.actions].sort((a, b) => a.order - b.order)[0]?.id;
  const locked: Plan = {
    ...plan,
    isLocked: true,
    lockedAt: now,
    updatedAt: now,
    actions: plan.actions.map((action) =>
      action.id === firstId ? { ...action, status: "in_progress" } : action
    ),
  };
  return {
    ...state,
    plans: state.plans.map((item) => (item.id === planId ? locked : item)),
    visions: state.visions.map((vision) => {
      if (vision.id === plan.visionId) return { ...vision, status: "active" as const, updatedAt: now };
      if (vision.status === "active") return { ...vision, status: "archived" as const, updatedAt: now };
      return vision;
    }),
  };
}

export { primaryPlan, primaryVision, workFor } from "./selectors";

function appendPortfolio(
  state: AppState,
  entries: Omit<LifePortfolioEntry, "id">[]
): AppState {
  return {
    ...state,
    portfolio: [
      ...entries.map((entry) => ({ ...entry, id: newId() })),
      ...state.portfolio,
    ],
  };
}

export function recordEvidence(
  state: AppState,
  input: { actionId: string; draft: EvidenceDraft }
): { state: AppState; evidence: EvidenceRecord | null; turningPoint: PossibilityTurningPoint | null } {
  const quality = assessEvidence(input.draft);
  if (!quality.ok || quality.grade === "insufficient") {
    return { state, evidence: null, turningPoint: null };
  }

  const plan = state.plans.find((item) => item.actions.some((row) => row.id === input.actionId));
  const action = plan?.actions.find((row) => row.id === input.actionId);
  if (!plan?.isLocked || !action) {
    return { state, evidence: null, turningPoint: null };
  }
  if (hasCapitalizationActions(plan) && !plan.capitalizationLocked) {
    return { state, evidence: null, turningPoint: null };
  }
  if (!primaryActionPool(plan).some((item) => item.id === action.id)) {
    return { state, evidence: null, turningPoint: null };
  }
  const done = new Set(plan.actions.filter((item) => item.status === "completed").map((item) => item.id));
  const eligible =
    action.status !== "completed" &&
    action.status !== "skipped" &&
    action.dependencies.every((id) => dependencySatisfied(plan, id, done));
  if (!eligible) {
    return { state, evidence: null, turningPoint: null };
  }

  const now = nowIso();
  const evidence: EvidenceRecord = {
    id: newId(),
    actionId: action.id,
    visionId: plan.visionId,
    payload: {
      type: input.draft.type,
      content: input.draft.content.trim(),
    },
    result: input.draft.result.trim(),
    grade: quality.grade,
    reference: nextEvidenceRef(state.evidence),
    timestamp: now,
  };

  let nextPlan: Plan = {
    ...plan,
    updatedAt: now,
    actions: plan.actions.map((item) =>
      item.id === action.id ? { ...item, status: "completed" as const } : item
    ),
  };

  const withEvidence: AppState = {
    ...state,
    evidence: [evidence, ...state.evidence],
    plans: state.plans.map((item) => (item.id === plan.id ? nextPlan : item)),
  };

  const reading = readThreshold(withEvidence, plan.visionId, nextPlan);
  const turningPoint: PossibilityTurningPoint | null = reading.crossed
    ? createTurningPoint(reading, { id: newId(), createdAt: now })
    : null;

  if (turningPoint && state.profile) {
    const vision = withEvidence.visions.find((item) => item.id === plan.visionId);
    if (vision) {
      nextPlan = attachCapitalization(nextPlan, vision, state.profile, now);
    }
  }

  const nextId = firstRequiredActions(nextPlan)[0]?.id;
  if (nextId) {
    nextPlan = {
      ...nextPlan,
      actions: nextPlan.actions.map((item) =>
        item.id === nextId ? { ...item, status: "in_progress" as const } : item
      ),
    };
  }

  const allDone = isPrimarySequenceComplete(nextPlan);
  const density = nextLivingDensity(
    nextPlan,
    withEvidence.evidence,
    Boolean(turningPoint) || state.turningPoints.some((item) => item.visionId === plan.visionId)
  );

  let next: AppState = {
    ...withEvidence,
    plans: withEvidence.plans.map((item) => (item.id === plan.id ? nextPlan : item)),
    visions: withEvidence.visions.map((vision) =>
      vision.id === plan.visionId
        ? {
            ...vision,
            livingDensity: density,
            status: allDone ? "completed" : vision.status,
            updatedAt: now,
          }
        : vision
    ),
    turningPoints: turningPoint ? [turningPoint, ...withEvidence.turningPoints] : withEvidence.turningPoints,
  };

  const portfolioRows: Omit<LifePortfolioEntry, "id">[] = [
    { visionId: plan.visionId, type: "evidence", referenceId: evidence.id, timestamp: now },
    { visionId: plan.visionId, type: "action", referenceId: action.id, timestamp: now },
  ];
  if (turningPoint) {
    portfolioRows.push({
      visionId: plan.visionId,
      type: "turning_point",
      referenceId: turningPoint.id,
      timestamp: now,
    });
  }
  next = appendPortfolio(next, portfolioRows);
  const linked = state.connections.find((item) => item.actionId === action.id);
  const stage = input.draft.connectionStage;
  if (linked && stage) {
    next = {
      ...next,
      connections: next.connections.map((item) =>
        item.id === linked.id ? { ...item, stage, updatedAt: now } : item
      ),
    };
  }
  return { state: next, evidence, turningPoint };
}
