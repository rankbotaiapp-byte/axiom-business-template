import type { CapacityMap, GeneratedStep, RouteKind, Vision } from '../types';
import { ROUTE_COPY } from '../types';

type OutcomeClass = 'offer' | 'artifact' | 'body' | 'capital' | 'role' | 'system' | 'general';

const ROUTES: RouteKind[] = ['necessary', 'compressed', 'direct_proof'];

function hours(value: number, ceiling: number): number {
  return Math.max(0.5, Math.min(ceiling, Math.round(value * 10) / 10));
}

function constraintList(map: CapacityMap): string {
  const named = map.responsibilities
    .filter((item) => item.nonNegotiable)
    .map((item) => item.name);
  if (named.length > 0) return named.join(', ');
  return map.responsibilities.map((item) => item.name).join(', ') || 'unlisted load';
}

export function classifyOutcome(vision: Pick<Vision, 'statement' | 'evidence'>): OutcomeClass {
  const text = `${vision.statement} ${vision.evidence}`;
  if (/\b(client|customer|pay|paid|offer|sell|invoice|pricing|advisory)\b/i.test(text)) return 'offer';
  if (/\b(publish|write|book|essay|article|site|page|draft|manuscript)\b/i.test(text)) return 'artifact';
  if (/\b(train|health|weight|sleep|rehab|body|recover|therapy)\b/i.test(text)) return 'body';
  if (/\b(save|debt|earn|revenue|money|capital|invoice)\b/i.test(text)) return 'capital';
  if (/\b(hire|role|job|employ|relocate|move|notice)\b/i.test(text)) return 'role';
  if (/\b(system|process|install|replace|automate|pipeline)\b/i.test(text)) return 'system';
  return 'general';
}

const SIMILAR: Record<OutcomeClass, { proof: string; research: string; artifact: string }> = {
  offer: {
    proof: 'A priced offer exists in the world and one real person has been asked to buy or book it.',
    research:
      'Similar commercial outcomes require a specific offer, first market contact, and a recorded yes or no. Private planning does not close.',
    artifact: 'Put a priced offer in front of one real person and record the response.',
  },
  artifact: {
    proof: 'A complete piece exists where a third party can inspect it.',
    research:
      'Similar publishing outcomes require a finished artifact in the world. Notes and outlines are not the work.',
    artifact: 'Produce the smallest complete public draft and place it where it can be seen.',
  },
  body: {
    proof: 'One prescribed session is completed and the metric is recorded.',
    research:
      'Similar physical outcomes require repeated load under constraint, not a new program. The first session is the proof.',
    artifact: 'Complete one prescribed session and record the metric that the evidence named.',
  },
  capital: {
    proof: 'One real money movement has occurred toward the stated evidence.',
    research:
      'Similar capital outcomes require a transaction: send, file, collect, or cut. A revised budget is not the result.',
    artifact: 'Execute one money movement that a third party could verify.',
  },
  role: {
    proof: 'One decision has left your head: sent, held, filed, or delivered.',
    research:
      'Similar role and move outcomes require a decision in the world. Preparation without contact does not change position.',
    artifact: 'Make one external move: send, schedule, file, or hold the conversation.',
  },
  system: {
    proof: 'The system has carried real work once, not only existed as a diagram.',
    research:
      'Similar system outcomes require the process to carry load. Documentation without a run is not a system.',
    artifact: 'Run the system once on real work and record what it carried.',
  },
  general: {
    proof: 'The smallest complete artifact that would count toward the stated evidence exists.',
    research:
      'Similar outcomes require a first visible proof, an honest capacity tradeoff, repetition under load, and a method that survives contact with responsibilities.',
    artifact: 'Produce the smallest complete artifact that would count toward the stated evidence.',
  },
};

export function nextRoute(current: RouteKind, reason: string): RouteKind {
  const text = reason.toLowerCase();
  if (/\b(too much|unnecessary|overhead|admin|paper|long)\b/.test(text) && current !== 'compressed') {
    return 'compressed';
  }
  if (/\b(wrong|incorrect|skip|not the work|direct)\b/.test(text) && current !== 'direct_proof') {
    return 'direct_proof';
  }
  const index = ROUTES.indexOf(current);
  return ROUTES[(index + 1) % ROUTES.length];
}

