"use client";

import { useEffect, useRef, useState } from "react";

type SpeechCtor = new () => SpeechRecognitionLike;

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

export type ListenStatus = "idle" | "requesting" | "listening" | "unsupported" | "denied" | "empty";

const WINDOW_MS = 28000;
const SILENCE_MS = 2600;
const MIN_USABLE = 8;

function recognitionCtor(): SpeechCtor | null {
  const host = window as typeof window & {
    SpeechRecognition?: SpeechCtor;
    webkitSpeechRecognition?: SpeechCtor;
  };
  return host.SpeechRecognition ?? host.webkitSpeechRecognition ?? null;
}

export function useSpeechCapture() {
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceRef = useRef<number | null>(null);
  const windowRef = useRef<number | null>(null);
  const finalRef = useRef("");
  const [status, setStatus] = useState<ListenStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(Boolean(recognitionCtor()));
    return () => stop();
  }, []);

  function clearTimers() {
    if (silenceRef.current) window.clearTimeout(silenceRef.current);
    if (windowRef.current) window.clearTimeout(windowRef.current);
    silenceRef.current = null;
    windowRef.current = null;
  }

  function releaseMic() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function finish(next: string) {
    clearTimers();
    recRef.current?.stop();
    recRef.current = null;
    releaseMic();
    const text = next.trim();
    setTranscript(text);
    setStatus(text.length >= MIN_USABLE ? "idle" : "empty");
  }

  async function start(): Promise<string> {
    const Ctor = recognitionCtor();
    if (!Ctor) {
      setSupported(false);
      setStatus("unsupported");
      return "";
    }

    stop();
    finalRef.current = "";
    setTranscript("");
    setStatus("requesting");

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus("denied");
      return "";
    }

    return new Promise((resolve) => {
      const rec = new Ctor();
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.continuous = true;
      rec.maxAlternatives = 1;
      recRef.current = rec;
      setStatus("listening");

      const done = (text: string) => {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        finish(text);
        resolve(text.trim().length >= MIN_USABLE ? text.trim() : "");
      };

      rec.onresult = (event) => {
        let interim = "";
        let nextFinal = finalRef.current;
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) nextFinal = `${nextFinal} ${piece}`.trim();
          else interim = `${interim} ${piece}`.trim();
        }
        finalRef.current = nextFinal;
        setTranscript((nextFinal || interim).trim());
        if (silenceRef.current) window.clearTimeout(silenceRef.current);
        if (nextFinal.length >= MIN_USABLE) {
          silenceRef.current = window.setTimeout(() => done(nextFinal), SILENCE_MS);
        }
      };

      rec.onerror = (event) => {
        if (event.error === "not-allowed") {
          setStatus("denied");
          done("");
          return;
        }
        done(finalRef.current);
      };

      rec.onend = () => {
        if (recRef.current === rec) done(finalRef.current);
      };

      windowRef.current = window.setTimeout(() => done(finalRef.current), WINDOW_MS);

      try {
        rec.start();
      } catch {
        done("");
      }
    });
  }

  function stop() {
    clearTimers();
    recRef.current?.abort();
    recRef.current = null;
    releaseMic();
  }

  return { status, transcript, supported, start, stop };
}
