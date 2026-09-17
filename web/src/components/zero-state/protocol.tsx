"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button, CheckRow, Field, Notes, Panel, Shell } from "@/components/ui";
import { observedFromExtraction } from "@/lib/extraction";
import {
  assessObservation,
  hapticPulseEnabled,
  SETTLE_SECONDS,
  setHapticPulseEnabled,
  VISUALIZE_SECONDS,
} from "@/lib/zero-state";
import { nowIso } from "@/lib/utils/ids";
import { completeZeroState } from "@/stores/app-store";
import { useApp } from "@/stores/provider";
import type { ExtractionAnswer } from "@/types";

import { FrequencyBed } from "@/components/audio";

import { ZeroStateBriefing } from "./briefing";
import { GuidedExtractionSession } from "./extraction";
import { FocusHalo } from "./focus-halo";

type Stage = "briefing" | "choose" | "guided" | "settle" | "visualize" | "record";

export function ZeroStateProtocol() {
  const router = useRouter();
  const { commit } = useApp();
  const [stage, setStage] = useState<Stage>("briefing");
  const [left, setLeft] = useState(SETTLE_SECONDS);
  const [running, setRunning] = useState(false);
  const [stateName, setStateName] = useState<"activated" | "collapsed" | "clear" | null>(null);
  const [observed, setObserved] = useState("");
  const [busy, setBusy] = useState(false);
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(() => hapticPulseEnabled());

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setLeft((value) => {
        if (value <= 1) {
          window.clearInterval(id);
          setRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const quality = useMemo(() => assessObservation(observed), [observed]);
  const settled = stage === "settle" && left === 0 && !running;
  const visualized = stage === "visualize" && left === 0 && !running;
  const sessionActive = running && (stage === "settle" || stage === "visualize" || stage === "guided");
  const silentBed = stage === "settle" || stage === "visualize";

  const openChoice = useCallback(() => {
    setStage("choose");
  }, []);

  const startSettle = useCallback(() => {
    setStateName(null);
    setLeft(SETTLE_SECONDS);
    setRunning(true);
    setStage("settle");
  }, []);

  function startVisualize() {
    setLeft(VISUALIZE_SECONDS);
    setRunning(true);
    setStage("visualize");
  }

  function finish() {
    if (!quality.ok || busy) return;
    setBusy(true);
    commit((current) =>
      completeZeroState(current, {
        regulated: true,
        settleSeconds: SETTLE_SECONDS,
        visualizationSeconds: VISUALIZE_SECONDS,
        observed: observed.trim(),
        mode: "standard",
      })
    );
    router.replace("/onboarding/clarifying");
  }

  function finishGuided(answers: ExtractionAnswer[]) {
    if (busy) return;
    setBusy(true);
    commit((current) =>
      completeZeroState(current, {
        regulated: true,
        settleSeconds: 0,
        visualizationSeconds: 0,
        observed: observedFromExtraction(answers),
        mode: "guided",
        extraction: { answers, completedAt: nowIso() },
      })
    );
    router.replace("/onboarding/clarifying");
  }

  return (
    <Shell overline="Zero State Protocol" title={titleFor(stage, running)}>
      <FocusHalo active={sessionActive} />
      <FrequencyBed active={silentBed} profile="silent" />
      {stage === "briefing" ? <ZeroStateBriefing onFinished={openChoice} /> : null}
      {stage === "choose" ? (
        <>
          <p className="lede">
            Choose the session. Standard is silent regulation. Guided extraction speaks the questions
            and records spoken answers as input.
          </p>
          <Panel>
            <p className="kicker">Standard protocol</p>
            <p className="copy">90-second settle. Visualization. Written observation.</p>
            <Button onClick={startSettle}>Begin standard session</Button>
          </Panel>
          <Panel>
            <p className="kicker">Guided extraction</p>
            <p className="copy">
              Induction, strategic questions, listening windows. Transcripts prefill clarifying and
              vision. Speech is not stored as audio.
            </p>
            <CheckRow
              label="Gentle vibrational pulse (5–6 breaths/min)"
              checked={hapticEnabled}
              onToggle={() => {
                const next = !hapticEnabled;
                setHapticEnabled(next);
                setHapticPulseEnabled(next);
              }}
            />
            <p className="quiet">
              {hapticEnabled
                ? "On. The session uses a light pulse during the guided run."
                : "Off. Voice and frequency audio only."}
            </p>
            <Button onClick={() => setStage("guided")}>Begin guided extraction</Button>
          </Panel>
        </>
      ) : null}
      {stage === "guided" ? (
        <GuidedExtractionSession onComplete={finishGuided} hapticEnabled={hapticEnabled} />
      ) : null}
      {stage === "settle" ? (
        <>
          <p className="lede">
            Sit still. Feet on the floor. Do not improve your mood. Wait until urgency and fantasy
            drop.
          </p>
          <Panel>
            <p className="kicker">Settle</p>
            <p className="text-[22px] font-semibold text-ink">{running || settled ? `${left}s` : "90s"}</p>
            <p className="quiet">
              {settled ? "Complete. Name the state." : running ? "Do not skip this." : "Start the settle."}
            </p>
          </Panel>
          {!running && !settled ? <Button onClick={startSettle}>Begin settle</Button> : null}
          {settled ? (
            <>
              <div className="flex flex-col gap-2">
                <StateChoice
                  label="Activated"
                  selected={stateName === "activated"}
                  onSelect={() => setStateName("activated")}
                />
                <StateChoice
                  label="Collapsed"
                  selected={stateName === "collapsed"}
                  onSelect={() => setStateName("collapsed")}
                />
                <StateChoice
                  label="Clear"
                  selected={stateName === "clear"}
                  onSelect={() => setStateName("clear")}
                />
              </div>
              {stateName === "activated" || stateName === "collapsed" ? (
                <>
                  <p className="copy">
                    You are not ready to visualize. Repeat the settle.
                  </p>
                  <Button tone="neutral" onClick={startSettle}>
                    Repeat settle
                  </Button>
                </>
              ) : null}
              {stateName === "clear" ? (
                <Button onClick={startVisualize}>Continue to visualization</Button>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}

      {stage === "visualize" ? (
        <>
          <p className="lede">
            Hold the outcome as it would exist: objects, rooms, documents, time of day, what a third
            party would see. Do not narrate feelings.
          </p>
          <Panel>
            <p className="kicker">
              Visualization
            </p>
            <p className="text-[22px] font-semibold text-ink">{left}s</p>
            <p className="quiet">
              {visualized ? "Complete. Record what was observed." : "Stay with the picture."}
            </p>
          </Panel>
          {visualized ? (
            <Button onClick={() => setStage("record")}>Record observation</Button>
          ) : null}
        </>
      ) : null}

      {stage === "record" ? (
        <>
          <p className="lede">
            This observation becomes context for capture. Mood is discarded.
          </p>
          <Field
            label="What was observable"
            value={observed}
            onChange={setObserved}
            placeholder="The desk, the page that exists, the calendar hold, the invoice number. What is no longer true."
          />
          {observed ? <Notes notes={quality.ok ? [] : quality.notes} /> : null}
          {quality.ok ? (
            <Panel>
              <p className="copy">Precise enough to use as context.</p>
            </Panel>
          ) : null}
          <Button onClick={finish} disabled={!quality.ok || busy}>
            {busy ? "Recording" : "Complete Zero State"}
          </Button>
        </>
      ) : null}
    </Shell>
  );
}

function titleFor(stage: Stage, running: boolean): string {
  if (stage === "briefing") return "Briefing";
  if (stage === "choose") return "Session";
  if (stage === "guided") return "Guided extraction";
  if (stage === "settle") return running ? "Regulate" : "Settle";
  if (stage === "visualize") return "High-frequency visualization";
  return "Record the observation";
}

function StateChoice({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`control justify-start border ${
        selected ? "border-accent text-accent" : "border-border text-ink"
      }`}
    >
      {label}
    </button>
  );
}
