import type { Step } from '../types';

export function evidenceCount(steps: Step[]): { completed: number; total: number } {
  const completed = steps.filter(
    (step) => step.status === 'complete' && Boolean(step.outcome && step.outcome.trim().length >= 12)
  ).length;
  return { completed, total: steps.length };
}
