import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

import {
  startBackgroundBed,
  stopBackgroundBed,
  type BackgroundBedPreference,
  type VoicePreference,
} from './audio';
import { getGuideClip, type GuideClipId } from './audio/guideVoices';

// ===== TIMING CONFIG =====
const SETTLING_DURATION = 7 * 60 * 1000; // 7 minutes
const INHALE_DURATION = 5000;            // 5 seconds
const EXHALE_DURATION = 6500;            // 6.5 seconds
const BREATH_CYCLE_DURATION = INHALE_DURATION + EXHALE_DURATION;

export type SessionPhase =
  | 'idle'
  | 'briefing'
  | 'settling'
  | 'zeroPoint'
  | 'extraction'
  | 'capture'
  | 'confirmation'
  | 'close'
  | 'complete';

export type SessionConfig = {
  voiceEnabled: boolean;
  hapticsEnabled: boolean;
  voicePreference: VoicePreference;
  backgroundBed: BackgroundBedPreference;
};

export class SessionEngine {
  private phase: SessionPhase = 'idle';
  private config: SessionConfig;
  private settlingTimer: NodeJS.Timeout | null = null;
  private breathTimer: NodeJS.Timeout | null = null;
  private phaseCallbacks: Map<SessionPhase, () => void> = new Map();
  private activeInhale: boolean = false;
  private settlingStartTime: number = 0;
  private currentSound: Audio.Sound | null = null;

  constructor(config: SessionConfig) {
    this.config = config;
  }

  onPhase(phase: SessionPhase, callback: () => void): void {
    this.phaseCallbacks.set(phase, callback);
  }

  getPhase(): SessionPhase {
    return this.phase;
  }

