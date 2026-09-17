import { useCallback, useMemo, useState } from 'react';

import { SESSIONS } from '../data/sessions';
import type { SessionId, SessionMode, SessionResult } from '../types';

export function useSessionEngine(sessionId: SessionId) {
  const [phase, setPhase] = useState<'measuring' | 'coherence' | 'extraction' | 'complete'>('measuring');
  const [answers, setAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [mode, setMode] = useState<SessionMode>({
    detection: true,
    voice: true,
    vibration: true,
    ambient: true,
    extraction: true,
    adaptiveTiming: true,
    implementationLock: true,
  });

  const session = useMemo(() => SESSIONS[sessionId], [sessionId]);

  const onCoherenceReached = useCallback(() => {
    setPhase('coherence');
    setTimeout(() => setPhase('extraction'), 2500);
  }, []);

  const submitAnswer = useCallback((question: string, answer: string) => {
    setAnswers((previous) => [...previous, { question, answer }]);
  }, []);

  const finishSession = useCallback((): SessionResult => {
    setPhase('complete');

    return {
      sessionId,
      coherenceReached: true,
      answers,
      completedAt: new Date().toISOString(),
    };
  }, [answers, sessionId]);

  return {
    phase,
    mode,
    setMode,
    session,
    answers,
    onCoherenceReached,
    submitAnswer,
    finishSession,
  };
}
