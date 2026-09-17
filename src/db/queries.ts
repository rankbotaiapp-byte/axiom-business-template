import type { SQLiteDatabase } from 'expo-sqlite';

import { nowIso } from '../format';
import type {
  CompetingGoal,
  Intake,
  Phase,
  PortfolioEntry,
  PortfolioKind,
  Profile,
  Responsibility,
  Step,
  StepStatus,
  Threshold,
  ThresholdKey,
  Vision,
} from '../types';

type ProfileRow = { id: string; weekly_hours: number; constraints: string; updated_at: string };
type ResponsibilityRow = {
  id: string;
  name: string;
  weekly_hours: number;
  non_negotiable: number;
  created_at: string;
};
type VisionRow = {
  id: string;
  statement: string;
  evidence: string;
  status: Vision['status'];
  phase: Phase;
  plan_locked: number;
  plan_locked_at: string | null;
  route: Vision['route'];
  created_at: string;
  archived_at: string | null;
};
type StepRow = {
  id: string;
  vision_id: string;
  phase: Phase;
  position: number;
  title: string;
  action: string;
  evidence: string;
  hours: number;
  principle: string;
  status: StepStatus;
  created_at: string;
  completed_at: string | null;
  outcome: string | null;
  due_at: string | null;
  activated_at: string | null;
  last_miss_at: string | null;
};
type IntakeRow = {
  omitted_responsibilities: string;
  actual_hours_note: string;
  competing_goals: string;
  completed_at: string;
};
type CompetingGoalRow = {
  id: string;
  name: string;
  weekly_hours: number;
  created_at: string;
};
type PortfolioRow = {
  id: string;
  kind: PortfolioKind;
  vision_id: string | null;
  step_id: string | null;
  title: string;
  body: string;
  created_at: string;
};
type ThresholdRow = { id: string; vision_id: string; key: ThresholdKey; crossed_at: string };

function mapProfile(row: ProfileRow): Profile {
  return {
    weeklyHours: row.weekly_hours,
    constraints: row.constraints,
    updatedAt: row.updated_at,
  };
}

function mapResponsibility(row: ResponsibilityRow): Responsibility {
  return {
    id: row.id,
    name: row.name,
    weeklyHours: row.weekly_hours,
    nonNegotiable: row.non_negotiable === 1,
    createdAt: row.created_at,
  };
}

function mapVision(row: VisionRow): Vision {
  return {
    id: row.id,
    statement: row.statement,
    evidence: row.evidence,
    status: row.status,
    phase: row.phase,
    planLocked: row.plan_locked === 1,
    planLockedAt: row.plan_locked_at,
    route: row.route ?? 'necessary',
    createdAt: row.created_at,
    archivedAt: row.archived_at,
  };
}

function mapStep(row: StepRow): Step {
  return {
    id: row.id,
    visionId: row.vision_id,
    phase: row.phase,
    position: row.position,
    title: row.title,
    action: row.action,
    evidence: row.evidence,
    hours: row.hours,
    principle: row.principle,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    outcome: row.outcome,
    dueAt: row.due_at,
    activatedAt: row.activated_at,
    lastMissAt: row.last_miss_at,
  };
}

