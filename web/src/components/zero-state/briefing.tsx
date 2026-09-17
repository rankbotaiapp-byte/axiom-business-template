"use client";

import { useEffect } from "react";

import { Button, Panel } from "@/components/ui";
import { BRIEFING_SCRIPT, formatClock, markBriefingHeard } from "@/lib/zero-state";

import { useBriefingAudio } from "./use-briefing-audio";

export function ZeroStateBriefing({ onFinished }: { onFinished: () => void }) {
  const { phase, heard, elapsed, duration, play, stop } = useBriefingAudio();
  const playing = phase === "playing";
  const failed = phase === "error";
  const remaining = duration > 0 ? Math.max(0, duration - elapsed) : 0;
  const progress = duration > 0 ? Math.min(1, elapsed / duration) : 0;

  useEffect(() => {
    if (phase !== "ended") return;
    const id = window.setTimeout(onFinished, 700);
    return () => window.clearTimeout(id);
  }, [onFinished, phase]);

  function skip() {
    if (!heard && !failed) return;
    if (failed) markBriefingHeard();
    stop();
    onFinished();
  }

  return (
    <>
      <p className="lede">
        A spoken briefing precedes the frequency session. Remain still. Do not take notes yet.
      </p>
      <Panel>
        <p className="kicker">Pre-frequency briefing</p>
        <p className="text-[22px] font-semibold text-ink">
          {playing || phase === "ended"
            ? duration > 0
              ? formatClock(remaining)
              : formatClock(elapsed)
            : "Audio"}
        </p>
        <p className="quiet">
          {failed
            ? "The recording could not be played. Read the briefing, then continue."
            : playing
              ? "Listen. The first play cannot be skipped."
              : heard
                ? "Heard. Play again, or continue to the session."
                : "Required on first use. Begin when you can listen without interruption."}
        </p>
        <div className="briefing-bar" aria-hidden>
          <span className="briefing-bar-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      </Panel>

      {failed ? <p className="copy briefing-script">{BRIEFING_SCRIPT}</p> : null}

      {!playing && phase !== "ended" ? (
        <Button onClick={() => void play()} disabled={playing}>
          {heard ? "Play briefing" : "Begin briefing"}
        </Button>
      ) : null}

      {heard || failed ? (
        <Button tone="neutral" onClick={skip} disabled={phase === "ended"}>
          Continue to session
        </Button>
      ) : null}

      {playing ? <p className="quiet">Sit or stand. Breathing steady. Face, shoulders, hands unset.</p> : null}
    </>
  );
}