  // ===== NEW GUIDE PLAYER =====
  private async playGuide(clipId: GuideClipId): Promise<void> {
    try {
      if (this.currentSound) {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
        this.currentSound = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        getGuideClip(clipId, this.config.voicePreference as any)
      );

      this.currentSound = sound;

      await new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            resolve();
          }
        });
        sound.playAsync();
      });

      await sound.unloadAsync();
      this.currentSound = null;
    } catch (error) {
      console.error(`[Session Engine] Failed to play ${clipId}:`, error);
    }
  }

  async start(): Promise<void> {
    if (this.phase !== 'idle') {
      console.warn('Session already in progress');
      return;
    }

    console.log('[Session Engine] Starting session');
    this.phase = 'briefing';
    this.phaseCallbacks.get('briefing')?.();

    try {
      await this.startFrequencyBed();

      if (this.config.voiceEnabled) {
        // Play the main welcome + instructions
        await this.playGuide('guide_08_welcome_instructions');
        await this.playGuide('guide_09_breath_begin');
      }

      this.transitionToSettling();
    } catch (error) {
      console.error('[Session Engine] Error starting session:', error);
      this.cleanup();
    }
  }

  private async transitionToSettling(): Promise<void> {
    this.phase = 'settling';
    this.phaseCallbacks.get('settling')?.();
    this.settlingStartTime = Date.now();

    console.log('[Session Engine] Entering settling phase');

    if (this.config.hapticsEnabled) {
      this.startBreathHaptics();
    }

    this.settlingTimer = setTimeout(() => {
      console.log('[Session Engine] Settling complete → zero point');
      this.transitionToZeroPoint();
    }, SETTLING_DURATION);
  }

  private startBreathHaptics(): void {
    console.log('[Session Engine] Starting breath haptics');

    const runBreathCycle = () => {
      if (this.phase !== 'settling') return;

      this.activeInhale = true;
      this.triggerInhaleHaptic();

      this.breathTimer = setTimeout(() => {
        if (this.phase !== 'settling') return;

        this.activeInhale = false;
        this.triggerExhaleHaptic();

        this.breathTimer = setTimeout(() => {
          runBreathCycle();
        }, EXHALE_DURATION);
      }, INHALE_DURATION);
    };

    runBreathCycle();
  }

  private triggerInhaleHaptic(): void {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setTimeout(() => {
      if (this.activeInhale) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    }, 1800);
  }

  private triggerExhaleHaptic(): void {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }

  private async startFrequencyBed(): Promise<void> {
    if (this.config.backgroundBed === 'off') return;
    console.log(`[Session Engine] Starting frequency bed: ${this.config.backgroundBed}`);
    await startBackgroundBed(this.config.backgroundBed);
  }

  private async transitionToZeroPoint(): Promise<void> {
    this.stopBreathHaptics();
    this.phase = 'zeroPoint';
    this.phaseCallbacks.get('zeroPoint')?.();

    console.log('[Session Engine] Entering zero point phase');

    if (this.config.voiceEnabled) {
      await this.playGuide('guide_10_arrival');
    }

    this.transitionToExtraction();
  }

  private async transitionToExtraction(): Promise<void> {
    this.phase = 'extraction';
    this.phaseCallbacks.get('extraction')?.();

    console.log('[Session Engine] Entering extraction phase');

    if (this.config.voiceEnabled) {
      await this.playGuide('guide_11_extraction');
    }

    this.phase = 'capture';
    this.phaseCallbacks.get('capture')?.();
  }

  async completeCapture(): Promise<void> {
    if (this.phase !== 'capture') return;

    console.log('[Session Engine] Capture complete → confirmation');
    this.phase = 'confirmation';
    this.phaseCallbacks.get('confirmation')?.();

    if (this.config.voiceEnabled) {
      await this.playGuide('guide_12_materializing');
      // Later we will trigger the actual AI materialization here
      await this.playGuide('guide_13_reveal');
    }

    this.transitionToClose();
  }

  private async transitionToClose(): Promise<void> {
    this.phase = 'close';
    this.phaseCallbacks.get('close')?.();

    console.log('[Session Engine] Entering close phase');

    if (this.config.voiceEnabled) {
      await this.playGuide('guide_14_closing');
    }

    this.phase = 'complete';
    this.phaseCallbacks.get('complete')?.();
    this.cleanup();
  }

  private stopBreathHaptics(): void {
    if (this.breathTimer) {
      clearTimeout(this.breathTimer);
      this.breathTimer = null;
    }
    this.activeInhale = false;
  }

  private stopSettlingTimer(): void {
    if (this.settlingTimer) {
      clearTimeout(this.settlingTimer);
      this.settlingTimer = null;
    }
  }

  private async stopFrequencyBed(): Promise<void> {
    await stopBackgroundBed();
  }

  async cleanup(): Promise<void> {
    console.log('[Session Engine] Cleaning up');
    this.stopSettlingTimer();
    this.stopBreathHaptics();
    await this.stopFrequencyBed();

    if (this.currentSound) {
      await this.currentSound.stopAsync();
      await this.currentSound.unloadAsync();
      this.currentSound = null;
    }

    this.phase = 'idle';
    this.phaseCallbacks.clear();
  }

  async emergencyStop(): Promise<void> {
    console.log('[Session Engine] Emergency stop');
    await this.cleanup();
  }

  updateConfig(config: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.hapticsEnabled !== undefined && this.phase === 'settling') {
      if (config.hapticsEnabled && !this.breathTimer) {
        this.startBreathHaptics();
      } else if (!config.hapticsEnabled) {
        this.stopBreathHaptics();
      }
    }

    if (config.backgroundBed !== undefined && this.phase !== 'idle' && this.phase !== 'complete') {
      if (config.backgroundBed === 'off') {
        this.stopFrequencyBed();
      } else {
        startBackgroundBed(config.backgroundBed);
      }
    }
  }

  getBreathState(): { inhaling: boolean; cycleTime: number } {
    return {
      inhaling: this.activeInhale,
      cycleTime: BREATH_CYCLE_DURATION,
    };
  }

  getSettlingProgress(): number {
    if (this.phase !== 'settling' || !this.settlingStartTime) return 0;
    const elapsed = Date.now() - this.settlingStartTime;
    return Math.min(elapsed / SETTLING_DURATION, 1);
  }
}