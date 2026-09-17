import { assembleState, asJson, connectionFromRow, emptyRemoteState, roleFromRow, toPlanRoute } from "@/lib/data/mappers";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";
import type { PostgrestError } from "@supabase/supabase-js";
import type {
  AppState,
  EvidenceRecord,
  LifePortfolioEntry,
  Plan,
  PossibilityTurningPoint,
  UserProfile,
  Vision,
} from "@/types";

function ignoreDuplicate(error: PostgrestError | null): void {
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function requireUserId(): Promise<string> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Sign-in is required.");
  return user.id;
}

export async function getInitialWorkspace(): Promise<{ userId: string; state: AppState } | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return { userId: user.id, state: await loadWorkspace() };
  } catch {
    return null;
  }
}

export async function loadWorkspace(): Promise<AppState> {
  const supabase = await createServerSupabase();
  const userId = await requireUserId();

  const [
    profileRes,
    responsibilitiesRes,
    goalsRes,
    visionsRes,
    plansRes,
    actionsRes,
    evidenceRes,
    turningRes,
    portfolioRes,
    rolesRes,
    connectionsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("responsibilities").select("*").eq("user_id", userId),
    supabase.from("competing_goals").select("*").eq("user_id", userId),
    supabase.from("visions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("plans").select("*").eq("user_id", userId),
    supabase.from("plan_actions").select("*").eq("user_id", userId),
    supabase.from("evidence_records").select("*").eq("user_id", userId).order("recorded_at", { ascending: false }),
    supabase.from("possibility_turning_points").select("*").eq("user_id", userId),
    supabase.from("life_portfolio_entries").select("*").eq("user_id", userId).order("recorded_at", { ascending: false }),
    supabase.from("strategic_roles").select("*").eq("user_id", userId),
    supabase.from("strategic_connections").select("*").eq("user_id", userId),
  ]);

  const firstError =
    profileRes.error ??
    responsibilitiesRes.error ??
    goalsRes.error ??
    visionsRes.error ??
    plansRes.error ??
    actionsRes.error ??
    evidenceRes.error ??
    turningRes.error ??
    portfolioRes.error;
  if (firstError) throw new Error(firstError.message);

  const now = new Date().toISOString();
  if (!profileRes.data) return emptyRemoteState(userId, now);

  return assembleState({
    profile: profileRes.data,
    responsibilities: (responsibilitiesRes.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      isNonNegotiable: row.is_non_negotiable,
      timeDemand: row.time_demand,
    })),
    competingGoals: (goalsRes.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      priority: row.priority,
    })),
    visions: visionsRes.data ?? [],
    plans: plansRes.data ?? [],
    actions: actionsRes.data ?? [],
    evidence: evidenceRes.data ?? [],
    turningPoints: turningRes.data ?? [],
    portfolio: portfolioRes.data ?? [],
    roles: rolesRes.error ? [] : (rolesRes.data ?? []).map(roleFromRow),
    connections: connectionsRes.error ? [] : (connectionsRes.data ?? []).map(connectionFromRow),
  });
}

export async function upsertProfile(profile: UserProfile, state: AppState): Promise<void> {
  const supabase = await createServerSupabase();
  const userId = await requireUserId();
  const now = new Date().toISOString();

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    available_hours_per_week: profile.capacity.availableHoursPerWeek,
    energy_level: profile.capacity.energyLevel,
    capacity_notes: profile.capacity.notes ?? null,
    constraints: profile.constraints,
    standard_accepted_at: state.session.standardAcceptedAt,
    zero_state_completed_at: state.session.zeroStateCompletedAt,
    clarifying_completed_at: state.session.clarifyingCompletedAt,
    zero_state: state.zeroState ? asJson(state.zeroState) : null,
    updated_at: now,
  });
  if (profileError) throw new Error(profileError.message);

  const { error: deleteResp } = await supabase.from("responsibilities").delete().eq("user_id", userId);
  if (deleteResp) throw new Error(deleteResp.message);
  if (profile.responsibilities.length) {
    const { error } = await supabase.from("responsibilities").insert(
      profile.responsibilities.map((item) => ({
        id: item.id,
        user_id: userId,
        title: item.title,
        is_non_negotiable: item.isNonNegotiable,
        time_demand: item.timeDemand,
      }))
    );
    if (error) throw new Error(error.message);
  }

  const { error: deleteGoals } = await supabase.from("competing_goals").delete().eq("user_id", userId);
  if (deleteGoals) throw new Error(deleteGoals.message);
  if (profile.competingGoals.length) {
    const { error } = await supabase.from("competing_goals").insert(
      profile.competingGoals.map((item) => ({
        id: item.id,
        user_id: userId,
        title: item.title,
        priority: item.priority,
      }))
    );
    if (error) throw new Error(error.message);
  }
}

