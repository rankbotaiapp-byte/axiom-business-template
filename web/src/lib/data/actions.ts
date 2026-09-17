"use server";

import { fail, fromUnknown, ok, type ActionResult } from "@/lib/data/errors";
import {
  createPlan,
  createTurningPoint,
  createVision,
  loadWorkspace,
  lockPlanRecord,
  logEvidence,
  persistWorkspace,
  updateLivingDensity,
  updateVision,
  upsertProfile,
  writePortfolio,
} from "@/lib/data/workspace";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  AppState,
  EvidenceRecord,
  LifePortfolioEntry,
  Plan,
  PossibilityTurningPoint,
  UserProfile,
  Vision,
} from "@/types";

function configured<T>(run: () => Promise<T>): Promise<ActionResult<T>> {
  if (!isSupabaseConfigured()) {
    return Promise.resolve(fail("Supabase is not configured."));
  }
  return run()
    .then((data) => ok(data))
    .catch((error: unknown) => fail(fromUnknown(error)));
}

export async function loadWorkspaceAction(): Promise<ActionResult<AppState>> {
  return configured(loadWorkspace);
}

export async function persistWorkspaceAction(state: AppState): Promise<ActionResult<null>> {
  return configured(async () => {
    await persistWorkspace(state);
    return null;
  });
}

export async function upsertProfileAction(
  profile: UserProfile,
  state: AppState
): Promise<ActionResult<null>> {
  return configured(async () => {
    await upsertProfile(profile, state);
    return null;
  });
}

export async function createVisionAction(vision: Vision): Promise<ActionResult<null>> {
  return configured(async () => {
    await createVision(vision);
    return null;
  });
}

export async function updateVisionAction(vision: Vision): Promise<ActionResult<null>> {
  return configured(async () => {
    await updateVision(vision);
    return null;
  });
}

export async function createPlanAction(
  plan: Plan,
  route: AppState["planRoutes"][string] | undefined
): Promise<ActionResult<null>> {
  return configured(async () => {
    await createPlan(plan, route);
    return null;
  });
}

export async function lockPlanAction(plan: Plan, vision: Vision): Promise<ActionResult<null>> {
  return configured(async () => {
    await lockPlanRecord(plan, vision);
    return null;
  });
}

export async function logEvidenceAction(record: EvidenceRecord): Promise<ActionResult<null>> {
  return configured(async () => {
    await logEvidence(record);
    return null;
  });
}

export async function updateLivingDensityAction(
  visionId: string,
  livingDensity: number,
  status: Vision["status"]
): Promise<ActionResult<null>> {
  return configured(async () => {
    await updateLivingDensity(visionId, livingDensity, status);
    return null;
  });
}

export async function writePortfolioAction(entry: LifePortfolioEntry): Promise<ActionResult<null>> {
  return configured(async () => {
    await writePortfolio(entry);
    return null;
  });
}

export async function createTurningPointAction(
  point: PossibilityTurningPoint
): Promise<ActionResult<null>> {
  return configured(async () => {
    await createTurningPoint(point);
    return null;
  });
}

