import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, Field, Meta, Overline, StatusMark, Title } from '../../src/components/ui';
import { formatDate } from '../../src/format';
import { formatHours, useStore } from '../../src/store';
import { space } from '../../src/theme';
import type { Step, ThresholdKey, Vision } from '../../src/types';
import { THRESHOLD_COPY } from '../../src/types';

export default function StepScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const [step, setStep] = useState<Step | null>(null);
  const [vision, setVision] = useState<Vision | null>(null);
  const [action, setAction] = useState('');
  const [outcome, setOutcome] = useState('');
  const [crossed, setCrossed] = useState<ThresholdKey[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const next = await store.getStep(id);
    setStep(next);
    if (next) {
      setVision(await store.getActiveVision());
    }
  }, [id, store]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!step) {
    return (
      <Screen>
        <Body muted>Step not found.</Body>
      </Screen>
    );
  }

  const complete = step.status === 'complete';
  const executable = Boolean(vision?.planLocked) && !complete;

  async function run(task: () => Promise<ThresholdKey[]>) {
    if (busy) return;
    setBusy(true);
    try {
      const keys = await task();
      setCrossed(keys);
      await load();
    } catch (error) {
      Alert.alert('Not recorded', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <StatusMark status={step.status === 'complete' ? 'complete' : step.status === 'active' ? 'active' : 'pending'} />
        <Title>{step.title}</Title>
        <Meta>
          {step.phase} · {formatHours(step.hours)}
          {step.dueAt ? ` · due ${formatDate(step.dueAt)}` : ''}
        </Meta>
        {vision ? <Body muted>{vision.statement}</Body> : null}
      </View>

      <Card>
        <Overline>Action</Overline>
        <Body>{step.action}</Body>
        <Overline>Required evidence</Overline>
        <Body muted>{step.evidence}</Body>
        <Overline>Method</Overline>
        <Meta>{step.principle}</Meta>
      </Card>

      {!vision?.planLocked && !complete ? (
        <Card>
          <Overline>Draft</Overline>
          <Body>This step is not executable. Lock the plan as the primary path first.</Body>
        </Card>
      ) : null}

      {complete ? (
        <Card>
          <Overline>Documented outcome</Overline>
          <Body>{step.outcome}</Body>
        </Card>
      ) : executable ? (
        <>
          <View style={styles.section}>
            <Overline>Record the step</Overline>
            <Body muted>Log what was done. Intention is not progress.</Body>
            <Field
              label="What was done"
              value={action}
              onChangeText={setAction}
              placeholder="Wrote the one-week proof test. Set Friday as the artifact deadline."
              multiline
            />
            <Button
              label={busy ? 'Saving' : 'Record action'}
              tone="neutral"
              disabled={busy || action.trim().length < 8}
              onPress={() =>
                run(async () => {
                  const keys = await store.recordAction(step.id, action.trim());
                  setAction('');
                  return keys;
                })
              }
            />
          </View>

          <View style={styles.section}>
            <Overline>Close the step</Overline>
            <Field
              label="Outcome"
              value={outcome}
              onChangeText={setOutcome}
              placeholder="The proof test exists. Deadline is Friday. Artifact is a one-page offer draft."
              multiline
            />
            <Button
              label={busy ? 'Saving' : 'Complete with outcome'}
              disabled={busy || outcome.trim().length < 12}
              onPress={() => run(() => store.completeStep(step.id, outcome.trim()))}
            />
          </View>

          <View style={styles.section}>
            <Overline>Miss</Overline>
            <Body muted>If the action was not done, record the miss. It becomes part of the Life Portfolio.</Body>
            <Button
              label="Record miss"
              tone="neutral"
              disabled={busy}
              onPress={() =>
                run(async () => {
                  await store.recordMiss(step.id, 'No evidence in the due window.');
                  return [];
                })
              }
            />
          </View>
        </>
      ) : null}

      {crossed.length > 0 ? (
        <View style={styles.section}>
          <Overline>Threshold crossed</Overline>
          {crossed.map((key) => (
            <Card key={key}>
              <Title>{THRESHOLD_COPY[key].title}</Title>
              <Body>{THRESHOLD_COPY[key].body}</Body>
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  section: {
    gap: space.sm,
  },
});
