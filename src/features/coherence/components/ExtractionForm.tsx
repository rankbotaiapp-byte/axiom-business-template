import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { color, space, type } from '../../../theme';
import type { ExtractionDraft } from '../types';

export function ExtractionForm({
  draft,
  onChange,
}: {
  draft: ExtractionDraft;
  onChange: (next: ExtractionDraft) => void;
}) {
  const [focus, setFocus] = useState(draft.theme);

  const promptCount = useMemo(() => draft.notes.length, [draft.notes.length]);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Extraction draft</Text>
      <TextInput
        value={draft.theme}
        onChangeText={(value) => onChange({ ...draft, theme: value })}
        placeholder="Session theme"
        placeholderTextColor={color.muted}
        style={styles.input}
      />
      <TextInput
        value={draft.claim}
        onChangeText={(value) => onChange({ ...draft, claim: value })}
        placeholder="Core claim"
        placeholderTextColor={color.muted}
        style={styles.input}
        multiline
      />
      <TextInput
        value={draft.prompt}
        onChangeText={(value) => onChange({ ...draft, prompt: value })}
        placeholder="Prompt"
        placeholderTextColor={color.muted}
        style={[styles.input, styles.prompt]}
        multiline
      />
      <Text style={styles.meta}>{promptCount} notes • confidence {draft.confidence}%</Text>
      <TextInput
        value={focus}
        onChangeText={(value) => {
          setFocus(value);
          onChange({ ...draft, notes: [value, ...draft.notes.filter((note) => note !== focus)] });
        }}
        placeholder="Add a key note"
        placeholderTextColor={color.muted}
        style={styles.input}
      />
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
  input: {
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surfaceRaised,
    borderRadius: 12,
    color: color.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...type.body,
  },
  prompt: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  meta: {
    ...type.meta,
    color: color.muted,
  },
});
