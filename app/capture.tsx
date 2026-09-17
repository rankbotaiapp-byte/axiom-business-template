import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Screen } from '../src/components/Screen';
import { Body, Button, Card, CheckRow, Field, Overline, Title } from '../src/components/ui';
import { assessIntention } from '../src/engine/quality';
import { useStore } from '../src/store';
import { space } from '../src/theme';

export default function CaptureScreen() {
  const store = useStore();
  const router = useRouter();
  const [calm, setCalm] = useState(false);
  const [observable, setObservable] = useState(false);
  const [owned, setOwned] = useState(false);
  const [statement, setStatement] = useState('');
  const [evidence, setEvidence] = useState('');
  const [busy, setBusy] = useState(false);

  const regulated = calm && observable && owned;
  const quality = useMemo(() => assessIntention(statement, evidence), [statement, evidence]);
  const ready = regulated && quality.ok;

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    try {
      await store.captureVision({
        statement: statement.trim(),
        evidence: evidence.trim(),
        regulated,
      });
      router.replace('/vision');
    } catch (error) {
      Alert.alert('Cannot capture', error instanceof Error ? error.message : 'Unknown error');
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Overline>Regulated state</Overline>
        <Title>Capture the vision</Title>
        <Body muted>
          This gate exists so the system does not store urgency, fantasy, or other people&apos;s priorities as if they were yours.
        </Body>
      </View>

      <Card>
        <CheckRow
          label="I am not deciding from panic, fantasy, or borrowed urgency."
          checked={calm}
          onToggle={() => setCalm((value) => !value)}
        />
        <CheckRow
          label="I can state this as an observable outcome, not a feeling."
          checked={observable}
          onToggle={() => setObservable((value) => !value)}
        />
        <CheckRow
          label="I accept that Z Point will not produce this result without my action."
          checked={owned}
          onToggle={() => setOwned((value) => !value)}
        />
      </Card>

      <Field
        label="What must be true"
        value={statement}
        onChangeText={setStatement}
        placeholder="Publish the advisory offer and collect payment from three clients."
        multiline
      />
      <Field
        label="Evidence a third party could verify"
        value={evidence}
        onChangeText={setEvidence}
        placeholder="Three paid invoices. Offer page live. Calendar holds for delivery."
        multiline
      />

      {statement.trim().length > 0 || evidence.trim().length > 0 ? (
        <Card>
          <Overline>Intention quality</Overline>
          {quality.ok ? (
            <Body>Precise enough to plan.</Body>
          ) : (
            quality.notes.map((note) => <Body key={note}>{note}</Body>)
          )}
        </Card>
      ) : null}

      <Button
        label={busy ? 'Saving' : 'Commit vision'}
        onPress={submit}
        disabled={!ready || busy}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
    marginBottom: space.sm,
  },
});
