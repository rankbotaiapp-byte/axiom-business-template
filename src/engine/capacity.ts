import type { CapacityMap, CompetingGoal, Profile, Responsibility } from '../types';

export function roundHours(value: number): number {
  return Math.round(value * 10) / 10;
}

export function committedHours(
  responsibilities: Responsibility[],
  competingGoals: CompetingGoal[] = []
): number {
  const load =
    responsibilities.reduce((sum, item) => sum + item.weeklyHours, 0) +
    competingGoals.reduce((sum, item) => sum + item.weeklyHours, 0);
  return roundHours(load);
}

export function availableHours(
  weeklyHours: number,
  responsibilities: Responsibility[],
  competingGoals: CompetingGoal[] = []
): number {
  return roundHours(Math.max(0, weeklyHours - committedHours(responsibilities, competingGoals)));
}

export function buildCapacityMap(
  profile: Profile | null,
  responsibilities: Responsibility[],
  competingGoals: CompetingGoal[] = []
): CapacityMap | null {
  if (!profile) return null;
  return {
    weeklyHours: profile.weeklyHours,
    committedHours: committedHours(responsibilities, competingGoals),
    availableHours: availableHours(profile.weeklyHours, responsibilities, competingGoals),
    constraints: profile.constraints,
    responsibilities,
    competingGoals,
  };
}

export function capacityReady(map: CapacityMap | null): boolean {
  return Boolean(map && map.weeklyHours > 0 && map.responsibilities.length > 0);
}

export function intakeReady(intake: { omittedResponsibilities: string; actualHoursNote: string; competingGoals: string } | null): boolean {
  if (!intake) return false;
  return (
    intake.omittedResponsibilities.trim().length >= 16 &&
    intake.actualHoursNote.trim().length >= 16 &&
    intake.competingGoals.trim().length >= 16
  );
}