function mapPortfolio(row: PortfolioRow): PortfolioEntry {
  return {
    id: row.id,
    kind: row.kind,
    visionId: row.vision_id,
    stepId: row.step_id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function getProfile(db: SQLiteDatabase): Promise<Profile | null> {
  const row = await db.getFirstAsync<ProfileRow>(`SELECT * FROM profile WHERE id = 'default'`);
  return row ? mapProfile(row) : null;
}

export async function upsertProfile(
  db: SQLiteDatabase,
  input: { weeklyHours: number; constraints: string }
): Promise<void> {
  await db.runAsync(
    `INSERT INTO profile (id, weekly_hours, constraints, updated_at)
     VALUES ('default', ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET weekly_hours = excluded.weekly_hours, constraints = excluded.constraints, updated_at = excluded.updated_at`,
    input.weeklyHours,
    input.constraints,
    nowIso()
  );
}

export async function listResponsibilities(db: SQLiteDatabase): Promise<Responsibility[]> {
  const rows = await db.getAllAsync<ResponsibilityRow>(
    `SELECT * FROM responsibilities ORDER BY created_at ASC`
  );
  return rows.map(mapResponsibility);
}

export async function addResponsibility(
  db: SQLiteDatabase,
  input: { id: string; name: string; weeklyHours: number; nonNegotiable: boolean }
): Promise<void> {
  await db.runAsync(
    `INSERT INTO responsibilities (id, name, weekly_hours, non_negotiable, created_at) VALUES (?, ?, ?, ?, ?)`,
    input.id,
    input.name,
    input.weeklyHours,
    input.nonNegotiable ? 1 : 0,
    nowIso()
  );
}

export async function removeResponsibility(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(`DELETE FROM responsibilities WHERE id = ?`, id);
}

export async function getActiveVision(db: SQLiteDatabase): Promise<Vision | null> {
  const row = await db.getFirstAsync<VisionRow>(
    `SELECT * FROM visions WHERE status = 'active' ORDER BY created_at DESC`
  );
  return row ? mapVision(row) : null;
}

export async function getVision(db: SQLiteDatabase, id: string): Promise<Vision | null> {
  const row = await db.getFirstAsync<VisionRow>(`SELECT * FROM visions WHERE id = ?`, id);
  return row ? mapVision(row) : null;
}

export async function createVision(
  db: SQLiteDatabase,
  input: { id: string; statement: string; evidence: string }
): Promise<void> {
  await db.runAsync(
    `INSERT INTO visions (id, statement, evidence, status, phase, plan_locked, plan_locked_at, route, created_at, archived_at)
     VALUES (?, ?, ?, 'active', 'foundation', 0, NULL, 'necessary', ?, NULL)`,
    input.id,
    input.statement,
    input.evidence,
    nowIso()
  );
}

export async function setVisionPhase(db: SQLiteDatabase, id: string, phase: Phase): Promise<void> {
  await db.runAsync(
    `UPDATE visions SET phase = ?, plan_locked = 0, plan_locked_at = NULL WHERE id = ?`,
    phase,
    id
  );
}

export async function setVisionRoute(db: SQLiteDatabase, id: string, route: Vision['route']): Promise<void> {
  await db.runAsync(`UPDATE visions SET route = ? WHERE id = ?`, route, id);
}

export async function lockVision(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(
    `UPDATE visions SET plan_locked = 1, plan_locked_at = ? WHERE id = ?`,
    nowIso(),
    id
  );
}

export async function archiveVision(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(
    `UPDATE visions SET status = 'archived', archived_at = ? WHERE id = ?`,
    nowIso(),
    id
  );
}

export async function listSteps(db: SQLiteDatabase, visionId: string): Promise<Step[]> {
  const rows = await db.getAllAsync<StepRow>(
    `SELECT * FROM steps WHERE vision_id = ? ORDER BY
      CASE phase WHEN 'foundation' THEN 0 ELSE 1 END,
      position ASC`,
    visionId
  );
  return rows.map(mapStep);
}

export async function getStep(db: SQLiteDatabase, id: string): Promise<Step | null> {
  const row = await db.getFirstAsync<StepRow>(`SELECT * FROM steps WHERE id = ?`, id);
  return row ? mapStep(row) : null;
}

export async function insertSteps(
  db: SQLiteDatabase,
  visionId: string,
  generated: Array<{
    phase: Phase;
    title: string;
    action: string;
    evidence: string;
    hours: number;
    principle: string;
  }>,
  ids: string[]
): Promise<void> {
  const existing = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) as n FROM steps WHERE vision_id = ? AND phase = ?`,
    visionId,
    generated[0]?.phase ?? 'foundation'
  );
  if ((existing?.n ?? 0) > 0) return;
  await writeSteps(db, visionId, generated, ids);
}

export async function replacePhaseDraft(
  db: SQLiteDatabase,
  visionId: string,
  generated: Array<{
    phase: Phase;
    title: string;
    action: string;
    evidence: string;
    hours: number;
    principle: string;
  }>,
  ids: string[]
): Promise<void> {
  const phase = generated[0]?.phase ?? 'foundation';
  const complete = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) as n FROM steps WHERE vision_id = ? AND phase = ? AND status = 'complete'`,
    visionId,
    phase
  );
  if ((complete?.n ?? 0) > 0) {
    throw new Error('An alternative cannot replace a sequence that already has evidence.');
  }
  await db.runAsync(`DELETE FROM steps WHERE vision_id = ? AND phase = ?`, visionId, phase);
  await writeSteps(db, visionId, generated, ids);
}

