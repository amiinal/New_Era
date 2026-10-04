import { AccessibilityInfo } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { C } from '../theme';

const AnimPath = Animated.createAnimatedComponent(Path);
const LEN = 220; // approx. length of the mark path (viewBox 100)

// First-run brand moment (design §1.7): mark draws in, settles with a
// pulse, wordmark fades up. Once only — never replayed, never blocking
// longer than genuine loading. Reduced motion: plain 200ms fade.
export function Intro({ onDone }: { onDone: () => void }) {
  const draw = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const rise = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;
  const done = useRef(false);
  const finish = () => { if (!done.current) { done.current = true; onDone(); } };

  useEffect(() => {
    let stop = false;
    const t = setTimeout(finish, 2600);
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (stop) return;
      if (reduced) {
        Animated.timing(out, { toValue: 1, duration: 200, useNativeDriver: true }).start(() => finish());
        return;
      }
      Animated.sequence([
        Animated.parallel([
          Animated.timing(draw, { toValue: 1, duration: 700, useNativeDriver: false }),
          Animated.sequence([
            Animated.delay(700),
            Animated.sequence([
              Animated.timing(pulse, { toValue: 1.06, duration: 150, useNativeDriver: true }),
              Animated.timing(pulse, { toValue: 1, duration: 150, useNativeDriver: true }),
            ]),
          ]),
          Animated.sequence([
            Animated.delay(750),
            Animated.timing(rise, { toValue: 1, duration: 350, useNativeDriver: true }),
          ]),
        ]),
        Animated.delay(1100),
        Animated.timing(out, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished) finish(); });
    });
    return () => { stop = true; clearTimeout(t); };
  }, []);

  const offset = draw.interpolate({ inputRange: [0, 1], outputRange: [LEN, 0] });
  const riseY = rise.interpolate({ inputRange: [0, 1], outputRange: [6, 0] });

  return (
    <Animated.View style={[styles.root, { opacity: out }]}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Svg width={120} height={120} viewBox="0 0 100 100">
          <AnimPath
            d="M 26 80 L 26 50 C 26 38, 74 92, 74 80 L 74 14"
            fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round"
            strokeDasharray={LEN} strokeDashoffset={offset} />
        </Svg>
      </Animated.View>
      <Animated.Text style={[styles.word, { opacity: rise, transform: [{ translateY: riseY }] }]}>
        New Era
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  word: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 16 },
});
