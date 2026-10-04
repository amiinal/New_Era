import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { Palette, useTheme } from '../useTheme';

// Generated initial avatar + status ring (unviewed stories). Ring never
// implies verification — the verified badge ships in Phase 2 (TRU-3).
export function Avatar({ name, size = 64, ring = false }: { name: string; size?: number; ring?: boolean }) {
  const { p, dark } = useTheme();
  const fg = dark ? '#7B90D6' : C.primary;
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, borderColor: p.surface,
          backgroundColor: dark ? 'rgba(123,144,214,.16)' : 'rgba(44,62,122,.12)' },
        ring && { borderColor: C.cta },
      ]}>
      <Text style={[styles.letter, { fontSize: size * 0.4, color: fg }]}>{name.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  letter: { fontWeight: '700' },
});
