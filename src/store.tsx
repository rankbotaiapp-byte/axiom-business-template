import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import * as q from './db/queries';
import { buildCapacityMap, capacityReady, intakeReady } from './engine/capacity';
import { assessIntention } from './engine/quality';
import { generateSequence, nextRoute } from './engine/sequence';
import { detectThresholds } from './engine/thresholds';
import { addDays, nowIso, newId } from './format';
import type {
  CapacityMap,
  CompetingGoal,
  Intake,
  PortfolioEntry,
  Profile,
  Responsibility,
  Step,
  Threshold,
  ThresholdKey,
  Vision,
} from './types';
import { DUE_DAYS, THRESHOLD_COPY } from './types';

type Store = {
  standardAccepted: boolean | null;
  beginCompleted: boolean | null;
  acceptStandard: () => Promise<void>;
  completeBegin: () => Promise<void>;
  recordBegin: (body: string) => Promise<void>;
  recordRegulate: (state: string) => Promise<void>;
  recordVisualize: (input: { seen: string; noLonger: string; tuesday: string }) => Promise<void>;
  getIntake: () => Promise<Intake | null>;
  saveIntake: (input: {
    omittedResponsibilities: string;
    actualHoursNote: string;
    competingGoals: string;
  }) => Promise<void>;
  getProfile: () => Promise<Profile | null>;
  listResponsibilities: () => Promise<Responsibility[]>;
  listCompetingGoals: () => Promise<CompetingGoal[]>;
  getCapacity: () => Promise<CapacityMap | null>;
  saveProfile: (input: { weeklyHours: number; constraints: string }) => Promise<void>;
  addResponsibility: (input: { name: string; weeklyHours: number; nonNegotiable: boolean }) => Promise<void>;
  removeResponsibility: (id: string) => Promise<void>;
  addCompetingGoal: (input: { name: string; weeklyHours: number }) => Promise<void>;
  removeCompetingGoal: (id: string) => Promise<void>;
  getActiveVision: () => Promise<Vision | null>;
  captureVision: (input: {
    statement: string;
    evidence: string;
    regulated: boolean;
  }) => Promise<string>;
  archiveVision: (note: string) => Promise<void>;
  ensureSequence: () => Promise<void>;
  requestAlternative: (reason: string) => Promise<void>;
  lockPlan: (prepared: boolean) => Promise<void>;
  listSteps: (visionId: string) => Promise<Step[]>;
  getStep: (id: string) => Promise<Step | null>;
  currentStep: () => Promise<Step | null>;
  recordAction: (stepId: string, body: string) => Promise<ThresholdKey[]>;
  recordMiss: (stepId: string, body: string) => Promise<void>;
  reconcileMisses: () => Promise<number>;
  completeStep: (stepId: string, outcome: string) => Promise<ThresholdKey[]>;
  listPortfolio: () => Promise<PortfolioEntry[]>;
  listThresholds: (visionId: string) => Promise<Threshold[]>;
};

const StoreContext = createContext<Store | null>(null);

