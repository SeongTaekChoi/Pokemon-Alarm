import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

interface Props {
  label: string;
  selected: boolean;
  onPress(): void;
  color?: string;
}

export function Chip({
  label,
  selected,
  onPress,
  color = colors.accentDark,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        selected && { backgroundColor: color, borderColor: color },
      ]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: 6,
    marginBottom: 6,
  },
  label: { color: colors.text, fontSize: 14 },
  selectedLabel: { color: '#FFFFFF', fontWeight: '600' },
});
