import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Audio } from 'expo-av';

import { Screen } from '../src/components/Screen';
import { Body, Button, Card, CheckRow, Meta, Overline, Title } from '../src/components/ui';
import {
  getBackgroundBedPreference,
  getVoicePreference,
  setBackgroundBedPreference,
  setVoicePreference,
  type BackgroundBedPreference,
  type VoicePreference,
} from '../src/audio';
import { SessionEngine, type SessionPhase } from '../src/sessionEngine';
import { space } from '../src/theme';
import { getGuideClip } from '../src/audio/guideVoices';
import { getDroneSource } from '../src/audio/droneFrequencies';

const BACKGROUND_BED_OPTIONS: { value: BackgroundBedPreference; label: string }[] = [
  { value: 'clear', label: 'Clear' },
  { value: '528', label: 'Frequency (528Hz)' },
  { value: 'deep', label: 'Deep' },
  { value: 'off', label: 'Off' },
];

export default function SessionScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [voicePreference, setVoicePreferenceState] = useState<VoicePreference>('male');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [backgroundBed, setBackgroundBedState] = useState<BackgroundBedPreference>('clear');
  const [breathState, setBreathState] = useState({ inhaling: false, cycleTime: 11000 });
  const [settlingTime, setSettlingTime] = useState(75);

  const [engine] = useState(() => new SessionEngine({
    voiceEnabled: true,
    hapticsEnabled: true,
    voicePreference: 'male',
    backgroundBed: 'clear',
  }));

  // Load saved preferences + engine setup
  useEffect(() => {
    getVoicePreference().then((pref) => {
      setVoicePreferenceState(pref);
      engine.updateConfig({ voicePreference: pref });
    });

    getBackgroundBedPreference().then((pref) => {
      setBackgroundBedState(pref);
      engine.updateConfig({ backgroundBed: pref });
    });

    // Register phase callbacks
    engine.onPhase('briefing', () => setPhase('briefing'));
    engine.onPhase('settling', () => setPhase('settling'));
    engine.onPhase('zeroPoint', () => setPhase('zeroPoint'));
    engine.onPhase('extraction', () => setPhase('extraction'));
    engine.onPhase('capture', () => setPhase('capture'));
    engine.onPhase('confirmation', () => setPhase('confirmation'));
    engine.onPhase('close', () => setPhase('close'));
    engine.onPhase('complete', () => setPhase('complete'));

    // Update breath state periodically during settling
    const breathInterval = setInterval(() => {
      if (engine.getPhase() === 'settling') {
        setBreathState(engine.getBreathState());
      }
    }, 100);

    return () => {
      clearInterval(breathInterval);
      engine.cleanup();
    };
  }, [engine]);

  // ===== TEMPORARY AUDIO TEST =====
  useEffect(() => {
    async function testAudio() {
      try {
        console.log('Testing Guide Voice...');
        const guideSound = new Audio.Sound();
        await guideSound.loadAsync(getGuideClip('guide_08_welcome_instructions'));
        await guideSound.playAsync();

        setTimeout(async () => {
          await guideSound.stopAsync();
          await guideSound.unloadAsync();
        }, 8000);

        console.log('Testing Drone...');
        const droneSound = new Audio.Sound();
        await droneSound.loadAsync(getDroneSource(150));
        await droneSound.setIsLoopingAsync(true);
        await droneSound.playAsync();

        setTimeout(async () => {
          await droneSound.stopAsync();
          await droneSound.unloadAsync();
        }, 12000);

      } catch (error) {
        console.error('Audio test failed:', error);
      }
    }

    testAudio();
  }, []);

  async function handleStart() {
    setPhase('briefing');
    await engine.start();
  }

  async function handleCompleteCapture() {
    await engine.completeCapture();
  }

  async function handleVoicePreferenceChange(pref: VoicePreference) {
    setVoicePreferenceState(pref);
    await setVoicePreference(pref);
    engine.updateConfig({ voicePreference: pref });
  }

  async function handleBackgroundBedChange(pref: BackgroundBedPreference) {
    setBackgroundBedState(pref);
    await setBackgroundBedPreference(pref);
    engine.updateConfig({ backgroundBed: pref });
  }

  function handleVoiceToggle() {
    const newValue = !voiceEnabled;
    setVoiceEnabled(newValue);
    engine.updateConfig({ voiceEnabled: newValue });
  }

  function handleHapticsToggle() {
    const newValue = !hapticsEnabled;
    setHapticsEnabled(newValue);
    engine.updateConfig({ hapticsEnabled: newValue });
  }

  function handleEmergencyStop() {
    engine.emergencyStop();
    setPhase('idle');
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Overline>Z Point Session</Overline>
        <Title>
          {phase === 'idle' && 'Ready to begin'}
          {phase === 'briefing' && 'Session briefing'}
          {phase === 'settling' && 'Settling into coherence'}
          {phase === 'zeroPoint' && 'Zero point reached'}
          {phase === 'extraction' && 'Extraction in progress'}
          {phase === 'capture' && 'Capture your intention'}
          {phase === 'confirmation' && 'Confirmation'}
          {phase === 'close' && 'Session closing'}
          {phase === 'complete' && 'Session complete'}
        </Title>

        {phase === 'idle' && (
          <View style={styles.content}>
            <Card>
              <Body>
                This session will guide you through a precise sequence: briefing, settling into coherence, zero point, extraction, and confirmation.
              </Body>
              <Body>
                The entire experience is timed and guided. You will be led through each phase automatically.
              </Body>
            </Card>

            <View style={styles.controlsSection}>
              <Meta>Session controls:</Meta>
              
              <CheckRow
                label="Voice guidance"
                checked={voiceEnabled}
                onToggle={handleVoiceToggle}
              />
              
              <CheckRow
                label="Breath haptics"
                checked={hapticsEnabled}
                onToggle={handleHapticsToggle}
              />

              <Meta>Voice preference:</Meta>
              <View style={styles.voiceChoices}>
                <CheckRow
                  label="Male voice"
                  checked={voicePreference === 'male'}
                  onToggle={() => handleVoicePreferenceChange('male')}
                  radio
                />
                <CheckRow
                  label="Female voice"
                  checked={voicePreference === 'female'}
                  onToggle={() => handleVoicePreferenceChange('female')}
                  radio
                />
              </View>

              <Meta>Background audio:</Meta>
              <View style={styles.voiceChoices}>
                {BACKGROUND_BED_OPTIONS.map((option) => (
                  <CheckRow
                    key={option.value}
                    label={option.label}
                    checked={backgroundBed === option.value}
                    onToggle={() => handleBackgroundBedChange(option.value)}
                    radio
                  />
                ))}
              </View>
            </View>

            <Button label="Begin Session" onPress={handleStart} />
          </View>
        )}

        {phase === 'briefing' && (
          <Card>
            <Overline>Phase 1/7</Overline>
            <Title>Session briefing</Title>
            <Meta>Listen carefully to the guidance...</Meta>
          </Card>
        )}

        {phase === 'settling' && (
          <Card>
            <Overline>Phase 2/7</Overline>
            <Title>Settling into coherence</Title>
            <Meta>
              {hapticsEnabled 
                ? `Follow the breath guidance. ${breathState.inhaling ? 'Inhale...' : 'Exhale...'}`
                : 'Breathe naturally and settle...'}
            </Meta>
            <Body muted>
              Settling duration: {settlingTime} seconds
            </Body>
          </Card>
        )}

        {phase === 'zeroPoint' && (
          <Card>
            <Overline>Phase 3/7</Overline>
            <Title>Zero point reached</Title>
            <Meta>You are now in coherence. Remain still...</Meta>
          </Card>
        )}

        {phase === 'extraction' && (
          <Card>
            <Overline>Phase 4/7</Overline>
            <Title>Extraction guidance</Title>
            <Meta>Listen to the extraction questions...</Meta>
          </Card>
        )}

        {phase === 'capture' && (
          <View style={styles.content}>
            <Card>
              <Overline>Phase 5/7</Overline>
              <Title>Capture your intention</Title>
              <Body>
                What is the highest version of the reality you are choosing? Speak it clearly or enter it below.
              </Body>
            </Card>

            <Card>
              <Overline>Your intention</Overline>
              <Body muted>
                [Voice capture or text input would go here]
              </Body>
            </Card>

            <Button label="Complete Capture" onPress={handleCompleteCapture} />
          </View>
        )}

        {phase === 'confirmation' && (
          <Card>
            <Overline>Phase 6/7</Overline>
            <Title>Confirmation</Title>
            <Meta>Your intention has been captured...</Meta>
          </Card>
        )}

        {phase === 'close' && (
          <Card>
            <Overline>Phase 7/7</Overline>
            <Title>Session closing</Title>
            <Meta>The session is concluding...</Meta>
          </Card>
        )}

        {phase === 'complete' && (
          <View style={styles.content}>
            <Card>
              <Overline>Complete</Overline>
              <Title>Session finished</Title>
              <Body>
                You have completed the Zero Point session. Your intention has been captured and the system is ready for the next phase.
              </Body>
            </Card>

            <Button 
              label="Continue to Vision Capture" 
              onPress={() => router.push('/begin')} 
            />
          </View>
        )}

        {(phase !== 'idle' && phase !== 'complete') && (
          <Button
            label="Emergency Stop"
            onPress={handleEmergencyStop}
            tone="danger"
            variant="secondary"
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: space.lg,
  },
  content: {
    gap: space.md,
  },
  controlsSection: {
    gap: space.sm,
  },
  voiceChoices: {
    gap: space.xs,
  },
});