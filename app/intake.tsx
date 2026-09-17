import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Screen } from '../src/components/Screen';
import { Body, Button, CheckRow, Field, Overline, Title } from '../src/components/ui';
import { intakeReady } from '../src/engine/capacity';
import { useStore } from '../src/store';
import { space } from '../src/theme';

export default function IntakeScreen() {
  const store = useStore();
  const router = useRouter();
  const [omitted, setOmitted] = useState('');
  const [hours, setHours] = useState('');
  const [competing, setCompeting] = useState('');
  const [honest, setHonest] = useState(false);
  const [actual, setActual] = useState(false);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      store.getIntake().then((row) => {
        if (!row) return;
        setOmitted(row.omittedResponsibilities);
        setHours(row.actualHoursNote);
        setCompeting(row.competingGoals);
      });
    }, [store])
  );

  const ready =
    honest &&
    actual &&
    intakeReady({
      omittedResponsibilities: omitted,
      actualHoursNote: hours,
      competingGoals: competing,
    });

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    try {
      await store.saveIntake({
        omittedResponsibilities: omitted,
        actualHoursNote: hours,
        competingGoals: competing,
      });
      router.replace('/capacity');
    } catch (error) {
      Alert.alert('Intake incomplete', error instanceof Error ? error.message : 'Unknown error');
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Overline>Honesty</Overline>
        <Title>Clarifying questions</Title>
        <Body muted>
          These answers are recorded. A false map produces a false plan. Short or evasive answers will not pass.
        </Body>
      </View>

      <Field
        label="What responsibilities do you usually omit?"
        value={omitted}
        onChangeText={setOmitted}
        placeholder="Care, recovery, debt, commute, the work you pretend is optional."
        multiline
      />
      <Field
        label="What hours do you actually have after those responsibilities?"
        value={hours}
        onChangeText={setHours}
        placeholder="Not the week you wish you had. The week you have."
        multiline
      />
      <Field
        label="What competing goals will take hours from this path?"
        value={competing}
        onChangeText={setCompeting}
        placeholder="Name them. If you claim there are none, say why that is true this week."
        multiline
      />

      <CheckRow
        label="These answers include what I usually leave out."
        checked={honest}
        onToggle={() => setHonest((value) => !value)}
      />
      <CheckRow
        label="The hours I will enter next are actual, not aspirational."
        checked={actual}
        onToggle={() => setActual((value) => !value)}
      />

      <Button label={busy ? 'Saving' : 'Record intake'} onPress={submit} disabled={!ready || busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
    marginBottom: space.sm,
  },
});