export function planSources(vision: Vision, map: CapacityMap): {
  vision: string;
  capacity: string;
  research: string;
  route: { title: string; why: string };
} {
  const similar = SIMILAR[classifyOutcome(vision)];
  const load = constraintList(map);
  return {
    vision: vision.statement,
    capacity: `${map.availableHours}h available after ${map.committedHours}h committed (${load}).`,
    research: similar.research,
    route: ROUTE_COPY[vision.route],
  };
}

export function generateSequence(vision: Vision, map: CapacityMap, route: RouteKind = vision.route): GeneratedStep[] {
  if (vision.phase === 'capitalization') {
    return generateCapitalization(vision, map);
  }
  if (route === 'compressed') return generateCompressed(vision, map);
  if (route === 'direct_proof') return generateDirectProof(vision, map);
  return generateNecessary(vision, map);
}

function generateNecessary(vision: Vision, map: CapacityMap): GeneratedStep[] {
  const available = map.availableHours;
  const session = hours(available * 0.55, 6);
  const admin = hours(Math.min(1, available * 0.2), 1.5);
  const constraint = constraintList(map);
  const similar = SIMILAR[classifyOutcome(vision)];

  return [
    {
      phase: 'foundation',
      title: 'Define the first proof',
      action: `Write a one-week proof test for: "${vision.statement}". The proof must fit ${available} available hours and match what similar outcomes require: ${similar.proof}`,
      evidence: 'A written proof test with a deadline and a visible artifact.',
      hours: admin,
      principle: 'Implementation intention: define when, the action, and the evidence before acting. Required for similar outcomes so the week has a test, not a hope.',
    },
    {
      phase: 'foundation',
      title: 'Make the capacity tradeoff',
      action: `State which of these will lose time so the proof can happen: ${constraint}. If none can move, shrink the proof until it fits ${available} hours. ${map.constraints ? `Hard constraint: ${map.constraints}` : ''}`.trim(),
      evidence: 'A written tradeoff: hours taken from where, or a reduced proof.',
      hours: admin,
      principle: 'Capacity research: plans that ignore load fail. Similar outcomes are achieved inside existing responsibilities, not beside them.',
    },
    {
      phase: 'foundation',
      title: 'Produce the first artifact',
      action: `${similar.artifact} It must count toward: ${vision.evidence}.`,
      evidence: 'The artifact exists and is recorded as an outcome.',
      hours: session,
      principle: 'Next physical action. Similar outcomes require a visible product, not a work session.',
    },
    {
      phase: 'foundation',
      title: 'Record the outcome without interpretation',
      action: 'Write what was produced, what was not, and the next physical action. Do not record how it felt.',
      evidence: 'An outcome entry that a third party could understand.',
      hours: hours(0.5, 1),
      principle: 'Feedback loop. Similar outcomes are compounded from recorded evidence. Memory is not a record.',
    },
    {
      phase: 'foundation',
      title: 'Repeat once under real load',
      action: `Repeat the same class of action once without dropping ${constraint}. Stay inside ${available} available hours.`,
      evidence: 'A second documented artifact or outcome.',
      hours: session,
      principle: 'Deliberate repetition. One success is an event. Two under load is a process — what similar outcomes actually require.',
    },
    {
      phase: 'foundation',
      title: 'Write the working method',
      action: `From the two outcomes, write the method in ordered steps a stranger could follow toward: ${vision.evidence}.`,
      evidence: 'A method of at least four steps stored in the portfolio.',
      hours: hours(Math.min(1.5, available * 0.3), 2),
      principle: 'Stabilization. A foundation is a method that survives contact with responsibilities. Without it, capitalization has nothing to compound.',
    },
  ];
}

