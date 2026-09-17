import * as Speech from 'expo-speech';

/**
 * Centralized voice configuration for Z Point
 * Using calm, precise settings consistent with a high-quality briefing voice
 */
export const VOICE_CONFIG = {
  language: 'en-US',
  pitch: 0.9, // Slightly lower pitch for calm, authoritative tone
  rate: 0.8, // Slower rate for precision and clarity
} as const;

/**
 * Speak text with consistent Z Point voice settings
 */
export async function speak(text: string, options?: Partial<Speech.SpeechOptions>): Promise<void> {
  return Speech.speak(text, {
    ...VOICE_CONFIG,
    ...options,
  });
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking(): void {
  Speech.stop();
}