async function writeSteps(
  db: SQLiteDatabase,
  visionId: string,
  generated: Array<{
    phase: Phase;
    title: string;
    action: string;
    evidence: string;
    hours: number;
    principle: string;
  }>,
  ids: string[]
): Promise<void> {
  const createdAt = nowIso();
  for (let i = 0; i < generated.length; i += 1) {
    const step = generated[i];
    await db.runAsync(
      `INSERT INTO steps (id, vision_id, phase, position, title, action, evidence, hours, principle, status, created_at, completed_at, outcome)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NULL, NULL)`,
      ids[i],
      visionId,
      step.phase,
      i + 1,
      step.title,
      step.action,
      step.evidence,
      step.hours,
      step.principle,
      createdAt
    );
  }
}

export async function activateStep(
  db: SQLiteDatabase,
  id: string,
  schedule: { activatedAt: string; dueAt: string }
): Promise<void> {
  await db.runAsync(
    `UPDATE steps SET status = 'active', activated_at = COALESCE(activated_at, ?), due_at = COALESCE(due_at, ?) WHERE id = ? AND status != 'complete'`,
    schedule.activatedAt,
    schedule.dueAt,
    id
  );
}

export async function markMiss(
  db: SQLiteDatabase,
  input: { id: string; missedAt: string; nextDueAt: string }
): Promise<void> {
  await db.runAsync(
    `UPDATE steps SET last_miss_at = ?, due_at = ? WHERE id = ?`,
    input.missedAt,
    input.nextDueAt,
    input.id
  );
}

export async function completeStep(
  db: SQLiteDatabase,
  input: { id: string; outcome: string }
): Promise<void> {
  await db.runAsync(
    `UPDATE steps SET status = 'complete', outcome = ?, completed_at = ? WHERE id = ?`,
    input.outcome,
    nowIso(),
    input.id
  );
}

export async function addPortfolio(
  db: SQLiteDatabase,
  input: {
    id: string;
    kind: PortfolioKind;
    visionId?: string | null;
    stepId?: string | null;
    title: string;
    body: string;
  }
): Promise<void> {
  await db.runAsync(
    `INSERT INTO portfolio (id, kind, vision_id, step_id, title, body, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    input.id,
    input.kind,
    input.visionId ?? null,
    input.stepId ?? null,
    input.title,
    input.body,
    nowIso()
  );
}

export async function listPortfolio(db: SQLiteDatabase, limit = 200): Promise<PortfolioEntry[]> {
  const rows = await db.getAllAsync<PortfolioRow>(
    `SELECT * FROM portfolio ORDER BY created_at DESC LIMIT ?`,
    limit
  );
  return rows.map(mapPortfolio);
}

export async function listPortfolioForVision(
  db: SQLiteDatabase,
  visionId: string
): Promise<PortfolioEntry[]> {
  const rows = await db.getAllAsync<PortfolioRow>(
    `SELECT * FROM portfolio WHERE vision_id = ? ORDER BY created_at DESC`,
    visionId
  );
  return rows.map(mapPortfolio);
}

export async function listThresholds(db: SQLiteDatabase, visionId: string): Promise<Threshold[]> {
  const rows = await db.getAllAsync<ThresholdRow>(
    `SELECT * FROM thresholds WHERE vision_id = ? ORDER BY crossed_at ASC`,
    visionId
  );
  return rows.map((row) => ({
    id: row.id,
    visionId: row.vision_id,
    key: row.key,
    crossedAt: row.crossed_at,
  }));
}

export async function addThreshold(
  db: SQLiteDatabase,
  input: { id: string; visionId: string; key: ThresholdKey }
): Promise<boolean> {
  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM thresholds WHERE vision_id = ? AND key = ?`,
    input.visionId,
    input.key
  );
  if (existing) return false;
  await db.runAsync(
    `INSERT INTO thresholds (id, vision_id, key, crossed_at) VALUES (?, ?, ?, ?)`,
    input.id,
    input.visionId,
    input.key,
    nowIso()
  );
  return true;
}

