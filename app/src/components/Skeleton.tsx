import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { C, radius, space } from '../theme';
import { useTheme } from '../useTheme';

// Shimmer-less skeleton: gently pulsing neutral blocks (no new deps).
// Shapes mirror the content they stand in for (cards, rows, avatar).
export function Skeleton({ kind = 'card' }: { kind?: 'card' | 'row' | 'avatar' }) {
  const { dark } = useTheme();
  const o = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(o, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(o, { toValue: 0.5, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const base = dark ? '#24272F' : C.line;
  return (
    <Animated.View style={{ opacity: o }}>
      {kind === 'card' && <View style={[styles.card, { backgroundColor: base }]} />}
      {kind === 'row' && (
        <View style={styles.row}>
          <View style={[styles.av, { backgroundColor: base }]} />
          <View style={{ flex: 1 }}>
            <View style={[styles.l1, { backgroundColor: base }]} />
            <View style={[styles.l2, { backgroundColor: base }]} />
          </View>
        </View>
      )}
      {kind === 'avatar' && <View style={[styles.av, { backgroundColor: base }]} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { height: 140, borderRadius: radius.lg, marginTop: space.s3 },
  row: { flexDirection: 'row', gap: space.s3, alignItems: 'center', marginTop: space.s3 },
  av: { width: 48, height: 48, borderRadius: 24 },
  l1: { height: 16, borderRadius: 4, marginBottom: 8 },
  l2: { height: 12, borderRadius: 4, width: '60%' },
});
