import { newId } from "@/lib/utils/ids";
import type { CompetingGoal, EffortLevel, EnergyLevel, Responsibility, UserCapacity, UserProfile } from "@/types";

export type ClarifyingStage = "responsibilities" | "goals" | "capacity" | "constraints" | "review";

export type ClarifyingDraft = {
  responsibilities: Responsibility[];
  competingGoals: CompetingGoal[];
  noCompetingGoals: boolean;
  capacity: UserCapacity;
  constraints: string[];
  noHardConstraints: boolean;
};

export const CLARIFYING_STAGES: ClarifyingStage[] = [
  "responsibilities",
  "goals",
  "capacity",
  "constraints",
  "review",
];

const THIN = 3;
const CONSTRAINT_MIN = 8;

export function emptyClarifyingDraft(): ClarifyingDraft {
  return {
    responsibilities: [emptyResponsibility()],
    competingGoals: [emptyCompetingGoal(1)],
    noCompetingGoals: false,
    capacity: {
      availableHoursPerWeek: 0,
      energyLevel: "medium",
    },
    constraints: [""],
    noHardConstraints: false,
  };
}

export function draftFromProfile(profile: UserProfile): ClarifyingDraft {
  return {
    responsibilities: profile.responsibilities.length
      ? profile.responsibilities
      : [emptyResponsibility()],
    competingGoals: profile.competingGoals.length
      ? profile.competingGoals
      : [emptyCompetingGoal(1)],
    noCompetingGoals: profile.competingGoals.length === 0,
    capacity: profile.capacity,
    constraints: profile.constraints.length ? profile.constraints : [""],
    noHardConstraints: profile.constraints.length === 0,
  };
}

export function emptyResponsibility(): Responsibility {
  return {
    id: newId(),
    title: "",
    isNonNegotiable: false,
    timeDemand: "medium",
  };
}

export function emptyCompetingGoal(priority: number): CompetingGoal {
  return { id: newId(), title: "", priority };
}

export function withGoalPriorities(goals: CompetingGoal[]): CompetingGoal[] {
  return goals.map((goal, index) => ({ ...goal, priority: index + 1 }));
}

export type Assessment = { ok: boolean; notes: string[] };

export function assessResponsibilities(items: Responsibility[]): Assessment {
  const notes: string[] = [];
  const named = items.filter((item) => item.title.trim().length >= THIN);
  if (named.length === 0) {
    notes.push("Name at least one current responsibility that consumes real hours.");
  }
  if (items.some((item) => item.title.trim().length > 0 && item.title.trim().length < THIN)) {
    notes.push("A title that short is not usable. Name the role, obligation, or body of work.");
  }
  return { ok: notes.length === 0, notes };
}

export function assessGoals(draft: ClarifyingDraft): Assessment {
  const notes: string[] = [];
  const named = draft.competingGoals.filter((item) => item.title.trim().length >= THIN);
  if (!draft.noCompetingGoals && named.length === 0) {
    notes.push("Name competing intentions, or record that there are none.");
  }
  if (draft.noCompetingGoals && named.length > 0) {
    notes.push("You recorded competing goals and also marked none. Keep one of those facts.");
  }
  return { ok: notes.length === 0, notes };
}

export function assessCapacity(capacity: UserCapacity): Assessment {
  const notes: string[] = [];
  const hours = capacity.availableHoursPerWeek;
  if (!Number.isFinite(hours) || hours < 1 || hours > 70) {
    notes.push("Weekly capacity must be between 1 and 70 hours after non-negotiables.");
  }
  if (!capacity.energyLevel) {
    notes.push("Set the sustainable energy level for those hours.");
  }
  return { ok: notes.length === 0, notes };
}

export function assessConstraints(draft: ClarifyingDraft): Assessment {
  const notes: string[] = [];
  const named = draft.constraints.map((item) => item.trim()).filter((item) => item.length > 0);
  const thin = named.filter((item) => item.length < CONSTRAINT_MIN);
  if (!draft.noHardConstraints && named.length === 0) {
    notes.push("Record hard constraints, or record that none apply.");
  }
  if (draft.noHardConstraints && named.length > 0) {
    notes.push("You recorded constraints and also marked none. Keep one of those facts.");
  }
  if (thin.length > 0) {
    notes.push("Name the constraint in usable terms: money, location, health, legal, deadline.");
  }
  return { ok: notes.length === 0, notes };
}

export function assessDraft(draft: ClarifyingDraft): Assessment {
  const parts = [
    assessResponsibilities(draft.responsibilities),
    assessGoals(draft),
    assessCapacity(draft.capacity),
    assessConstraints(draft),
  ];
  const notes = parts.flatMap((part) => part.notes);
  return { ok: notes.length === 0, notes };
}

export function finalizeProfileDraft(draft: ClarifyingDraft): {
  responsibilities: Responsibility[];
  competingGoals: CompetingGoal[];
  capacity: UserCapacity;
  constraints: string[];
} {
  return {
    responsibilities: draft.responsibilities.filter((item) => item.title.trim().length >= THIN),
    competingGoals: draft.noCompetingGoals
      ? []
      : withGoalPriorities(
          draft.competingGoals.filter((item) => item.title.trim().length >= THIN)
        ),
    capacity: {
      availableHoursPerWeek: draft.capacity.availableHoursPerWeek,
      energyLevel: draft.capacity.energyLevel,
      notes: draft.capacity.notes?.trim() || undefined,
    },
    constraints: draft.noHardConstraints
      ? []
      : draft.constraints.map((item) => item.trim()).filter((item) => item.length >= CONSTRAINT_MIN),
  };
}

export const EFFORT_OPTIONS: { value: EffortLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const ENERGY_OPTIONS: { value: EnergyLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];
