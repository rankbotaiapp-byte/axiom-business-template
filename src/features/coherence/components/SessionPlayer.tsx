import { useSessionEngine } from "../hooks/useSessionEngine";
import { TogglePanel } from "./TogglePanel";
import { SessionId } from "../types";

interface Props {
  sessionId: SessionId;
  onComplete?: (result: any) => void;
}

export function SessionPlayer({ sessionId, onComplete }: Props) {
  const {
    phase,
    mode,
    setMode,
    session,
    onCoherenceReached,
    submitAnswer,
    finishSession,
  } = useSessionEngine(sessionId);

  const handleFinish = () => {
    const result = finishSession();
    onComplete?.(result);
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-center">{session.title}</h1>

      {phase === "measuring" && (
        <div className="text-center space-y-4">
          <p className="text-lg">Measuring your state…</p>
          <p className="text-sm text-gray-500">
            Waiting for coherence so the session can begin at the right moment.
          </p>
          <button
            onClick={onCoherenceReached}
            className="px-6 py-3 bg-black text-white rounded-lg"
          >
            Simulate Coherence (testing)
          </button>
        </div>
      )}

      {phase === "coherence" && (
        <div className="text-center text-xl font-medium">{session.confirmation}</div>
      )}

      {phase === "extraction" && (
        <div className="space-y-6">
          {session.prompts.map((prompt, index) => (
            <div key={index} className="space-y-2">
              <p>{prompt}</p>
              <textarea
                className="w-full rounded border border-gray-300 p-2"
                rows={2}
                onBlur={(event) => submitAnswer(prompt, event.target.value)}
              />
            </div>
          ))}

          <button onClick={handleFinish} className="w-full rounded-lg bg-black px-4 py-3 text-white">
            Complete & Take the Step
          </button>
        </div>
      )}

      {phase === "complete" && (
        <div className="space-y-4 text-center">
          <p>{session.close}</p>
          <button className="rounded-lg bg-black px-4 py-3 text-white">Take the Step Now</button>
        </div>
      )}

      <TogglePanel mode={mode} onChange={setMode} />
    </div>
  );
}
