import { assignEvidenceRefs } from "@/lib/evidence";
import { emptySession } from "@/lib/utils/session";
import type {
  AppState,
  CompetingGoal,
  EvidenceRecord,
  LifePortfolioEntry,
  Plan,
  PlanAction,
  PlanRoute,
  PossibilityTurningPoint,
  Responsibility,
  StrategicConnection,
  StrategicRole,
  UserProfile,
  Vision,
  ZeroStateRecord,
} from "@/types";
import type { Database, Json } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type VisionRow = Database["public"]["Tables"]["visions"]["Row"];
type PlanRow = Database["public"]["Tables"]["plans"]["Row"];
type ActionRow = Database["public"]["Tables"]["plan_actions"]["Row"];
type EvidenceRow = Database["public"]["Tables"]["evidence_records"]["Row"];
type TurningRow = Database["public"]["Tables"]["possibility_turning_points"]["Row"];
type PortfolioRow = Database["public"]["Tables"]["life_portfolio_entries"]["Row"];
type RoleRow = Database["public"]["Tables"]["strategic_roles"]["Row"];
type ConnectionRow = Database["public"]["Tables"]["strategic_connections"]["Row"];

export function profileFromRows(
  row: ProfileRow,
  responsibilities: Responsibility[],
  competingGoals: CompetingGoal[]
): UserProfile {
  return {
    id: row.id,
    capacity: {
      availableHoursPerWeek: Number(row.available_hours_per_week ?? 0),
      energyLevel: row.energy_level ?? "medium",
      notes: row.capacity_notes ?? undefined,
    },
    responsibilities,
    competingGoals,
    constraints: row.constraints ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function visionSnapshotFromJson(value: Json): Vision["contextSnapshot"] {
  const snap =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<Vision["contextSnapshot"]>)
      : {};
  return {
    capacity: snap.capacity ?? { availableHoursPerWeek: 0, energyLevel: "medium" },
    responsibilities: snap.responsibilities ?? [],
    competingGoals: snap.competingGoals ?? [],
    constraints: snap.constraints ?? [],
  };
}

export function normalizeVision(vision: Vision): Vision {
  return {
    ...vision,
    verificationStatus: vision.verificationStatus ?? "internal",
    verificationSummary: vision.verificationSummary ?? undefined,
    contextSnapshot: visionSnapshotFromJson(vision.contextSnapshot as unknown as Json),
  };
}

export function visionFromRow(row: VisionRow): Vision {
  const extra = row as VisionRow & {
    verification_status?: "internal" | "externally_verified";
    verification_summary?: string | null;
  };
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    mediaUrls: row.media_urls.length ? row.media_urls : undefined,
    livingDensity: row.living_density,
    status: row.status,
    verificationStatus: extra.verification_status ?? "internal",
    verificationSummary: extra.verification_summary ?? undefined,
    contextSnapshot: visionSnapshotFromJson(row.context_snapshot),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function actionFromRow(row: ActionRow): PlanAction {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    phase: row.phase,
    order: row.sort_order,
    status: row.status,
    dependencies: row.dependencies,
    estimatedEffort: row.estimated_effort,
  };
}

export function planFromRow(row: PlanRow, actions: PlanAction[]): Plan {
  return {
    id: row.id,
    visionId: row.vision_id,
    phases: row.phases,
    actions: actions.sort((a, b) => a.order - b.order),
    isLocked: row.is_locked,
    lockedAt: row.locked_at ?? undefined,
    capitalizationLocked: row.capitalization_locked,
    capitalizationLockedAt: row.capitalization_locked_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function evidenceFromRow(row: EvidenceRow): EvidenceRecord {
  return {
    id: row.id,
    actionId: row.action_id,
    visionId: row.vision_id,
    payload: {
      type: row.payload_type,
      content: row.payload_content,
    },
    result: row.result_note ?? "",
    grade: row.quality_grade ?? "standard",
    reference: row.evidence_ref ?? "",
    timestamp: row.recorded_at,
  };
}

export function turningPointFromRow(row: TurningRow): PossibilityTurningPoint {
  return {
    id: row.id,
    visionId: row.vision_id,
    triggeringEvidenceIds: row.triggering_evidence_ids,
    declaration: row.declaration,
    createdAt: row.created_at,
  };
}

export function roleFromRow(row: RoleRow): StrategicRole {
  return {
    id: row.id,
    planId: row.plan_id,
    visionId: row.vision_id,
    kind: row.kind,
    title: row.title,
    reason: row.reason,
    order: row.sort_order,
  };
}

export function connectionFromRow(row: ConnectionRow): StrategicConnection {
  return {
    id: row.id,
    roleId: row.role_id,
    planId: row.plan_id,
    visionId: row.vision_id,
    actionId: row.action_id ?? undefined,
    name: row.name,
    context: row.context,
    channel: row.channel,
    draft: row.draft,
    stage: row.stage,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function portfolioFromRow(row: PortfolioRow): LifePortfolioEntry {
  return {
    id: row.id,
    visionId: row.vision_id,
    type: row.type,
    referenceId: row.reference_id,
    timestamp: row.recorded_at,
  };
}

export function zeroStateFromJson(value: Json | null): ZeroStateRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.observed !== "string" || typeof record.completedAt !== "string") return null;
  const extraction =
    record.extraction && typeof record.extraction === "object" && !Array.isArray(record.extraction)
      ? (record.extraction as ZeroStateRecord["extraction"])
      : undefined;
  return {
    regulated: Boolean(record.regulated),
    settleSeconds: Number(record.settleSeconds ?? 0),
    visualizationSeconds: Number(record.visualizationSeconds ?? 0),
    observed: record.observed,
    completedAt: record.completedAt,
    mode: record.mode === "guided" ? "guided" : record.mode === "standard" ? "standard" : undefined,
    extraction,
  };
}

export function assembleState(input: {
  profile: ProfileRow;
  responsibilities: Responsibility[];
  competingGoals: CompetingGoal[];
  visions: VisionRow[];
  plans: PlanRow[];
  actions: ActionRow[];
  evidence: EvidenceRow[];
  turningPoints: TurningRow[];
  portfolio: PortfolioRow[];
  roles?: AppState["roles"];
  connections?: AppState["connections"];
}): AppState {
  const actionsByPlan = new Map<string, PlanAction[]>();
  for (const action of input.actions) {
    const list = actionsByPlan.get(action.plan_id) ?? [];
    list.push(actionFromRow(action));
    actionsByPlan.set(action.plan_id, list);
  }

  const plans = input.plans.map((plan) => planFromRow(plan, actionsByPlan.get(plan.id) ?? []));
  const planRoutes: AppState["planRoutes"] = {};
  for (const plan of input.plans) {
    if (plan.route) planRoutes[plan.id] = plan.route;
  }

  return {
    session: {
      standardAcceptedAt: input.profile.standard_accepted_at,
      zeroStateCompletedAt: input.profile.zero_state_completed_at,
      clarifyingCompletedAt: input.profile.clarifying_completed_at,
    },
    profile: profileFromRows(input.profile, input.responsibilities, input.competingGoals),
    visions: input.visions.map(visionFromRow),
    plans,
    planRoutes,
    evidence: assignEvidenceRefs(input.evidence.map(evidenceFromRow)),
    verifications: [],
    failurePatterns: [],
    turningPoints: input.turningPoints.map(turningPointFromRow),
    portfolio: input.portfolio.map(portfolioFromRow),
    roles: input.roles ?? [],
    connections: input.connections ?? [],
    zeroState: zeroStateFromJson(input.profile.zero_state),
  };
}

export function emptyRemoteState(userId: string, createdAt: string): AppState {
  return {
    session: emptySession(),
    profile: {
      id: userId,
      capacity: { availableHoursPerWeek: 0, energyLevel: "medium" },
      responsibilities: [],
      competingGoals: [],
      constraints: [],
      createdAt,
      updatedAt: createdAt,
    },
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

export function asJson(value: unknown): Json {
  return value as Json;
}

export function toPlanRoute(route: PlanRoute | undefined): PlanRow["route"] {
  return route ?? null;
}
