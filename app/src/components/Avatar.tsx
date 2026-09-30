import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';

// Generated initial avatar + status ring (unviewed stories). Ring never
// implies verification — the verified badge ships in Phase 2 (TRU-3).
export function Avatar({ name, size = 64, ring = false }: { name: string; size?: number; ring?: boolean }) {
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        ring && styles.ring,
      ]}>
      <Text style={[styles.letter, { fontSize: size * 0.4 }]}>{name.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: 'rgba(44,62,122,.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: C.surface,
  },
  letter: { color: C.primary, fontWeight: '700' },
  ring: { borderColor: C.cta },
});