function schedule() {
  const activatedAt = nowIso();
  return { activatedAt, dueAt: addDays(activatedAt, DUE_DAYS) };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [standardAccepted, setStandardAccepted] = useState<boolean | null>(null);
  const [beginCompleted, setBeginCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    q.getSessionFlags(db).then(async (flags) => {
      let begun = flags.beginCompleted;
      if (!begun) {
        const vision = await q.getActiveVision(db);
        if (vision?.planLocked) {
          await q.markBeginCompleted(db);
          begun = true;
        }
      }
      setStandardAccepted(flags.standardAccepted);
      setBeginCompleted(begun);
    });
  }, [db]);

  const getCapacity = useCallback(async () => {
    const [profile, responsibilities, competingGoals] = await Promise.all([
      q.getProfile(db),
      q.listResponsibilities(db),
      q.listCompetingGoals(db),
    ]);
    return buildCapacityMap(profile, responsibilities, competingGoals);
  }, [db]);

  const requireReady = useCallback(async () => {
    const [intake, map] = await Promise.all([q.getIntake(db), getCapacity()]);
    if (!intakeReady(intake)) {
      throw new Error('Answer the clarifying questions about responsibilities, capacity, and competing goals.');
    }
    if (!capacityReady(map) || !map) {
      throw new Error('Map responsibilities and weekly hours before continuing.');
    }
    if (map.availableHours < 1) {
      throw new Error('No capacity remains after responsibilities and competing goals.');
    }
    return map;
  }, [db, getCapacity]);

  const evaluate = useCallback(
    async (visionId: string): Promise<ThresholdKey[]> => {
      const [vision, steps, portfolio, map, existing] = await Promise.all([
        q.getVision(db, visionId),
        q.listSteps(db, visionId),
        q.listPortfolioForVision(db, visionId),
        getCapacity(),
        q.listThresholds(db, visionId),
      ]);
      if (!vision) return [];

      const already = new Set(existing.map((item) => item.key));
      const detected = detectThresholds({
        vision,
        steps,
        portfolio,
        hasCapacityMap: capacityReady(map),
      });
      const crossed: ThresholdKey[] = [];

      for (const key of detected) {
        if (already.has(key)) continue;
        const added = await q.addThreshold(db, { id: newId(), visionId, key });
        if (!added) continue;
        crossed.push(key);
        const copy = THRESHOLD_COPY[key];
        await q.addPortfolio(db, {
          id: newId(),
          kind: 'threshold',
          visionId,
          title: copy.title,
          body: copy.body,
        });
      }

      if (crossed.includes('foundation_solid') && vision.phase === 'foundation' && map) {
        await q.setVisionPhase(db, visionId, 'capitalization');
        const next = generateSequence(
          { ...vision, phase: 'capitalization', planLocked: false, route: 'necessary' },
          map,
          'necessary'
        );
        await q.insertSteps(
          db,
          visionId,
          next,
          next.map(() => newId())
        );
        await q.addPortfolio(db, {
          id: newId(),
          kind: 'phase',
          visionId,
          title: 'Capitalization draft',
          body: 'Foundation is solid. Lock capitalization as the primary path before acting. The system still does not create the result.',
        });
      }

      return crossed;
    },
    [db, getCapacity]
  );

  const ensureSequence = useCallback(async () => {
    const vision = await q.getActiveVision(db);
    if (!vision) {
      throw new Error('Capture a precise vision before a sequence can be generated.');
    }
    const map = await requireReady();
    const existing = await q.listSteps(db, vision.id);
    const hasPhase = existing.some((step) => step.phase === vision.phase);
    if (hasPhase) return;
    const generated = generateSequence(vision, map, vision.route);
    await q.insertSteps(
      db,
      vision.id,
      generated,
      generated.map(() => newId())
    );
  }, [db, requireReady]);

  const activateCurrent = useCallback(
    async (visionId: string) => {
      const steps = await q.listSteps(db, visionId);
      const current = steps.find((step) => step.status !== 'complete');
      if (!current) return;
      await q.activateStep(db, current.id, schedule());
    },
    [db]
  );

  const captureVision = useCallback(
    async (input: { statement: string; evidence: string; regulated: boolean }) => {
      if (!input.regulated) {
        throw new Error('A vision can only be captured from a regulated state.');
      }
      const quality = assessIntention(input.statement, input.evidence);
      if (!quality.ok) {
        throw new Error(quality.notes[0] ?? 'The intention is not precise enough.');
      }
      const active = await q.getActiveVision(db);
      if (active) {
        throw new Error('One active vision at a time. Archive it after recording current state.');
      }
      const id = newId();
      await q.createVision(db, {
        id,
        statement: input.statement.trim(),
        evidence: input.evidence.trim(),
      });
      await q.addPortfolio(db, {
        id: newId(),
        kind: 'capture',
        visionId: id,
        title: 'Vision captured',
        body: `${input.statement.trim()}\n\nEvidence: ${input.evidence.trim()}`,
      });
      try {
        await ensureSequence();
      } catch {
        // Intake or capacity may be incomplete. Sequence waits.
      }
      return id;
    },
    [db, ensureSequence]
  );

  const value = useMemo<Store>(
    () => ({
      standardAccepted,
      beginCompleted,
      completeBegin: async () => {
        await q.markBeginCompleted(db);
        setBeginCompleted(true);
      },
      recordBegin: async (body) => {
        await q.addPortfolio(db, {
          id: newId(),
          kind: 'begin',
          title: 'Begin',
          body,
        });
      },
      recordRegulate: async (state) => {
        await q.addPortfolio(db, {
          id: newId(),
          kind: 'regulate',
          title: 'Regulated state',
          body: state,
        });
      },
      recordVisualize: async (input) => {
        await q.addPortfolio(db, {
          id: newId(),
          kind: 'visualize',
          title: 'Highest version, observed',
          body: `Seen:\n${input.seen}\n\nNo longer true:\n${input.noLonger}\n\nTuesday:\n${input.tuesday}`,
        });
      },
      acceptStandard: async () => {
        await q.acceptStandard(db);
        await q.addPortfolio(db, {
          id: newId(),
          kind: 'standard',
          title: 'Standard accepted',
          body: 'Honest intake. Lock only as a primary path. Misses are recorded. Progress is completed evidence. The Life Portfolio is permanent.',
        });
        setStandardAccepted(true);
      },
      getIntake: () => q.getIntake(db),
      saveIntake: async (input) => {
        const draft = {
          omittedResponsibilities: input.omittedResponsibilities.trim(),
          actualHoursNote: input.actualHoursNote.trim(),
          competingGoals: input.competingGoals.trim(),
        };
        if (!intakeReady(draft)) {
          throw new Error('Answer each question honestly and completely. Short answers are not an intake.');
        }
        await q.upsertIntake(db, draft);
        await q.addPortfolio(db, {
          id: newId(),
          kind: 'intake',
          title: 'Intake recorded',
          body: `Omitted responsibilities:\n${draft.omittedResponsibilities}\n\nActual capacity:\n${draft.actualHoursNote}\n\nCompeting goals:\n${draft.competingGoals}`,
        });
      },
      getProfile: () => q.getProfile(db),
      listResponsibilities: () => q.listResponsibilities(db),
      listCompetingGoals: () => q.listCompetingGoals(db),
      getCapacity,
      saveProfile: (input) => q.upsertProfile(db, input),
      addResponsibility: async (input) => {
        if (input.name.trim().length < 2) {
          throw new Error('Name the responsibility.');
        }
        if (!(input.weeklyHours > 0)) {
          throw new Error('Hours must be greater than zero.');
        }
        await q.addResponsibility(db, {
          id: newId(),
          name: input.name.trim(),
          weeklyHours: input.weeklyHours,
          nonNegotiable: input.nonNegotiable,
        });
      },
      removeResponsibility: (id) => q.removeResponsibility(db, id),
      addCompetingGoal: async (input) => {
        if (input.name.trim().length < 2) {
          throw new Error('Name the competing goal.');
        }
        if (!(input.weeklyHours > 0)) {
          throw new Error('Hours must be greater than zero.');
        }
        await q.addCompetingGoal(db, {
          id: newId(),
          name: input.name.trim(),
          weeklyHours: input.weeklyHours,
        });
      },
      removeCompetingGoal: (id) => q.removeCompetingGoal(db, id),
      getActiveVision: () => q.getActiveVision(db),
      captureVision,
      archiveVision: async (note) => {
        const vision = await q.getActiveVision(db);
        if (!vision) throw new Error('No active vision.');
        if (note.trim().length < 12) {
          throw new Error('Record the current state before archiving.');
        }
        await q.archiveVision(db, vision.id);
        await q.addPortfolio(db, {
          id: newId(),
          kind: 'outcome',
          visionId: vision.id,
          title: 'Vision archived',
          body: note.trim(),
        });
      },
      ensureSequence,
      requestAlternative: async (reason) => {
        if (reason.trim().length < 16) {
          throw new Error('Say why this sequence is not correct or not necessary.');
        }
        const vision = await q.getActiveVision(db);
        if (!vision) throw new Error('No active vision.');
        if (vision.planLocked) {
          throw new Error('The plan is locked. An alternative route is no longer available.');
        }
        const map = await requireReady();
        const route = nextRoute(vision.route, reason);
        const generated = generateSequence({ ...vision, route }, map, route);
        await q.replacePhaseDraft(
          db,
          vision.id,
          generated,
          generated.map(() => newId())
        );
        await q.setVisionRoute(db, vision.id, route);
        await q.addPortfolio(db, {
          id: newId(),
          kind: 'alternative',
          visionId: vision.id,
          title: `Alternative route: ${route}`,
          body: reason.trim(),
        });
      },
      lockPlan: async (prepared) => {
        if (!prepared) {
          throw new Error('Confirm only if you are prepared to execute.');
        }
        const vision = await q.getActiveVision(db);
        if (!vision) throw new Error('Capture a vision first.');
        if (vision.planLocked) return;
        await requireReady();
        await ensureSequence();
        const steps = await q.listSteps(db, vision.id);
        const committed = steps
          .filter((step) => step.phase === vision.phase)
          .map((step) => `${step.position}. ${step.title}\n${step.action}`)
          .join('\n\n');
        await q.lockVision(db, vision.id);
        await activateCurrent(vision.id);
        await q.addPortfolio(db, {
          id: newId(),
          kind: 'lock',
          visionId: vision.id,
          title: 'Commitment locked',
          body: `Vision: ${vision.statement}\n\nCommitted path:\n${committed}\n\nAgreed: treat these actions as the committed path and record evidence of completion. This entry is permanent.`,
        });
      },
      listSteps: (visionId) => q.listSteps(db, visionId),
      getStep: (id) => q.getStep(db, id),
      currentStep: async () => {
        const vision = await q.getActiveVision(db);
        if (!vision) return null;
        const steps = await q.listSteps(db, vision.id);
        return steps.find((step) => step.status !== 'complete') ?? null;
      },
      recordAction: async (stepId, body) => {
        if (body.trim().length < 8) {
          throw new Error('Record what was actually done.');
        }
        const vision = await q.getActiveVision(db);
        if (!vision?.planLocked) {
          throw new Error('The plan is not locked. Do not record work against a draft.');
        }
        const step = await q.getStep(db, stepId);
        if (!step) throw new Error('Step not found.');
        const open = (await q.listSteps(db, step.visionId)).find((item) => item.status !== 'complete');
        if (open && open.id !== stepId) {
          throw new Error('Record against the current step only.');
        }
        await q.activateStep(db, stepId, schedule());
        await q.addPortfolio(db, {
          id: newId(),
          kind: 'action',
          visionId: step.visionId,
          stepId,
          title: step.title,
          body: body.trim(),
        });
        return evaluate(step.visionId);
      },
      recordMiss: async (stepId, body) => {
        const vision = await q.getActiveVision(db);
        if (!vision?.planLocked) {
          throw new Error('Misses are recorded only against a locked plan.');
        }
        const step = await q.getStep(db, stepId);
        if (!step) throw new Error('Step not found.');
        const missedAt = nowIso();
        await q.markMiss(db, { id: stepId, missedAt, nextDueAt: addDays(missedAt, DUE_DAYS) });
        await q.addPortfolio(db, {
          id: newId(),
          kind: 'miss',
          visionId: step.visionId,
          stepId,
          title: `Missed: ${step.title}`,
          body: body.trim().length >= 8 ? body.trim() : 'No evidence recorded in the due window. Intention is not progress.',
        });
      },
      reconcileMisses: async () => {
        const vision = await q.getActiveVision(db);
        if (!vision?.planLocked) return 0;
        const steps = await q.listSteps(db, vision.id);
        const current = steps.find((step) => step.status !== 'complete');
        if (!current?.dueAt) return 0;
        if (new Date(current.dueAt).getTime() > Date.now()) return 0;
        if (current.lastMissAt && current.lastMissAt >= current.dueAt) return 0;
        const last = await q.latestStepEventAt(db, current.id);
        if (last && last >= current.dueAt) return 0;
        await q.markMiss(db, {
          id: current.id,
          missedAt: nowIso(),
          nextDueAt: addDays(nowIso(), DUE_DAYS),
        });
        await q.addPortfolio(db, {
          id: newId(),
          kind: 'miss',
          visionId: vision.id,
          stepId: current.id,
          title: `Missed: ${current.title}`,
          body: `No evidence recorded by the due point. Intention is not progress.`,
        });
        return 1;
      },
      completeStep: async (stepId, outcome) => {
        if (outcome.trim().length < 12) {
          throw new Error('Completion requires a documented outcome.');
        }
        const vision = await q.getActiveVision(db);
        if (!vision?.planLocked) {
          throw new Error('The plan is not locked. Do not close work against a draft.');
        }
        const step = await q.getStep(db, stepId);
        if (!step) throw new Error('Step not found.');
        const current = await q.listSteps(db, step.visionId);
        const open = current.find((item) => item.status !== 'complete');
        if (open && open.id !== stepId) {
          throw new Error('Complete steps in sequence. The current step is still open.');
        }
        await q.completeStep(db, { id: stepId, outcome: outcome.trim() });
        await q.addPortfolio(db, {
          id: newId(),
          kind: 'outcome',
          visionId: step.visionId,
          stepId,
          title: `Outcome: ${step.title}`,
          body: outcome.trim(),
        });
        const crossed = await evaluate(step.visionId);
        const still = await q.getActiveVision(db);
        if (still?.planLocked) {
          await activateCurrent(step.visionId);
        }
        return crossed;
      },
      listPortfolio: () => q.listPortfolio(db),
      listThresholds: (visionId) => q.listThresholds(db, visionId),
    }),
    [
      activateCurrent,
      beginCompleted,
      captureVision,
      db,
      ensureSequence,
      evaluate,
      getCapacity,
      requireReady,
      standardAccepted,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return store;
}

export function formatHours(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}h`;
}
