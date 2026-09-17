import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '../src/components/Screen';
import { Body, Button, Card, CheckRow, Meta, Overline, Title } from '../src/components/ui';
import { getVoicePreference, playVoiceAudio, setVoicePreference, stopVoiceAudio, type VoicePreference } from '../src/audio';
import { space } from '../src/theme';

export default function BriefingScreen() {
  const router = useRouter();
  const [audioOn, setAudioOn] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voicePreference, setVoicePreferenceState] = useState<VoicePreference>('male');

  useEffect(() => {
    // Load saved voice preference
    getVoicePreference().then(setVoicePreferenceState);
  }, []);

  useEffect(() => {
    if (audioOn) {
      playBriefingAudio();
    }
    return () => {
      stopVoiceAudio();
    };
  }, [audioOn, voicePreference]);

  async function playBriefingAudio() {
    if (!audioOn) return;
    
    setIsPlaying(true);
    try {
      await playVoiceAudio('introDisclaimerBriefing', () => {
        setIsPlaying(false);
      });
    } catch (error) {
      console.log('Audio error:', error);
      setIsPlaying(false);
    }
  }

  function toggleAudio() {
    if (audioOn) {
      stopVoiceAudio();
      setAudioOn(false);
      setIsPlaying(false);
    } else {
      setAudioOn(true);
      playBriefingAudio();
    }
  }

  async function handleVoicePreferenceChange(preference: VoicePreference) {
    setVoicePreferenceState(preference);
    await setVoicePreference(preference);
    // If audio is playing, restart with new voice
    if (audioOn) {
      stopVoiceAudio();
      setTimeout(() => playBriefingAudio(), 100);
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Overline>Z Point</Overline>
        <Title>Briefing</Title>
        
        <Card>
          <Body style={styles.briefingText}>
            Welcome to Z Point. This system operates on a single principle: coherent intention, documented execution.

The process is structured. First, you will be guided into a regulated state. This is not relaxation—it is coherence. From this state, you will visualize the highest version of your chosen reality in observable terms.

Next, the system will extract your context: responsibilities, actual capacity, competing goals, and hard constraints. This map ensures your plan is grounded in reality, not aspiration.

Then you will capture your vision as a precise operational outcome with evidence that can be verified by a third party.

Finally, the system generates a locked sequence of steps. Each step requires documented evidence before the sequence advances. Intention does not count. Only evidenced completion.

The path from beginning to end is designed to eliminate fantasy and enforce execution. This is serious work for serious practitioners.

You may now begin.
          </Body>
        </Card>

        <Meta style={styles.audioNote}>
          {audioOn ? 'Voice guidance on' : 'Voice guidance off'}
        </Meta>

        <Button
          label={audioOn ? 'Voice Off' : 'Voice On'}
          onPress={toggleAudio}
          variant="secondary"
        />

        <View style={styles.voiceSection}>
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
        </View>

        <Button
          label={isPlaying ? 'Audio playing...' : 'Begin the Process'}
          onPress={() => {
            stopVoiceAudio();
            router.push('/begin');
          }}
          disabled={isPlaying}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: space.lg,
  },
  briefingText: {
    lineHeight: 24,
  },
  audioNote: {
    textAlign: 'center',
  },
  voiceSection: {
    gap: space.sm,
  },
  voiceChoices: {
    gap: space.xs,
  },
});
