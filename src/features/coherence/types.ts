export type SessionMode = {
  detection: boolean;
  voice: boolean;
  vibration: boolean;
  ambient: boolean;
  extraction: boolean;
  adaptiveTiming: boolean;
  implementationLock: boolean;
};

export type SessionId =
  | "next-step"
  | "morning-priming"
  | "resistance-dissolve"
  | "energy-activation"
  | "midday-reset"
  | "evening-integration"
  | "celebration"
  | "crisis";

export type ExtractionAnswer = {
  question: string;
  answer: string;
};

export type SessionResult = {
  sessionId: SessionId;
  coherenceReached: boolean;
  answers: ExtractionAnswer[];
  completedAt: string;
};