function generateCompressed(vision: Vision, map: CapacityMap): GeneratedStep[] {
  const available = map.availableHours;
  const session = hours(available * 0.6, 6);
  const admin = hours(Math.min(1.2, available * 0.25), 2);
  const constraint = constraintList(map);
  const similar = SIMILAR[classifyOutcome(vision)];

  return [
    {
      phase: 'foundation',
      title: 'Proof and tradeoff in one pass',
      action: `Write a proof test for "${vision.statement}" that already names the hours taken from ${constraint}. It must fit ${available}h and aim at: ${similar.proof}`,
      evidence: 'A proof test that includes the capacity tradeoff.',
      hours: admin,
      principle: 'Compressed path. Same research, fewer commitments: implementation intention and capacity constraint in one artifact.',
    },
    {
      phase: 'foundation',
      title: 'Produce and record the first artifact',
      action: `${similar.artifact} Then write what was produced and what was not. Evidence: ${vision.evidence}.`,
      evidence: 'Artifact plus a recorded outcome.',
      hours: session,
      principle: 'Next action plus feedback loop, combined because overhead was rejected as unnecessary.',
    },
    {
      phase: 'foundation',
      title: 'Repeat once under real load',
      action: `Repeat the same class of action once without dropping ${constraint}. Stay inside ${available} available hours.`,
      evidence: 'A second documented outcome.',
      hours: session,
      principle: 'Deliberate repetition remains. Similar outcomes are not one-offs.',
    },
    {
      phase: 'foundation',
      title: 'Write the working method',
      action: `Write the method a stranger could follow toward: ${vision.evidence}.`,
      evidence: 'A method of at least four steps in the portfolio.',
      hours: hours(Math.min(1.2, available * 0.25), 2),
      principle: 'Stabilization remains. A shorter path still has to become a method.',
    },
  ];
}

function generateDirectProof(vision: Vision, map: CapacityMap): GeneratedStep[] {
  const available = map.availableHours;
  const session = hours(available * 0.65, 6);
  const constraint = constraintList(map);
  const similar = SIMILAR[classifyOutcome(vision)];

  return [
    {
      phase: 'foundation',
      title: 'Produce the first proof now',
      action: `${similar.artifact} Do it inside ${available} available hours and around ${constraint}. It must count toward: ${vision.evidence}.`,
      evidence: similar.proof,
      hours: session,
      principle: 'Direct proof. When the sequence felt incorrect, the necessary work is still the first artifact similar outcomes require.',
    },
    {
      phase: 'foundation',
      title: 'Record the outcome and the tradeoff',
      action: `Write what was produced, what was not, and which of ${constraint} paid for the hours.`,
      evidence: 'An outcome entry that includes the capacity cost.',
      hours: hours(0.75, 1.5),
      principle: 'Feedback and capacity, recorded after contact with the work rather than before it.',
    },
    {
      phase: 'foundation',
      title: 'Repeat once under real load',
      action: `Repeat the same class of action once. Stay inside ${available} hours.`,
      evidence: 'A second documented outcome.',
      hours: session,
      principle: 'Deliberate repetition. Required for similar outcomes whether the path is direct or not.',
    },
    {
      phase: 'foundation',
      title: 'Write the working method',
      action: `Write the method toward: ${vision.evidence}.`,
      evidence: 'A method of at least four steps in the portfolio.',
      hours: hours(Math.min(1.2, available * 0.25), 2),
      principle: 'Stabilization. The path changed. The requirement for a method did not.',
    },
  ];
}

function generateCapitalization(vision: Vision, map: CapacityMap): GeneratedStep[] {
  const available = map.availableHours;
  const session = hours(available * 0.5, 6);
  const admin = hours(Math.min(1.2, available * 0.25), 2);
  const similar = SIMILAR[classifyOutcome(vision)];

  return [
    {
      phase: 'capitalization',
      title: 'Extract the asset',
      action: `Turn the working method into a reusable asset that serves: "${vision.statement}".`,
      evidence: 'The asset exists independently of your memory.',
      hours: session,
      principle: `${similar.research} Capitalization begins by making the proven method portable.`,
    },
    {
      phase: 'capitalization',
      title: 'Apply leverage',
      action: 'Use that asset on a higher-value instance of the same vision. Do not start a new vision.',
      evidence: 'A documented application with a result.',
      hours: session,
      principle: 'Leverage is repeated application of a proven method, not novelty. That is what similar outcomes do after the foundation holds.',
    },
    {
      phase: 'capitalization',
      title: 'Protect the foundation',
      action: `Recheck capacity. If capitalization pushed load above ${available} available hours, cut scope before continuing.`,
      evidence: 'Updated capacity map and a written load decision.',
      hours: admin,
      principle: 'Overextension collapses the foundation. Capitalization includes protection of the load that made the proof possible.',
    },
    {
      phase: 'capitalization',
      title: 'Document the position',
      action: `Write the capitalized result against the original evidence: ${vision.evidence}`,
      evidence: 'A portfolio record of the position now held.',
      hours: admin,
      principle: 'A result that is not recorded cannot be compounded.',
    },
  ];
}
