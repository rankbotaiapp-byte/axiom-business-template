import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VOICE_PREFERENCE_KEY = '@zpoint_voice_preference';
const BACKGROUND_BED_PREFERENCE_KEY = '@zpoint_background_bed_preference';

export type VoicePreference = 'male' | 'female';

export type BackgroundBedPreference = 'clear' | '528' | 'deep' | 'off';

const BACKGROUND_BED_VOLUME = 0.12;

/**
 * Background frequency bed files
 */
const BACKGROUND_BED_FILES = {
  clear: require('../assets/audio/frequency-bed-clear.mp3'),
  '528': require('../assets/audio/frequency-bed-528.mp3'),
  deep: require('../assets/audio/frequency-bed-deep.mp3'),
} as const;

/**
 * Old audio steps – kept only for type compatibility.
 * The real guide voices are now handled by guideVoices.ts
 */
const AUDIO_FILES = {
  introDisclaimerBriefing: {
    male: null as any,
    female: null as any,
  },
  sessionBriefingZeroPoint: {
    male: null as any,
    female: null as any,
  },
  zeroPointReachedExtractionStart: {
    male: null as any,
    female: null as any,
  },
  extractionQuestions: {
    male: null as any,
    female: null as any,
  },
  extractionComplete: {
    male: null as any,
    female: null as any,
  },
  sessionClose: {
    male: null as any,
    female: null as any,
  },
} as const;

export type AudioStep = keyof typeof AUDIO_FILES;

let currentSound: Audio.Sound | null = null;
let currentBackgroundBedSound: Audio.Sound | null = null;
let currentBackgroundBedPreference: BackgroundBedPreference = 'off';

/**
 * Get the user's voice preference
 */
export async function getVoicePreference(): Promise<VoicePreference> {
  try {
    const preference = await AsyncStorage.getItem(VOICE_PREFERENCE_KEY);
    return (preference as VoicePreference) || 'male';
  } catch (error) {
    console.error('Error getting voice preference:', error);
    return 'male';
  }
}

/**
 * Set the user's voice preference
 */
export async function setVoicePreference(preference: VoicePreference): Promise<void> {
  try {
    await AsyncStorage.setItem(VOICE_PREFERENCE_KEY, preference);
  } catch (error) {
    console.error('Error setting voice preference:', error);
  }
}

/**
 * Stop any currently playing voice audio
 */
export async function stopVoiceAudio(): Promise<void> {
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch (error) {
      console.error('Error stopping voice audio:', error);
    }
    currentSound = null;
  }
}

/**
 * Play a specific audio step (legacy – currently disabled)
 */
export async function playVoiceAudio(step: AudioStep, onEnd?: () => void): Promise<void> {
  console.log(`[Voice Audio] Legacy playVoiceAudio called for ${step} – skipping (using new guide system)`);
  // Immediately call onEnd so the session continues
  onEnd?.();
}

/**
 * Check if voice audio is currently playing
 */
export function isVoiceAudioPlaying(): boolean {
  return currentSound !== null;
}

/**
 * Get the user's background bed preference
 */
export async function getBackgroundBedPreference(): Promise<BackgroundBedPreference> {
  try {
    const preference = await AsyncStorage.getItem(BACKGROUND_BED_PREFERENCE_KEY);
    return (preference as BackgroundBedPreference) || 'clear';
  } catch (error) {
    console.error('Error getting background bed preference:', error);
    return 'clear';
  }
}

/**
 * Set the user's background bed preference
 */
export async function setBackgroundBedPreference(preference: BackgroundBedPreference): Promise<void> {
  try {
    await AsyncStorage.setItem(BACKGROUND_BED_PREFERENCE_KEY, preference);
  } catch (error) {
    console.error('Error setting background bed preference:', error);
  }
}

/**
 * Stop any currently playing background frequency bed
 */
export async function stopBackgroundBed(): Promise<void> {
  if (currentBackgroundBedSound) {
    try {
      await currentBackgroundBedSound.stopAsync();
      await currentBackgroundBedSound.unloadAsync();
    } catch (error) {
      console.error('Error stopping background bed:', error);
    }
    currentBackgroundBedSound = null;
  }
  currentBackgroundBedPreference = 'off';
}

/**
 * Start the background frequency bed
 */
export async function startBackgroundBed(preference: BackgroundBedPreference): Promise<void> {
  await stopBackgroundBed();

  if (preference === 'off') {
    return;
  }

  try {
    const audioFile = BACKGROUND_BED_FILES[preference];

    console.log(`[Background Bed] Starting ${preference} bed`);

    const { sound } = await Audio.Sound.createAsync(audioFile, {
      shouldPlay: true,
      isLooping: true,
      volume: BACKGROUND_BED_VOLUME,
    });

    currentBackgroundBedSound = sound;
    currentBackgroundBedPreference = preference;
  } catch (error) {
    console.error(`[Background Bed] Error starting ${preference} bed:`, error);
  }
}

/**
 * Get the currently active background bed preference
 */
export function getActiveBackgroundBed(): BackgroundBedPreference {
  return currentBackgroundBedPreference;
}