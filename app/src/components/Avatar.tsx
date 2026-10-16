import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { Palette, useTheme } from '../useTheme';

// Generated initial avatar + status ring (unviewed stories). Ring never
// implies verification — the verified badge ships in Phase 2 (TRU-3).
// `online` adds the green presence dot (seen < 2min ago).
// `uri` shows the business logo photo; any load failure falls back to the
// initial so dead keys never leave a hole.
export function Avatar({ name, size = 64, ring = false, online, uri }: { name: string; size?: number; ring?: boolean; online?: boolean; uri?: string | null }) {
  const { p, dark } = useTheme();
  const [imgOk, setImgOk] = useState(true);
  const fg = p.primary;
  const dot = Math.max(10, size * 0.28);
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, borderColor: p.surface,
          backgroundColor: dark ? 'rgba(123,144,214,.16)' : 'rgba(44,62,122,.12)' },
        ring && { borderColor: C.cta },
      ]}>
      {uri && imgOk ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={() => setImgOk(false)} />
      ) : (
        <Text style={[styles.letter, { fontSize: size * 0.4, color: fg }]}>{name.slice(0, 1).toUpperCase()}</Text>
      )}
      {online ? (
        <View style={{
          position: 'absolute', right: 0, bottom: 0, width: dot, height: dot,
          borderRadius: dot / 2, backgroundColor: C.success, borderWidth: 2, borderColor: p.surface,
        }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  letter: { fontWeight: '700', fontFamily: 'Inter_700Bold' },
});
