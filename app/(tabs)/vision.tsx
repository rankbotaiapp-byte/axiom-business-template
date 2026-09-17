import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { PlanReview } from '../../src/components/PlanReview';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, Field, Meta, Overline, StatusMark, Title } from '../../src/components/ui';
import { evidenceCount } from '../../src/engine/progress';
import { formatHours, useStore } from '../../src/store';
import { space } from '../../src/theme';
import type { CapacityMap, Step, Vision } from '../../src/types';

export default function VisionScreen() {
  const store = useStore();
  const router = useRouter();
  const [vision, setVision] = useState<Vision | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const [map, setMap] = useState<CapacityMap | null>(null);
  const [altReason, setAltReason] = useState('');

  const load = useCallback(async () => {
    const [next, nextMap] = await Promise.all([store.getActiveVision(), store.getCapacity()]);
    setVision(next);
    setMap(nextMap);
    if (next) {
      setSteps(await store.listSteps(next.id));
    } else {
      setSteps([]);
    }
  }, [store]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function archive() {
    if (busy) return;
    setBusy(true);
    try {
      await store.archiveVision(note.trim());
      setNote('');
      await load();
    } catch (error) {
      Alert.alert('Cannot archive', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  if (!vision) {
    return (
      <Screen>
        <View style={styles.header}>
          <Overline>Intention</Overline>
          <Title>Vision</Title>
          <Body muted>
            A vision is captured once, from a regulated state, then converted into a sequence. It is not a mood board.
          </Body>
        </View>
        <Button label="Capture vision" onPress={() => router.push('/capture')} />
      </Screen>
    );
  }

  const currentId = steps.find((step) => step.status !== 'complete')?.id;
  const evidence = evidenceCount(steps);

  return (
    <Screen>
      <View style={styles.header}>
        <StatusMark status={vision.phase} />
        <Title>{vision.statement}</Title>
        <Overline>Evidence of arrival</Overline>
        <Body muted>{vision.evidence}</Body>
        <Meta>
          {vision.planLocked ? 'Primary path locked' : 'Draft — not a plan'} · {evidence.completed} evidenced
        </Meta>
      </View>

      {!vision.planLocked && steps.length > 0 ? (
        <PlanReview
          vision={vision}
          map={map}
          steps={steps}
          prepared={prepared}
          onPreparedChange={setPrepared}
          reason={altReason}
          onReasonChange={setAltReason}
          busy={busy}
          onAlternative={async () => {
            setBusy(true);
            try {
              await store.requestAlternative(altReason);
              setAltReason('');
              setPrepared(false);
              await load();
            } catch (error) {
              Alert.alert('Cannot revise', error instanceof Error ? error.message : 'Unknown error');
            } finally {
              setBusy(false);
            }
          }}
          onLock={async () => {
            setBusy(true);
            try {
              await store.lockPlan(prepared);
              setPrepared(false);
              await load();
            } catch (error) {
              Alert.alert('Cannot lock', error instanceof Error ? error.message : 'Unknown error');
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : null}

      {vision.planLocked ? (
      <View style={styles.section}>
        <Overline>Primary path</Overline>
        {steps.length === 0 ? (
          <Body muted>No sequence yet. Map capacity, then generate from Operations.</Body>
        ) : null}
        {steps.map((step) => (
          <Card
            key={step.id}
            onPress={
              vision.planLocked && (step.id === currentId || step.status === 'complete')
                ? () => router.push({ pathname: '/step/[id]', params: { id: step.id } })
                : undefined
            }
          >
            <View style={styles.row}>
              <StatusMark
                status={step.status === 'complete' ? 'complete' : step.id === currentId ? 'active' : 'pending'}
              />
              <Meta>
                {step.phase} · {formatHours(step.hours)}
              </Meta>
            </View>
            <Title>{step.title}</Title>
            <Body muted={step.id !== currentId && step.status !== 'complete'}>{step.action}</Body>
            <Meta>{step.principle}</Meta>
          </Card>
        ))}
      </View>
      ) : null}

      <View style={styles.section}>
        <Overline>Archive</Overline>
        <Body muted>Record the current state. Archiving does not delete the portfolio.</Body>
        <Field
          label="Current state"
          value={note}
          onChangeText={setNote}
          placeholder="What exists now. What does not. Why this vision is being set down."
          multiline
        />
        <Button
          label={busy ? 'Archiving' : 'Archive vision'}
          tone="neutral"
          onPress={archive}
          disabled={busy || note.trim().length < 12}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    marginBottom: space.sm,
  },
  section: {
    gap: space.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
