import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Screen } from '../src/components/Screen';
import { Body, Button, Card, Meta, Overline, Title } from '../src/components/ui';
import { stopVoiceAudio } from '../src/audio';
import { space } from '../src/theme';

export default function DisclaimerScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.container}>
        <Overline>Z Point</Overline>
        <Title>Disclaimer</Title>
        
        <Card>
          <Body>
            This application is a self-improvement tool designed to help you clarify intentions and track progress. It is not medical, psychological, or financial advice.
          </Body>
          <Body>
            If you are experiencing mental health crises, severe anxiety, or depression, please consult with qualified healthcare professionals.
          </Body>
          <Body>
            The system works by helping you document and execute your own intentions. Results depend entirely on your consistent action and honest assessment of capacity.
          </Body>
        </Card>

        <Body muted style={styles.note}>
          By continuing, you acknowledge that you understand this is a self-directed tool and take full responsibility for your use of it.
        </Body>

        <Button
          label="I understand, continue"
          onPress={() => {
            stopVoiceAudio();
            router.push('/briefing');
          }}
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
  note: {
    fontStyle: 'italic',
  },
});
