import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { C, radius } from '../theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
  disabled?: boolean;
};
// One CTA (primary) per screen. 48/40/32 via `size` where needed.
export function Button({ title, onPress, variant = 'primary', disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'tertiary' && styles.tertiary,
        variant === 'destructive' && styles.destructive,
        (disabled || pressed) && styles.dim,
      ]}>
      <Text
        style={[
          styles.label,
          variant === 'primary' && { color: '#fff' },
          variant === 'secondary' && { color: C.primary },
          variant === 'tertiary' && { color: C.primary },
          variant === 'destructive' && { color: C.error },
          !!disabled && { color: C.bodyText },
        ]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  label: { fontSize: 14, fontWeight: '600' },
  primary: { backgroundColor: C.cta },
  secondary: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.primary },
  tertiary: {},
  destructive: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.error },
  dim: { opacity: 0.6 },
});
