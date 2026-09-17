export {
  CAPITALIZATION_PHASE,
  INSTITUTIONAL_PHASES,
  INSTITUTIONAL_PHASE_COPY,
  institutionalPhaseName,
  isCapitalized,
  turningPointFor,
  withCapitalizationPhase,
} from "./detect";
export type { InstitutionalPhase } from "./detect";
export {
  createTurningPoint,
  evidenceForTurningPoint,
  readThreshold,
  shouldDeclareTurningPoint,
  shortEvidenceResult,
  supportingEvidenceLine,
  thresholdDate,
  THRESHOLD_CAPITALIZATION,
  THRESHOLD_DECLARATION,
  THRESHOLD_HEADING,
  TURNING_POINT_THRESHOLD,
} from "./threshold";
export type { ThresholdReading } from "./threshold";