export async function getSessionFlags(db: SQLiteDatabase): Promise<{
  standardAccepted: boolean;
  beginCompleted: boolean;
}> {
  const row = await db.getFirstAsync<{ standard_accepted: number; begin_completed: number }>(
    `SELECT standard_accepted, begin_completed FROM settings WHERE id = 'default'`
  );
  return {
    standardAccepted: row?.standard_accepted === 1,
    beginCompleted: row?.begin_completed === 1,
  };
}

export async function getStandardAccepted(db: SQLiteDatabase): Promise<boolean> {
  const flags = await getSessionFlags(db);
  return flags.standardAccepted;
}

export async function markBeginCompleted(db: SQLiteDatabase): Promise<void> {
  await db.runAsync(
    `UPDATE settings SET begin_completed = 1 WHERE id = 'default'`
  );
}

export async function acceptStandard(db: SQLiteDatabase): Promise<void> {
  await db.runAsync(
    `INSERT INTO settings (id, standard_accepted, standard_accepted_at)
     VALUES ('default', 1, ?)
     ON CONFLICT(id) DO UPDATE SET standard_accepted = 1, standard_accepted_at = excluded.standard_accepted_at`,
    nowIso()
  );
}

export async function getIntake(db: SQLiteDatabase): Promise<Intake | null> {
  const row = await db.getFirstAsync<IntakeRow>(`SELECT * FROM intake WHERE id = 'default'`);
  if (!row) return null;
  return {
    omittedResponsibilities: row.omitted_responsibilities,
    actualHoursNote: row.actual_hours_note,
    competingGoals: row.competing_goals,
    completedAt: row.completed_at,
  };
}

export async function upsertIntake(
  db: SQLiteDatabase,
  input: { omittedResponsibilities: string; actualHoursNote: string; competingGoals: string }
): Promise<void> {
  await db.runAsync(
    `INSERT INTO intake (id, omitted_responsibilities, actual_hours_note, competing_goals, completed_at)
     VALUES ('default', ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       omitted_responsibilities = excluded.omitted_responsibilities,
       actual_hours_note = excluded.actual_hours_note,
       competing_goals = excluded.competing_goals,
       completed_at = excluded.completed_at`,
    input.omittedResponsibilities,
    input.actualHoursNote,
    input.competingGoals,
    nowIso()
  );
}

export async function listCompetingGoals(db: SQLiteDatabase): Promise<CompetingGoal[]> {
  const rows = await db.getAllAsync<CompetingGoalRow>(
    `SELECT * FROM competing_goals ORDER BY created_at ASC`
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    weeklyHours: row.weekly_hours,
    createdAt: row.created_at,
  }));
}

export async function addCompetingGoal(
  db: SQLiteDatabase,
  input: { id: string; name: string; weeklyHours: number }
): Promise<void> {
  await db.runAsync(
    `INSERT INTO competing_goals (id, name, weekly_hours, created_at) VALUES (?, ?, ?, ?)`,
    input.id,
    input.name,
    input.weeklyHours,
    nowIso()
  );
}

export async function removeCompetingGoal(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(`DELETE FROM competing_goals WHERE id = ?`, id);
}

export async function latestStepEventAt(db: SQLiteDatabase, stepId: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ created_at: string }>(
    `SELECT created_at FROM portfolio WHERE step_id = ? AND kind IN ('action', 'outcome', 'miss') ORDER BY created_at DESC`,
    stepId
  );
  return row?.created_at ?? null;
}
