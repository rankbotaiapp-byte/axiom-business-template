import type { PortfolioEntry, Step, ThresholdKey, Vision } from '../types';

export function detectThresholds(input: {
  vision: Vision;
  steps: Step[];
  portfolio: PortfolioEntry[];
  hasCapacityMap: boolean;
}): ThresholdKey[] {
  const { vision, steps, portfolio, hasCapacityMap } = input;
  const foundation = steps.filter((step) => step.phase === 'foundation');
  const completedWithOutcome = steps.filter(
    (step) => step.status === 'complete' && Boolean(step.outcome && step.outcome.trim().length >= 12)
  );
  const actions = portfolio.filter((entry) => entry.kind === 'action' || entry.kind === 'outcome');

  const found: ThresholdKey[] = [];

  if (completedWithOutcome.length >= 1) {
    found.push('first_proof');
  }
  if (completedWithOutcome.length >= 2) {
    found.push('repeatable');
  }
  if (hasCapacityMap && actions.length >= 1) {
    found.push('capacity_honest');
  }
  if (
    vision.phase === 'foundation' &&
    foundation.length > 0 &&
    foundation.every((step) => step.status === 'complete') &&
    completedWithOutcome.length >= 2 &&
    hasCapacityMap &&
    actions.length >= 1
  ) {
    found.push('foundation_solid');
  }

  return found;
}
