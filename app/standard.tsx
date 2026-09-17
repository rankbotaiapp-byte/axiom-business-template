import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '../src/components/Screen';
import { Body, Button, Card, Overline, Title } from '../src/components/ui';
import { useStore } from '../src/store';
import { space } from '../src/theme';

export default function StandardScreen() {
  const store = useStore();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function accept() {
    if (busy) return;
    setBusy(true);
    await store.acceptStandard();
    router.replace('/begin');
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Overline>Z Point</Overline>
        <Title>Expectations for use</Title>
      </View>

      <Card>
        <Body>
          You will answer clarifying questions honestly about your responsibilities, capacity, and competing goals.
        </Body>
        <Body>You will only lock a plan when you are prepared to treat it as a primary path.</Body>
        <Body>Missed actions are recorded. Progress is measured by completed evidence, not intention.</Body>
        <Body>The Life Portfolio is a permanent record of what you actually did.</Body>
      </Card>

      <Body muted>If this standard feels too high, leave now.</Body>

      <Button label={busy ? 'Recording' : 'I accept this standard'} onPress={accept} disabled={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
    marginBottom: space.sm,
  },
});
