import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '../../src/components/Screen';
import { Body, Card, Meta, Overline, Title } from '../../src/components/ui';
import { formatStamp } from '../../src/format';
import { useStore } from '../../src/store';
import { space } from '../../src/theme';
import type { PortfolioEntry } from '../../src/types';

const KIND_LABEL: Record<PortfolioEntry['kind'], string> = {
  standard: 'Standard',
  begin: 'Begin',
  regulate: 'Regulate',
  visualize: 'Visualize',
  intake: 'Intake',
  capture: 'Capture',
  lock: 'Lock',
  alternative: 'Alternative',
  action: 'Action',
  miss: 'Miss',
  outcome: 'Outcome',
  threshold: 'Threshold',
  phase: 'Phase',
};

export default function PortfolioScreen() {
  const store = useStore();
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      store.listPortfolio().then((rows) => {
        if (live) setEntries(rows);
      });
      return () => {
        live = false;
      };
    }, [store])
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Overline>Permanent record</Overline>
        <Title>Life Portfolio</Title>
        <Body muted>
          This is a permanent record of what you actually did, including misses. It cannot be cleaned up later.
        </Body>
      </View>

      {entries.length === 0 ? (
        <Card>
          <Overline>Empty</Overline>
          <Body>The portfolio begins when a vision is captured or an action is recorded.</Body>
        </Card>
      ) : null}

      {entries.map((entry) => (
        <Card key={entry.id}>
          <View style={styles.row}>
            <Overline>{KIND_LABEL[entry.kind]}</Overline>
            <Meta>{formatStamp(entry.createdAt)}</Meta>
          </View>
          <Title>{entry.title}</Title>
          <Body>{entry.body}</Body>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
    marginBottom: space.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
