import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '../../src/components/Screen';
import { PlanReview } from '../../src/components/PlanReview';
import { Body, Button, Card, Meta, Overline, StatusMark, Title } from '../../src/components/ui';
import { capacityReady, intakeReady } from '../../src/engine/capacity';
import { evidenceCount } from '../../src/engine/progress';
import { formatDate, todayLabel } from '../../src/format';
import { formatHours, useStore } from '../../src/store';
import { space } from '../../src/theme';
import type { CapacityMap, Intake, Step, Threshold, Vision } from '../../src/types';
import { THRESHOLD_COPY } from '../../src/types';

export default function OperationsScreen() {
  const store = useStore();
  const router = useRouter();
  const [vision, setVision] = useState<Vision | null>(null);
  const [step, setStep] = useState<Step | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [map, setMap] = useState<CapacityMap | null>(null);
  const [intake, setIntake] = useState<Intake | null>(null);
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [misses, setMisses] = useState(0);
  const [prepared, setPrepared] = useState(false);
  const [altReason, setAltReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const recorded = await store.reconcileMisses();
    setMisses(recorded);
    const [nextVision, nextStep, nextMap, nextIntake] = await Promise.all([
      store.getActiveVision(),
      store.currentStep(),
      store.getCapacity(),
      store.getIntake(),
    ]);
    setVision(nextVision);
    setStep(nextStep);
    setMap(nextMap);
    setIntake(nextIntake);
    if (nextVision) {
      const [nextSteps, nextThresholds] = await Promise.all([
        store.listSteps(nextVision.id),
        store.listThresholds(nextVision.id),
      ]);
      setSteps(nextSteps);
      setThresholds(nextThresholds);
    } else {
      setSteps([]);
      setThresholds([]);
    }
  }, [store]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const mapped = capacityReady(map);
  const interviewed = intakeReady(intake);
  const evidence = evidenceCount(steps);
  const draftReady = Boolean(vision && mapped && interviewed && steps.length > 0 && !vision.planLocked);

  return (
    <Screen>
      <View style={styles.header}>
        <Overline>Z Point</Overline>
        <Title>Operations</Title>
        <Meta>{todayLabel()}</Meta>
      </View>

      <Card>
        <Overline>Progress</Overline>
        <Title>
          {evidence.completed} of {evidence.total} evidenced
        </Title>
        <Body muted>Completed evidence only. Intention does not count.</Body>
      </Card>

      {misses > 0 ? (
        <Card>
          <Overline>Miss recorded</Overline>
          <Body>A due window closed without evidence. It is in the Life Portfolio.</Body>
        </Card>
      ) : null}

      {!interviewed ? (
        <Card onPress={() => router.push('/intake')}>
          <Overline>Intake required</Overline>
          <Body>Answer the clarifying questions about responsibilities, capacity, and competing goals.</Body>
        </Card>
      ) : null}

      {interviewed && !mapped ? (
        <Card onPress={() => router.push('/capacity')}>
          <Overline>Capacity unmapped</Overline>
          <Body>Enter actual hours and responsibilities. Aspirational weeks are not accepted as a map.</Body>
        </Card>
      ) : null}

      {mapped && map ? (
        <Card>
          <Overline>Available this week</Overline>
          <Title>{formatHours(map.availableHours)}</Title>
          <Meta>
            {formatHours(map.committedHours)} committed of {formatHours(map.weeklyHours)}
          </Meta>
        </Card>
      ) : null}

      {!vision ? (
        <Card onPress={() => router.push('/capture')}>
          <Overline>No captured vision</Overline>
          <Body>Capture a precise vision from a regulated state.</Body>
        </Card>
      ) : (
        <Card>
          <View style={styles.row}>
            <StatusMark status={vision.phase} />
            <Meta>{vision.planLocked ? 'Primary path' : 'Unlocked draft'}</Meta>
          </View>
          <Title>{vision.statement}</Title>
        </Card>
      )}

      {vision && mapped && interviewed && steps.length === 0 ? (
        <Button
          label="Generate draft sequence"
          onPress={async () => {
            try {
              setError(null);
              await store.ensureSequence();
              await load();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Generation failed.');
            }
          }}
        />
      ) : null}

      {draftReady && vision ? (
        <PlanReview
          vision={vision}
          map={map}
          steps={steps}
          prepared={prepared}
          onPreparedChange={setPrepared}
          reason={altReason}
          onReasonChange={setAltReason}
          busy={false}
          onAlternative={async () => {
            try {
              setError(null);
              await store.requestAlternative(altReason);
              setAltReason('');
              setPrepared(false);
              await load();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Revision failed.');
            }
          }}
          onLock={async () => {
            try {
              setError(null);
              await store.lockPlan(prepared);
              setPrepared(false);
              await load();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Lock failed.');
            }
          }}
        />
      ) : null}

      {error ? <Body>{error}</Body> : null}

      {vision && !vision.planLocked && steps.length > 0 ? (
        <Body muted>The sequence is visible as a draft. Do not execute until it is locked.</Body>
      ) : null}

      {vision?.planLocked && step ? (
        <Card onPress={() => router.push({ pathname: '/step/[id]', params: { id: step.id } })}>
          <View style={styles.row}>
            <StatusMark status={step.status === 'complete' ? 'complete' : step.status === 'active' ? 'active' : 'pending'} />
            <Meta>
              Step {step.position} · {formatHours(step.hours)}
              {step.dueAt ? ` · due ${formatDate(step.dueAt)}` : ''}
            </Meta>
          </View>
          <Overline>Current action</Overline>
          <Title>{step.title}</Title>
          <Body>{step.action}</Body>
          <Meta>Record evidence or a miss. The sequence does not advance itself.</Meta>
        </Card>
      ) : null}

      {vision?.planLocked && step === null && evidence.total > 0 ? (
        <Card>
          <Overline>Sequence complete</Overline>
          <Body>Every generated step has documented evidence.</Body>
        </Card>
      ) : null}

      {thresholds.length > 0 ? (
        <View style={styles.section}>
          <Overline>Thresholds crossed</Overline>
          {thresholds.map((item) => (
            <Card key={item.id}>
              <Title>{THRESHOLD_COPY[item.key].title}</Title>
              <Body muted>{THRESHOLD_COPY[item.key].body}</Body>
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
    marginBottom: space.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: {
    gap: space.sm,
  },
});
