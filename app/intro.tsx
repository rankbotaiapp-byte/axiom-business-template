import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Screen } from '../src/components/Screen';
import { Body, Button, Meta, Overline, Title } from '../src/components/ui';
import { space } from '../src/theme';

export default function IntroScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.container}>
        <Overline>Z Point</Overline>
        <Title>Coherent intention. Documented execution.</Title>
        
        <View style={styles.content}>
          <Body>
            This system is designed for serious practitioners who understand that manifestation requires precise input, not vague hoping.
          </Body>
          <Body>
            The app will guide you through a structured process to extract and execute your highest intentions with measurable evidence.
          </Body>
          <Body>
            This is not a motivation product. It is a precision tool for those ready to treat their intentions as work that must be planned, tracked, and completed.
          </Body>
        </View>

        <Body muted style={styles.note}>
          The system does not create results. It requires coherent input, a capacity-aware sequence, a formal lock, and recorded evidence.
        </Body>

        <Button
          label="Continue"
          onPress={() => router.push('/disclaimer')}
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
  content: {
    gap: space.md,
  },
  note: {
    fontStyle: 'italic',
  },
});
