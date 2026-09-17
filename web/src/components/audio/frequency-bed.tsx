"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  FREQUENCY_BED_FADE_IN_MS,
  FREQUENCY_BED_FADE_OUT_MS,
  FREQUENCY_BED_SRC,
  bedVolume,
  clampVolume,
  type FrequencyBedProfile,
} from "@/lib/audio/frequency-bed";

export type FrequencyBedControls = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  pause: () => Promise<void>;
  setDucked: (ducked: boolean) => void;
};

function fade(audio: HTMLAudioElement, to: number, ms: number): Promise<void> {
  const target = clampVolume(to);
  const from = clampVolume(audio.volume);
  if (ms <= 0 || from === target) {
    audio.volume = target;
    return Promise.resolve();
  }
  const started = performance.now();
  return new Promise((resolve) => {
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / ms);
      const next = clampVolume(from + (target - from) * t);
      audio.volume = next;
      if (t < 1) {
        window.requestAnimationFrame(tick);
      } else {
        audio.volume = target;
        resolve();
      }
    };
    window.requestAnimationFrame(tick);
  });
}

export function useFrequencyBedPlayer(profile: FrequencyBedProfile = "silent"): FrequencyBedControls {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const profileRef = useRef(profile);
  const duckedRef = useRef(false);
  const tokenRef = useRef(0);
  profileRef.current = profile;

  const ensure = useCallback(() => {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio(FREQUENCY_BED_SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    audioRef.current = audio;
    return audio;
  }, []);

  const applyTarget = useCallback((immediate = false) => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = clampVolume(bedVolume(profileRef.current, duckedRef.current));
    if (immediate) {
      audio.volume = target;
      return;
    }
    void fade(audio, target, 280);
  }, []);

  const start = useCallback(async () => {
    const token = ++tokenRef.current;
    const audio = ensure();
    if (audio.paused) {
      audio.volume = 0;
      try {
        await audio.play();
      } catch {
        return;
      }
    }
    if (token !== tokenRef.current) return;
    await fade(audio, bedVolume(profileRef.current, duckedRef.current), FREQUENCY_BED_FADE_IN_MS);
  }, [ensure]);

  const stop = useCallback(async () => {
    tokenRef.current += 1;
    const audio = audioRef.current;
    if (!audio) return;
    await fade(audio, 0, FREQUENCY_BED_FADE_OUT_MS);
    audio.pause();
    audio.currentTime = 0;
  }, []);

  const pause = useCallback(async () => {
    tokenRef.current += 1;
    const audio = audioRef.current;
    if (!audio) return;
    await fade(audio, 0, FREQUENCY_BED_FADE_OUT_MS);
    audio.pause();
  }, []);

  const setDucked = useCallback(
    (ducked: boolean) => {
      duckedRef.current = ducked;
      applyTarget();
    },
    [applyTarget]
  );

  useEffect(() => {
    applyTarget();
  }, [applyTarget, profile]);

  useEffect(() => {
    return () => {
      tokenRef.current += 1;
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  return { start, stop, pause, setDucked };
}

export function FrequencyBed({
  active,
  profile = "silent",
  ducked = false,
}: {
  active: boolean;
  profile?: FrequencyBedProfile;
  ducked?: boolean;
}) {
  const { start, stop, setDucked } = useFrequencyBedPlayer(profile);

  useEffect(() => {
    setDucked(ducked);
  }, [ducked, setDucked]);

  useEffect(() => {
    if (active) void start();
    else void stop();
  }, [active, start, stop]);

  return null;
}
