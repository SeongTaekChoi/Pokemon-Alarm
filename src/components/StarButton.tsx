import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

interface Props {
  starred: boolean;
  onPress(): void;
  size?: number;
}

/** Toggles a favorite. Starred items go to the top of their list. */
export function StarButton({ starred, onPress, size = 22 }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={starred ? '즐겨찾기 해제' : '즐겨찾기'}
    >
      <Text
        style={[
          { fontSize: size },
          starred ? styles.starred : styles.unstarred,
        ]}
      >
        {starred ? '★' : '☆'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { paddingHorizontal: 6 },
  starred: { color: colors.warning },
  unstarred: { color: colors.muted },
});