export async function createVision(vision: Vision): Promise<void> {
  const supabase = await createServerSupabase();
  const userId = await requireUserId();
  const { error } = await supabase.from("visions").upsert({
    id: vision.id,
    user_id: userId,
    title: vision.title,
    description: vision.description,
    media_urls: vision.mediaUrls ?? [],
    living_density: vision.livingDensity,
    status: vision.status,
    context_snapshot: asJson(vision.contextSnapshot),
    created_at: vision.createdAt,
    updated_at: vision.updatedAt,
  });
  if (error) throw new Error(error.message);
}

export async function updateVision(vision: Vision): Promise<void> {
  const supabase = await createServerSupabase();
  const userId = await requireUserId();
  const { error } = await supabase
    .from("visions")
    .update({
      title: vision.title,
      description: vision.description,
      media_urls: vision.mediaUrls ?? [],
      living_density: vision.livingDensity,
      status: vision.status,
      context_snapshot: asJson(vision.contextSnapshot),
      updated_at: vision.updatedAt,
    })
    .eq("id", vision.id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function updateLivingDensity(visionId: string, livingDensity: number, status: Vision["status"]): Promise<void> {
  const supabase = await createServerSupabase();
  const userId = await requireUserId();
  const { error } = await supabase
    .from("visions")
    .update({ living_density: livingDensity, status, updated_at: new Date().toISOString() })
    .eq("id", visionId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function createPlan(plan: Plan, route: AppState["planRoutes"][string] | undefined): Promise<void> {
  const supabase = await createServerSupabase();
  const userId = await requireUserId();
  const { error: planError } = await supabase.from("plans").upsert({
    id: plan.id,
    user_id: userId,
    vision_id: plan.visionId,
    phases: plan.phases,
    route: toPlanRoute(route),
    is_locked: plan.isLocked,
    locked_at: plan.lockedAt ?? null,
    capitalization_locked: plan.capitalizationLocked ?? false,
    capitalization_locked_at: plan.capitalizationLockedAt ?? null,
    created_at: plan.createdAt,
    updated_at: plan.updatedAt,
  });
  if (planError) throw new Error(planError.message);

  const actionRows = plan.actions.map((action) => ({
    id: action.id,
    user_id: userId,
    plan_id: plan.id,
    title: action.title,
    description: action.description,
    phase: action.phase,
    sort_order: action.order,
    status: action.status,
    dependencies: action.dependencies,
    estimated_effort: action.estimatedEffort,
  }));

  if (!plan.isLocked) {
    const { error: deleteError } = await supabase
      .from("plan_actions")
      .delete()
      .eq("plan_id", plan.id)
      .eq("user_id", userId);
    if (deleteError) throw new Error(deleteError.message);
    if (actionRows.length) {
      const { error } = await supabase.from("plan_actions").insert(actionRows);
      if (error) throw new Error(error.message);
    }
    return;
  }

  if (actionRows.length) {
    const { error } = await supabase.from("plan_actions").upsert(actionRows);
    if (error) throw new Error(error.message);
  }
}

export async function lockPlanRecord(plan: Plan, vision: Vision): Promise<void> {
  const supabase = await createServerSupabase();
  const userId = await requireUserId();
  const { error: planError } = await supabase
    .from("plans")
    .update({
      is_locked: true,
      locked_at: plan.lockedAt ?? new Date().toISOString(),
      capitalization_locked: plan.capitalizationLocked ?? false,
      capitalization_locked_at: plan.capitalizationLockedAt ?? null,
      updated_at: plan.updatedAt,
    })
    .eq("id", plan.id)
    .eq("user_id", userId);
  if (planError) throw new Error(planError.message);

  const { error: actionError } = await supabase.from("plan_actions").upsert(
    plan.actions.map((action) => ({
      id: action.id,
      user_id: userId,
      plan_id: plan.id,
      title: action.title,
      description: action.description,
      phase: action.phase,
      sort_order: action.order,
      status: action.status,
      dependencies: action.dependencies,
      estimated_effort: action.estimatedEffort,
    }))
  );
  if (actionError) throw new Error(actionError.message);

  const { error: visionError } = await supabase
    .from("visions")
    .update({ status: vision.status, updated_at: vision.updatedAt })
    .eq("id", vision.id)
    .eq("user_id", userId);
  if (visionError) throw new Error(visionError.message);
}

export async function logEvidence(record: EvidenceRecord): Promise<void> {
  const supabase = await createServerSupabase();
  const userId = await requireUserId();
  const { error } = await supabase.from("evidence_records").insert({
    id: record.id,
    user_id: userId,
    action_id: record.actionId,
    vision_id: record.visionId,
    payload_type: record.payload.type,
    payload_content: record.payload.content,
    result_note: record.result ?? "",
    quality_grade:
      record.grade === "strong" ? "strong" : record.grade === "weak" || record.grade === "insufficient" ? "weak" : "standard",
    evidence_ref: record.reference,
    recorded_at: record.timestamp,
  });
  ignoreDuplicate(error);
}

export async function writePortfolio(entry: LifePortfolioEntry): Promise<void> {
  const supabase = await createServerSupabase();
  const userId = await requireUserId();
  const { error } = await supabase.from("life_portfolio_entries").insert({
    id: entry.id,
    user_id: userId,
    vision_id: entry.visionId,
    type: entry.type as "vision" | "action" | "evidence" | "turning_point" | "connection",
    reference_id: entry.referenceId,
    recorded_at: entry.timestamp,
  });
  ignoreDuplicate(error);
}

export async function createTurningPoint(point: PossibilityTurningPoint): Promise<void> {
  const supabase = await createServerSupabase();
  const userId = await requireUserId();
  const { error } = await supabase.from("possibility_turning_points").insert({
    id: point.id,
    user_id: userId,
    vision_id: point.visionId,
    triggering_evidence_ids: point.triggeringEvidenceIds,
    declaration: point.declaration,
    created_at: point.createdAt,
  });
  ignoreDuplicate(error);
}

export async function persistWorkspace(state: AppState): Promise<void> {
  const userId = await requireUserId();
  if (state.profile) {
    await upsertProfile({ ...state.profile, id: userId }, state);
  } else {
    await upsertProfile(
      {
        id: userId,
        capacity: { availableHoursPerWeek: 0, energyLevel: "medium" },
        responsibilities: [],
        competingGoals: [],
        constraints: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      state
    );
  }

  for (const vision of state.visions) {
    await createVision({ ...vision, userId });
  }
  for (const plan of state.plans) {
    await createPlan(plan, state.planRoutes[plan.id]);
  }
  for (const record of state.evidence) {
    await logEvidence(record);
  }
  for (const point of state.turningPoints) {
    await createTurningPoint(point);
  }
  for (const entry of state.portfolio) {
    await writePortfolio(entry);
  }
  await persistStrategicAssets(state);
}

async function persistStrategicAssets(state: AppState): Promise<void> {
  const supabase = await createServerSupabase();
  const userId = await requireUserId();
  const { error: deleteConnections } = await supabase.from("strategic_connections").delete().eq("user_id", userId);
  if (deleteConnections) {
    if (deleteConnections.code === "42P01") return;
    throw new Error(deleteConnections.message);
  }
  const { error: deleteRoles } = await supabase.from("strategic_roles").delete().eq("user_id", userId);
  if (deleteRoles) throw new Error(deleteRoles.message);
  if (state.roles.length) {
    const { error } = await supabase.from("strategic_roles").insert(
      state.roles.map((role) => ({
        id: role.id,
        user_id: userId,
        plan_id: role.planId,
        vision_id: role.visionId,
        kind: role.kind,
        title: role.title,
        reason: role.reason,
        sort_order: role.order,
      }))
    );
    if (error) throw new Error(error.message);
  }
  if (state.connections.length) {
    const { error } = await supabase.from("strategic_connections").insert(
      state.connections.map((connection) => ({
        id: connection.id,
        user_id: userId,
        role_id: connection.roleId,
        plan_id: connection.planId,
        vision_id: connection.visionId,
        action_id: connection.actionId ?? null,
        name: connection.name,
        context: connection.context,
        channel: connection.channel,
        draft: connection.draft,
        stage: connection.stage,
        created_at: connection.createdAt,
        updated_at: connection.updatedAt,
      }))
    );
    if (error) throw new Error(error.message);
  }
}
