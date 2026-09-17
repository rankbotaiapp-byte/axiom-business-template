"use client";

import { useEffect, useRef, useState } from "react";

export function useClipPlayer(onDuck: (ducked: boolean) => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  function play(src: string): Promise<void> {
    audioRef.current?.pause();
    const audio = new Audio(src);
    audio.preload = "auto";
    audioRef.current = audio;
    setFailed(false);
    setPlaying(true);
    onDuck(true);

    return new Promise((resolve) => {
      const finish = (error = false) => {
        audio.removeEventListener("ended", onEnded);
        audio.removeEventListener("error", onError);
        setPlaying(false);
        onDuck(false);
        if (error) setFailed(true);
        resolve();
      };
      const onEnded = () => finish(false);
      const onError = () => finish(true);
      audio.addEventListener("ended", onEnded);
      audio.addEventListener("error", onError);
      void audio.play().catch(() => finish(true));
    });
  }

  function stop() {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(false);
    onDuck(false);
  }

  return { play, stop, playing, failed };
}
