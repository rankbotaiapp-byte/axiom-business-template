export type Phase = 'foundation' | 'capitalization';
export type RouteKind = 'necessary' | 'compressed' | 'direct_proof';
export type VisionStatus = 'active' | 'archived';
export type StepStatus = 'pending' | 'active' | 'complete';
export type PortfolioKind =
  | 'standard'
  | 'begin'
  | 'regulate'
  | 'visualize'
  | 'intake'
  | 'capture'
  | 'lock'
  | 'alternative'
  | 'action'
  | 'miss'
  | 'outcome'
  | 'threshold'
  | 'phase';
export type ThresholdKey = 'first_proof' | 'repeatable' | 'capacity_honest' | 'foundation_solid';

export type Profile = {
  weeklyHours: number;
  constraints: string;
  updatedAt: string;
};

export type Responsibility = {
  id: string;
  name: string;
  weeklyHours: number;
  nonNegotiable: boolean;
  createdAt: string;
};

export type CompetingGoal = {
  id: string;
  name: string;
  weeklyHours: number;
  createdAt: string;
};

export type Intake = {
  omittedResponsibilities: string;
  actualHoursNote: string;
  competingGoals: string;
  completedAt: string;
};

export type Vision = {
  id: string;
  statement: string;
  evidence: string;
  status: VisionStatus;
  phase: Phase;
  planLocked: boolean;
  planLockedAt: string | null;
  route: RouteKind;
  createdAt: string;
  archivedAt: string | null;
};

export type Step = {
  id: string;
  visionId: string;
  phase: Phase;
  position: number;
  title: string;
  action: string;
  evidence: string;
  hours: number;
  principle: string;
  status: StepStatus;
  createdAt: string;
  completedAt: string | null;
  outcome: string | null;
  dueAt: string | null;
  activatedAt: string | null;
  lastMissAt: string | null;
};

export type PortfolioEntry = {
  id: string;
  kind: PortfolioKind;
  visionId: string | null;
  stepId: string | null;
  title: string;
  body: string;
  createdAt: string;
};

export type Threshold = {
  id: string;
  visionId: string;
  key: ThresholdKey;
  crossedAt: string;
};

export type GeneratedStep = {
  title: string;
  action: string;
  evidence: string;
  hours: number;
  principle: string;
  phase: Phase;
};

export type IntentionQuality = {
  ok: boolean;
  notes: string[];
};

export type CapacityMap = {
  weeklyHours: number;
  committedHours: number;
  availableHours: number;
  constraints: string;
  responsibilities: Responsibility[];
  competingGoals: CompetingGoal[];
};

export const THRESHOLD_COPY: Record<ThresholdKey, { title: string; body: string }> = {
  first_proof: {
    title: 'First proof',
    body: 'A completed step now has a recorded outcome. The vision has left intention.',
  },
  repeatable: {
    title: 'Repeatable process',
    body: 'Two documented outcomes exist. This is no longer a single event.',
  },
  capacity_honest: {
    title: 'Capacity mapped',
    body: 'Responsibilities, hours, and at least one recorded action are in the same system.',
  },
  foundation_solid: {
    title: 'Foundation solid',
    body: 'The foundation sequence is complete. Planning now shifts to capitalization.',
  },
};

export const DUE_DAYS = 7;

export const ROUTE_COPY: Record<RouteKind, { title: string; why: string }> = {
  necessary: {
    title: 'Necessary path',
    why: 'Proof, constraint, first artifact, record, repetition under load, then a written method.',
  },
  compressed: {
    title: 'Compressed path',
    why: 'Fewer steps. Proof and constraint are combined. Recording is folded into the artifact.',
  },
  direct_proof: {
    title: 'Direct-proof path',
    why: 'The first artifact comes immediately. Admin is cut. Repetition and method remain.',
  },
};
