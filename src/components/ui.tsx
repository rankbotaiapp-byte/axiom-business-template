import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { color, space, type } from '../theme';

export function Overline({ children }: { children: ReactNode }) {
  return <Text style={styles.overline}>{children}</Text>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Body({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: any }) {
  return <Text style={[styles.body, muted && styles.muted, style]}>{children}</Text>;
}

export function Meta({
  children,
  numberOfLines,
  style,
}: {
  children: ReactNode;
  numberOfLines?: number;
  style?: any;
}) {
  return (
    <Text style={[styles.meta, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export function Card({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={styles.card}>{children}</View>;
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'decimal-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.overline}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.faint}
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.inputMulti]}
      />
    </View>
  );
}

export function CheckRow({
  label,
  checked,
  onToggle,
  radio = false,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  radio?: boolean;
}) {
  return (
    <Pressable onPress={onToggle} style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}>
      <View style={[styles.box, checked && styles.boxOn, radio && styles.boxRadio]}>
        {radio ? (
          checked ? <View style={styles.radioDot} /> : null
        ) : (
          checked ? <Text style={styles.tick}>✓</Text> : null
        )}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  disabled,
  tone = 'accent',
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'accent' | 'danger' | 'neutral';
  variant?: 'primary' | 'secondary';
}) {
  const toneStyle =
    tone === 'danger' ? styles.btnDanger : tone === 'neutral' ? styles.btnNeutral : styles.btnAccent;
  const variantStyle = variant === 'secondary' ? styles.btnSecondary : {};
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        toneStyle,
        variantStyle,
        disabled && styles.btnDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.btnLabel, disabled && styles.btnLabelDisabled]}>{label}</Text>
    </Pressable>
  );
}

export function StatusMark({
  status,
}: {
  status: 'active' | 'pending' | 'complete' | 'foundation' | 'capitalization';
}) {
  const map = {
    active: { color: color.accent, label: 'Active' },
    pending: { color: color.muted, label: 'Pending' },
    complete: { color: color.ok, label: 'Complete' },
    foundation: { color: color.accent, label: 'Foundation' },
    capitalization: { color: color.ok, label: 'Capitalization' },
  } as const;
  const item = map[status];
  return (
    <View style={styles.status}>
      <View style={[styles.dot, { backgroundColor: item.color }]} />
      <Text style={[styles.statusLabel, { color: item.color }]}>{item.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overline: {
    ...type.overline,
    color: color.muted,
  },
  title: {
    ...type.title,
    color: color.text,
  },
  body: {
    ...type.body,
    color: color.text,
  },
  muted: {
    color: color.muted,
  },
  meta: {
    ...type.meta,
    color: color.muted,
  },
  card: {
    backgroundColor: color.surface,
    borderColor: color.border,
    borderWidth: 1,
    padding: space.md,
    gap: space.sm,
  },
  pressed: {
    opacity: 0.72,
  },
  field: {
    gap: space.xs,
  },
  input: {
    ...type.body,
    color: color.text,
    backgroundColor: color.surface,
    borderColor: color.border,
    borderWidth: 1,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    minHeight: 48,
  },
  inputMulti: {
    minHeight: 120,
    paddingTop: 12,
  },
  btn: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  btnAccent: {
    backgroundColor: color.accent,
  },
  btnDanger: {
    backgroundColor: color.danger,
  },
  btnNeutral: {
    backgroundColor: color.surfaceRaised,
    borderWidth: 1,
    borderColor: color.border,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: color.border,
  },
  btnDisabled: {
    backgroundColor: color.surfaceRaised,
    borderWidth: 1,
    borderColor: color.border,
  },
  btnLabel: {
    ...type.overline,
    color: color.bg,
  },
  btnLabelDisabled: {
    color: color.faint,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    ...type.overline,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    paddingVertical: 8,
  },
  box: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  boxOn: {
    backgroundColor: color.accent,
    borderColor: color.accent,
  },
  boxRadio: {
    borderRadius: 10,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.bg,
  },
  tick: {
    color: color.bg,
    fontSize: 13,
    fontWeight: '700',
  },
  checkLabel: {
    ...type.body,
    color: color.text,
    flex: 1,
  },
});
