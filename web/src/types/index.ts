export type VisionStatus = "draft" | "active" | "locked" | "completed" | "archived";

export type VerificationKind = "link" | "document" | "third_party" | "timestamp";
export type VerificationVisibility = "private" | "shared";
export type VerificationStatus = "internal" | "externally_verified";

export type ActionStatus = "pending" | "in_progress" | "completed" | "skipped";

export type EffortLevel = "low" | "medium" | "high";

export type EnergyLevel = "low" | "medium" | "high";

export type EvidencePayloadType = "text" | "image" | "link" | "file";

export type EvidenceGrade = "insufficient" | "weak" | "standard" | "strong";

export type LifePortfolioType = "vision" | "action" | "evidence" | "verification" | "turning_point" | "connection";

export type FailurePatternType = "delay" | "stall" | "abandonment";
export type FailurePatternActionKind =
  | "administrative"
  | "documentation"
  | "handoff"
  | "delivery"
  | "research"
  | "technical"
  | "review"
  | "general";
export type FailurePatternContext =
  | "high_load"
  | "low_capacity"
  | "competing_priorities"
  | "external_dependency"
  | "repeated_review"
  | "new_context"
  | "general";

export type ConnectionRoleKind = "decision_maker" | "practitioner" | "collaborator" | "introducer";

export type ConnectionStage =
  | "nominated"
  | "contact_drafted"
  | "contact_sent"
  | "reply_received"
  | "meeting_held"
  | "request_made";

export type AppRoute =
  | "/"
  | "/onboarding"
  | "/onboarding/purpose"
  | "/onboarding/standard"
  | "/onboarding/ready"
  | "/onboarding/zero-state"
  | "/onboarding/clarifying"
  | "/onboarding/vision";

export interface PlanningInput {
  visionId: string;
  title: string;
  description: string;
  livingDensity: number;
  capacity: UserCapacity;
  responsibilities: Responsibility[];
  competingGoals: CompetingGoal[];
  constraints: string[];
  capturedAt: string;
}

export interface UserCapacity {
  availableHoursPerWeek: number;
  energyLevel: EnergyLevel;
  notes?: string;
}

export interface Responsibility {
  id: string;
  title: string;
  isNonNegotiable: boolean;
  timeDemand: EffortLevel;
}

export interface CompetingGoal {
  id: string;
  title: string;
  priority: number;
}

export interface UserProfile {
  id: string;
  capacity: UserCapacity;
  responsibilities: Responsibility[];
  competingGoals: CompetingGoal[];
  constraints: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Vision {
  id: string;
  userId: string;
  title: string;
  description: string;
  mediaUrls?: string[];
  livingDensity: number;
  status: VisionStatus;
  verificationStatus: VerificationStatus;
  verificationSummary?: string;
  contextSnapshot: {
    capacity: UserCapacity;
    responsibilities: Responsibility[];
    competingGoals: CompetingGoal[];
    constraints: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface PlanAction {
  id: string;
  title: string;
  description: string;
  phase: string;
  order: number;
  status: ActionStatus;
  dependencies: string[];
  estimatedEffort: EffortLevel;
}

export interface Plan {
  id: string;
  visionId: string;
  phases: string[];
  actions: PlanAction[];
  isLocked: boolean;
  lockedAt?: string;
  capitalizationLocked?: boolean;
  capitalizationLockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StrategicRole {
  id: string;
  planId: string;
  visionId: string;
  kind: ConnectionRoleKind;
  title: string;
  reason: string;
  order: number;
}

export interface StrategicConnection {
  id: string;
  roleId: string;
  planId: string;
  visionId: string;
  actionId?: string;
  name: string;
  context: string;
  channel: string;
  draft: string;
  stage: ConnectionStage;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceRecord {
  id: string;
  actionId: string;
  visionId: string;
  payload: {
    type: EvidencePayloadType;
    content: string;
  };
  result: string;
  grade: EvidenceGrade;
  reference: string;
  timestamp: string;
}

export interface OutcomeVerification {
  id: string;
  visionId: string;
  title: string;
  kind: VerificationKind;
  sourceLabel: string;
  sourceUrl?: string;
  documentName?: string;
  note: string;
  confirmedAt: string;
  createdAt: string;
  visibility: VerificationVisibility;
}

export interface PossibilityTurningPoint {
  id: string;
  visionId: string;
  triggeringEvidenceIds: string[];
  declaration: string;
  createdAt: string;
}

export interface LifePortfolioEntry {
  id: string;
  visionId: string;
  type: LifePortfolioType;
  referenceId: string;
  timestamp: string;
}

export interface Session {
  standardAcceptedAt: string | null;
  zeroStateCompletedAt: string | null;
  clarifyingCompletedAt: string | null;
}

export type ZeroStateMode = "standard" | "guided";

export type ExtractionQuestionId =
  | "outcome"
  | "title"
  | "responsibilities"
  | "load"
  | "hours"
  | "energy"
  | "competing"
  | "constraints";

export type ExtractionAnswerSource = "speech" | "typed";

export interface ExtractionAnswer {
  questionId: ExtractionQuestionId;
  text: string;
  source: ExtractionAnswerSource;
  capturedAt: string;
}

export interface ExtractionRecord {
  answers: ExtractionAnswer[];
  completedAt: string;
}

export interface ZeroStateRecord {
  regulated: boolean;
  settleSeconds: number;
  visualizationSeconds: number;
  observed: string;
  completedAt: string;
  mode?: ZeroStateMode;
  extraction?: ExtractionRecord;
}

export type PlanRoute = "necessary" | "compressed" | "direct_proof";

export interface FailurePatternRecord {
  id: string;
  actionKind: FailurePatternActionKind;
  contextTag: FailurePatternContext;
  patternType: FailurePatternType;
  occurrences: number;
  lastObservedAt: string;
  riskScore: number;
  createdAt: string;
}

export interface FailurePatternWarning {
  id: string;
  title: string;
  detail: string;
  risk: number;
  actionKind: FailurePatternActionKind;
  contextTag: FailurePatternContext;
  recommendation: string;
}

export interface AppState {
  session: Session;
  profile: UserProfile | null;
  visions: Vision[];
  plans: Plan[];
  planRoutes: Record<string, PlanRoute>;
  evidence: EvidenceRecord[];
  verifications: OutcomeVerification[];
  failurePatterns: FailurePatternRecord[];
  turningPoints: PossibilityTurningPoint[];
  portfolio: LifePortfolioEntry[];
  roles: StrategicRole[];
  connections: StrategicConnection[];
  zeroState: ZeroStateRecord | null;
}

/** livingDensity 0–100. Bands: muted → resolved. */
export function livingDensityBand(
  density: number
): "muted" | "partial" | "forming" | "clarified" | "resolved" {
  if (density >= 80) return "resolved";
  if (density >= 60) return "clarified";
  if (density >= 40) return "forming";
  if (density >= 20) return "partial";
  return "muted";
}
