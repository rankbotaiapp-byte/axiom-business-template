const VAGUE = /\b(happy|joy|peace|abundant|aligned|inspired|vibes|manifest|best self|energy)\b/i;

export const SETTLE_SECONDS = 90;
export const VISUALIZE_SECONDS = 90;

export const BRIEFING_SRC = "/audio/zero-state-briefing.mp3";
export const BRIEFING_HEARD_KEY = "zpoint.briefing.heard";
export const HAPTIC_PULSE_KEY = "zpoint.haptic-pulse.enabled";

export const BRIEFING_SCRIPT = `Before we begin, a short briefing.

The quality of what you define next depends on the state you are in right now.

Most people set goals from noise — residual stress, obligation, comparison, or incomplete information. That produces plans that look ambitious on the surface and collapse under real constraints.

This system works differently.

For the next two minutes, the only task is to reach a cleaner baseline. A regulated nervous system. Reduced mental static. Enough physical calm that you can observe what you actually want instead of what you think you should want.

Here is how to use the coming frequency session:

Sit or stand in a stable position.
Let your breathing settle into a steady rhythm.
Allow unnecessary tension in the face, shoulders, and hands to release.
When the sound begins, do not force imagery. Simply maintain a quiet, open attention.

From this state you will be asked to define what you want with precision.
You will also be asked for honest constraints — time, energy, responsibilities, and non-negotiables.

The system cannot create results for you.
It can only work with coherent input, a capacity-aware sequence, recorded evidence, and consistent execution.

Your job in the next few minutes is to arrive at the clearest possible signal.

When you are ready, we begin.`;

export function briefingAlreadyHeard(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(BRIEFING_HEARD_KEY) === "1";
}

export function markBriefingHeard(): void {
  window.localStorage.setItem(BRIEFING_HEARD_KEY, "1");
}

export function hapticPulseEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const value = window.localStorage.getItem(HAPTIC_PULSE_KEY);
  return value === "1" || value === "true";
}

export function setHapticPulseEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HAPTIC_PULSE_KEY, enabled ? "1" : "0");
}

export function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function assessObservation(observed: string): { ok: boolean; notes: string[] } {
  const notes: string[] = [];
  const text = observed.trim();
  if (text.length < 40) {
    notes.push("The observation is too thin. Write what was visible, audible, or materially present.");
  }
  if (VAGUE.test(text)) {
    notes.push("Keep the record observable. Feeling-language is not context.");
  }
  if (!/\b(see|saw|heard|on the|desk|page|calendar|invoice|room|body|hand|screen|door|table|clock)\b/i.test(text)) {
    notes.push("Name concrete objects or actions. High-frequency visualization produces detail, not mood.");
  }
  return { ok: notes.length === 0, notes };
}
