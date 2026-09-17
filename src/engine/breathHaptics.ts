// src/engine/breathHaptics.ts

import * as Haptics from 'expo-haptics';

export type BreathState = {
  inhaling: boolean;
  progress: number; // 0 to 1
};

type BreathHapticsConfig = {
  inhaleDuration: number;   // ms
  exhaleDuration: number;   // ms
  totalDuration: number;    // ms (how long the whole sequence runs)
  onStateChange?: (state: BreathState) => void;
};

export class BreathHaptics {
  private config: BreathHapticsConfig;
  private isRunning = false;
  private startTime = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private currentInhaling = true;

  constructor(config: BreathHapticsConfig) {
    this.config = config;
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = Date.now();
    this.currentInhaling = true;

    // Run the update loop every 100ms
    this.intervalId = setInterval(() => {
      this.update();
    }, 100);

    // Trigger first haptic
    this.triggerHaptic(true);
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private update() {
    if (!this.isRunning) return;

    const elapsed = Date.now() - this.startTime;

    // Stop if total duration reached
    if (elapsed >= this.config.totalDuration) {
      this.stop();
      return;
    }

    const cycleDuration = this.config.inhaleDuration + this.config.exhaleDuration;
    const cyclePosition = elapsed % cycleDuration;

    const isInhaling = cyclePosition < this.config.inhaleDuration;
    const phaseElapsed = isInhaling
      ? cyclePosition
      : cyclePosition - this.config.inhaleDuration;

    const phaseDuration = isInhaling
      ? this.config.inhaleDuration
      : this.config.exhaleDuration;

    const progress = Math.min(phaseElapsed / phaseDuration, 1);

    // Notify state change when switching inhale/exhale
    if (isInhaling !== this.currentInhaling) {
      this.currentInhaling = isInhaling;
      this.triggerHaptic(isInhaling);
    }

    if (this.config.onStateChange) {
      this.config.onStateChange({
        inhaling: isInhaling,
        progress,
      });
    }
  }

  private triggerHaptic(isInhaling: boolean) {
    if (isInhaling) {
      // Stronger pulse for inhale start
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      // Softer pulse for exhale start
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }
}