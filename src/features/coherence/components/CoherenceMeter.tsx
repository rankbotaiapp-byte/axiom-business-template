import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { color, space, type } from '../../../theme';
import type { CoherenceResult } from '../types';

export function CoherenceMeter({ result }: { result: CoherenceResult }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Coherence meter</Text>
      <View style={styles.row}>
        <Text style={styles.score}>{result.score}</Text>
        <Text style={styles.badge}>{result.label}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${result.score}%` }]} />
      </View>
      {result.signals.length > 0 ? (
        <View style={styles.tagsWrap}>
          {result.signals.map((signal) => (
            <View key={signal} style={styles.tag}>
              <Text style={styles.tagText}>{signal}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.insights}>
        {result.insights.map((insight) => (
          <Text key={insight} style={styles.insight}>
            • {insight}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: color.border,
    padding: space.lg,
    gap: space.sm,
  },
  label: {
    ...type.meta,
    color: color.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: space.sm,
  },
  score: {
    ...type.title,
    color: color.text,
  },
  badge: {
    ...type.meta,
    color: color.accent,
    textTransform: 'capitalize',
  },
  barTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: color.surfaceRaised,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: color.ok,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surfaceRaised,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    ...type.meta,
    color: color.text,
    textTransform: 'capitalize',
  },
  insights: {
    gap: 6,
  },
  insight: {
    ...type.body,
    color: color.text,
  },
});
