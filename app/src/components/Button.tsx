import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { C, radius } from '../theme';
import { Palette, useTheme } from '../useTheme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
  disabled?: boolean;
  pill?: boolean;
};
// One CTA (primary) per screen. 48/40/32 via `size` where needed.
export function Button({ title, onPress, variant = 'primary', disabled, pill }: Props) {
  const { p, dark } = useTheme();
  const s = themed(p, dark);
  const tx = dark ? '#7B90D6' : C.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.base,
        pill && { borderRadius: 28 },
        variant === 'primary' && s.primary,
        variant === 'secondary' && s.secondary,
        variant === 'tertiary' && s.tertiary,
        variant === 'destructive' && s.destructive,
        (disabled || pressed) && s.dim,
      ]}>
      <Text
        numberOfLines={1}
        style={[
          s.label,
          variant === 'primary' && { color: '#fff' },
          (variant === 'secondary' || variant === 'tertiary') && { color: tx },
          variant === 'destructive' && { color: C.error },
          !!disabled && { color: p.bodyText },
        ]}>
        {title}
      </Text>
    </Pressable>
  );
}

const themed = (p: Palette, dark: boolean) => StyleSheet.create({
  base: { height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  label: { fontSize: 14, fontWeight: '600' },
  primary: { backgroundColor: C.cta },
  secondary: { backgroundColor: p.surface, borderWidth: 1, borderColor: dark ? '#7B90D6' : C.primary },
  tertiary: {},
  destructive: { backgroundColor: p.surface, borderWidth: 1, borderColor: C.error },
  dim: { opacity: 0.6 },
});
