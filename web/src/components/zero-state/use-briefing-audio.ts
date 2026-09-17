"use client";

import { useEffect, useRef, useState } from "react";

import { BRIEFING_SRC, briefingAlreadyHeard, markBriefingHeard } from "@/lib/zero-state";

export type BriefingPhase = "idle" | "playing" | "ended" | "error";

export function useBriefingAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [phase, setPhase] = useState<BriefingPhase>("idle");
  const [heard, setHeard] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setHeard(briefingAlreadyHeard());
    const audio = new Audio(BRIEFING_SRC);
    audio.preload = "auto";
    audioRef.current = audio;

    const onTime = () => setElapsed(audio.currentTime);
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onEnded = () => {
      markBriefingHeard();
      setHeard(true);
      setPhase("ended");
    };
    const onError = () => setPhase("error");

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, []);

  async function play() {
    const audio = audioRef.current;
    if (!audio || phase === "playing") return;
    try {
      audio.currentTime = 0;
      setElapsed(0);
      setPhase("playing");
      await audio.play();
    } catch {
      setPhase("error");
    }
  }

  function stop() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }

  return { phase, heard, elapsed, duration, play, stop };
}
