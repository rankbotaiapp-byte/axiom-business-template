"use client";

import { useEffect, useRef, useState } from "react";

import { Button, Field, Panel } from "@/components/ui";
import { EXTRACTION_QUESTIONS, extractionSegment } from "@/lib/extraction";
import { nowIso } from "@/lib/utils/ids";
import type { ExtractionAnswer, ExtractionQuestionId } from "@/types";

import { useClipPlayer } from "./use-clip-player";
import { useFrequencyBed } from "./use-frequency-bed";
import { useSpeechCapture } from "./use-speech-capture";

type Phase = "ready" | "induction" | "ask" | "listen" | "exit";

export function GuidedExtractionSession({
  onComplete,
  hapticEnabled = false,
}: {
  onComplete: (answers: ExtractionAnswer[]) => void;
  hapticEnabled?: boolean;
}) {
  const bed = useFrequencyBed();
  const player = useClipPlayer(bed.setDucked);
  const speech = useSpeechCapture();
  const answersRef = useRef<ExtractionAnswer[]>([]);
  const indexRef = useRef(0);
  const listenGen = useRef(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [index, setIndex] = useState(0);
  const [reprompted, setReprompted] = useState(false);
  const [typed, setTyped] = useState("");
  const [answers, setAnswers] = useState<ExtractionAnswer[]>([]);
  const [busy, setBusy] = useState(false);
  const question = EXTRACTION_QUESTIONS[index];

  useEffect(() => {
    if (!hapticEnabled || typeof navigator === "undefined" || !("vibrate" in navigator)) {
      return;
    }
    const active = phase !== "ready";
    if (!active) return;

    const pulseMs = 24;
    const breatheMs = 11000;
    const id = window.setInterval(() => {
      navigator.vibrate(pulseMs);
    }, breatheMs);

    return () => window.clearInterval(id);
  }, [hapticEnabled, phase]);

  async function begin() {
    if (busy) return;
    setBusy(true);
    await bed.start();
    setPhase("induction");
    await player.play(extractionSegment("induction").src);
    await askAt(0);
  }

  async function askAt(nextIndex: number) {
    listenGen.current += 1;
    const next = EXTRACTION_QUESTIONS[nextIndex];
    if (!next) {
      await exit();
      return;
    }
    indexRef.current = nextIndex;
    setIndex(nextIndex);
    setReprompted(false);
    setTyped("");
    speech.stop();
    setPhase("ask");
    await player.play(next.src);
    await listen(next.questionId, false);
  }

  async function listen(questionId: ExtractionQuestionId, afterPrompt: boolean) {
    const gen = listenGen.current;
    setPhase("listen");
    const spoken = speech.supported ? await speech.start() : "";
    if (gen !== listenGen.current) return;
    if (spoken) {
      record(questionId, spoken, "speech");
      return;
    }
    if (!afterPrompt && speech.status !== "denied" && speech.supported) {
      setReprompted(true);
      await player.play(extractionSegment("reprompt").src);
      if (gen !== listenGen.current) return;
      await listen(questionId, true);
      return;
    }
    speech.stop();
    if (afterPrompt) {
      void askAt(indexRef.current + 1);
    }
  }

  function record(questionId: ExtractionQuestionId, text: string, source: ExtractionAnswer["source"]) {
    const trimmed = text.trim();
    if (!trimmed) return;
    listenGen.current += 1;
    speech.stop();
    const entry: ExtractionAnswer = {
      questionId,
      text: trimmed,
      source,
      capturedAt: nowIso(),
    };
    answersRef.current = [...answersRef.current.filter((item) => item.questionId !== questionId), entry];
    setAnswers(answersRef.current);
    void askAt(indexRef.current + 1);
  }

  function submitTyped() {
    if (!question || typed.trim().length < 3) return;
    record(question.questionId, typed, "typed");
  }

  async function exit() {
    setPhase("exit");
    await player.play(extractionSegment("exit").src);
    bed.stop();
    onComplete(answersRef.current);
  }

  const listening = phase === "listen" && speech.status === "listening";

  return (
    <>
      <p className="lede">
        Spoken induction, then strategic questions. Answers are transcribed. Audio is not stored.
      </p>
      <Panel>
        <p className="kicker">Guided extraction</p>
        <p className="copy">
          {phase === "ready"
            ? "Frequency bed under voice. Answer out loud after each question, or type."
            : phase === "induction"
              ? "Induction. Remain still."
              : phase === "ask"
                ? question?.script
                : phase === "listen"
                  ? question?.script
                  : "Clean exit. The record is being closed."}
        </p>
        {phase === "listen" ? (
          <div className={`listening-row${listening ? " is-live" : ""}`}>
            <span className="listening-dot" aria-hidden />
            <p className="quiet">
              {speech.status === "requesting"
                ? "Microphone permission required."
                : speech.status === "denied"
                  ? "Microphone blocked. Type the answer."
                  : speech.status === "unsupported"
                    ? "Speech capture is not available. Type the answer."
                    : speech.status === "empty"
                      ? "No usable speech. Type the answer, or wait for the re-prompt."
                      : listening
                        ? "Listening."
                        : "Window closed."}
            </p>
          </div>
        ) : null}
        {speech.transcript ? <p className="copy">{speech.transcript}</p> : null}
      </Panel>

      {phase === "ready" ? (
        <Button onClick={() => void begin()}>Begin guided extraction</Button>
      ) : null}

      {phase === "listen" ? (
        <>
          <Field
            label="Or type the answer"
            value={typed}
            onChange={setTyped}
            placeholder="Objects, numbers, names, dates."
            rows={4}
          />
          <Button onClick={submitTyped} disabled={typed.trim().length < 3}>
            Record typed answer
          </Button>
          {listening ? (
            <Button tone="neutral" onClick={() => speech.stop()}>
              Done speaking
            </Button>
          ) : null}
        </>
      ) : null}

      {phase !== "ready" ? (
        <p className="quiet">
          {index + 1} / {EXTRACTION_QUESTIONS.length}
          {reprompted ? " · Re-prompt used" : ""}
          {answers.length ? ` · ${answers.length} on record` : ""}
        </p>
      ) : null}
    </>
  );
}
