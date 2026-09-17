import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, CheckRow, Field, Meta, Overline, Title } from '../../src/components/ui';
import { formatHours, useStore } from '../../src/store';
import { space } from '../../src/theme';
import type { CapacityMap } from '../../src/types';

export default function CapacityScreen() {
  const store = useStore();
  const router = useRouter();
  const [goalName, setGoalName] = useState('');
  const [goalHours, setGoalHours] = useState('');
  const [map, setMap] = useState<CapacityMap | null>(null);
  const [weekly, setWeekly] = useState('40');
  const [constraints, setConstraints] = useState('');
  const [name, setName] = useState('');
  const [hours, setHours] = useState('');
  const [locked, setLocked] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const next = await store.getCapacity();
    setMap(next);
    if (next) {
      setWeekly(String(next.weeklyHours));
      setConstraints(next.constraints);
    }
  }, [store]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function saveProfile() {
    const weeklyHours = Number(weekly);
    if (!Number.isFinite(weeklyHours) || weeklyHours <= 0) {
      Alert.alert('Invalid hours', 'Weekly hours must be a number greater than zero.');
      return;
    }
    setBusy(true);
    try {
      await store.saveProfile({ weeklyHours, constraints: constraints.trim() });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    const weeklyHours = Number(hours);
    setBusy(true);
    try {
      await store.addResponsibility({
        name,
        weeklyHours,
        nonNegotiable: locked,
      });
      setName('');
      setHours('');
      await load();
    } catch (error) {
      Alert.alert('Cannot add', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Overline>Real load</Overline>
        <Title>Capacity</Title>
        <Body muted>
          Plans are generated against this map, including competing goals. If the map is false, the sequence will be false.
        </Body>
        <Button label="Edit intake answers" tone="neutral" onPress={() => router.push('/intake')} />
      </View>

      {map ? (
        <Card>
          <Overline>Available for this vision</Overline>
          <Title>{formatHours(map.availableHours)}</Title>
          <Meta>
            {formatHours(map.committedHours)} committed · {formatHours(map.weeklyHours)} weekly
          </Meta>
        </Card>
      ) : (
        <Card>
          <Overline>Unmapped</Overline>
          <Body>Enter weekly hours and at least one responsibility.</Body>
        </Card>
      )}

      <Field
        label="Hours available in a week"
        value={weekly}
        onChangeText={setWeekly}
        placeholder="40"
        keyboardType="decimal-pad"
      />
      <Field
        label="Hard constraints"
        value={constraints}
        onChangeText={setConstraints}
        placeholder="Children three nights. Clinic on Thursdays. No work before 07:00."
        multiline
      />
      <Button label={busy ? 'Saving' : 'Save capacity'} tone="neutral" onPress={saveProfile} disabled={busy} />

      <View style={styles.section}>
        <Overline>Responsibilities</Overline>
        {map?.responsibilities.map((item) => (
          <Card key={item.id}>
            <View style={styles.row}>
              <Title>{item.name}</Title>
              <Meta>{formatHours(item.weeklyHours)}</Meta>
            </View>
            <Meta>{item.nonNegotiable ? 'Non-negotiable' : 'Flexible'}</Meta>
            <Button
              label="Remove"
              tone="neutral"
              onPress={async () => {
                await store.removeResponsibility(item.id);
                await load();
              }}
            />
          </Card>
        ))}
      </View>

      <View style={styles.section}>
        <Overline>Add responsibility</Overline>
        <Field label="Name" value={name} onChangeText={setName} placeholder="Employment, care, recovery, debt" />
        <Field
          label="Hours each week"
          value={hours}
          onChangeText={setHours}
          placeholder="20"
          keyboardType="decimal-pad"
        />
        <CheckRow
          label="Non-negotiable. This load cannot be moved for the vision."
          checked={locked}
          onToggle={() => setLocked((value) => !value)}
        />
        <Button label="Add to map" onPress={add} disabled={busy || name.trim().length < 2} />
      </View>

      <View style={styles.section}>
        <Overline>Competing goals</Overline>
        <Body muted>These take hours. They belong on the map, not in the background.</Body>
        {map?.competingGoals.map((item) => (
          <Card key={item.id}>
            <View style={styles.row}>
              <Title>{item.name}</Title>
              <Meta>{formatHours(item.weeklyHours)}</Meta>
            </View>
            <Button
              label="Remove"
              tone="neutral"
              onPress={async () => {
                await store.removeCompetingGoal(item.id);
                await load();
              }}
            />
          </Card>
        ))}
        <Field label="Competing goal" value={goalName} onChangeText={setGoalName} placeholder="Another offer, a move, a second business" />
        <Field
          label="Hours each week"
          value={goalHours}
          onChangeText={setGoalHours}
          placeholder="6"
          keyboardType="decimal-pad"
        />
        <Button
          label="Add competing goal"
          tone="neutral"
          disabled={busy || goalName.trim().length < 2}
          onPress={async () => {
            setBusy(true);
            try {
              await store.addCompetingGoal({ name: goalName, weeklyHours: Number(goalHours) });
              setGoalName('');
              setGoalHours('');
              await load();
            } catch (error) {
              Alert.alert('Cannot add', error instanceof Error ? error.message : 'Unknown error');
            } finally {
              setBusy(false);
            }
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
    marginBottom: space.sm,
  },
  section: {
    gap: space.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.sm,
  },
});
