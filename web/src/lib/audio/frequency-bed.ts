/** Seamless 18 s stereo loop. 72/81 Hz binaural (9 Hz) + light low texture + faint air. */
export const FREQUENCY_BED_SRC = "/audio/frequency-bed.wav";

/**
 * Mix notes. Voice clips play at element volume 1.0.
 * Bed stays 12–18 dB under speech when ducked.
 */
export const FREQUENCY_BED_VOLUME = {
  silent: 0.16,
  guided: 0.11,
  ducked: 0.04,
} as const;

export type FrequencyBedProfile = keyof typeof FREQUENCY_BED_VOLUME;

export const FREQUENCY_BED_FADE_IN_MS = 1400;
export const FREQUENCY_BED_FADE_OUT_MS = 900;

export function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function bedVolume(profile: FrequencyBedProfile, ducked = false): number {
  const base = ducked && profile === "guided" ? FREQUENCY_BED_VOLUME.ducked : FREQUENCY_BED_VOLUME[profile];
  return clampVolume(base);
}
