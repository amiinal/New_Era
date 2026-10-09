import { Compass, Store } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, shadow, space, type } from '../theme';
import { Palette, useTheme } from '../useTheme';

// ONB role entry: fresh users pick customer vs business once, so business
// users go straight to storefront creation instead of via Discover.
export function RoleSelect({ onPick }: { onPick: (mode: 'customer' | 'business') => void }) {
  const { p, dark } = useTheme();
  const s = themed(p, dark);
  return (
    <View style={s.root}>
      <View style={s.card}>
        <Text style={s.h1}>What brings you to New Era?</Text>
        <Text style={s.sub}>Discover businesses, or list your own — switch anytime later.</Text>
        <Pressable onPress={() => onPick('customer')} style={({ pressed }) => [s.opt, pressed && s.pressed]}>
          <Compass size={24} color={s.icon.color as string} />
          <View style={{ flex: 1 }}>
            <Text style={s.t}>I&apos;m here to discover</Text>
            <Text style={s.micro}>Find businesses, chat, follow updates.</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => onPick('business')} style={({ pressed }) => [s.opt, pressed && s.pressed]}>
          <Store size={24} color={s.icon.color as string} />
          <View style={{ flex: 1 }}>
            <Text style={s.t}>I have a business to list</Text>
            <Text style={s.micro}>Create a storefront — live in ~5 minutes.</Text>
          </View>
        </Pressable>
        <Text style={s.foot}>You can use both modes with one account.</Text>
      </View>
    </View>
  );
}

const themed = (p: Palette, dark: boolean) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background, alignItems: 'center', justifyContent: 'center', padding: space.s5 },
  card: { width: '100%', maxWidth: 420, backgroundColor: p.surface, borderRadius: 28, padding: space.s6, ...shadow.md },
  h1: { ...type.h1, fontSize: 24, color: p.ink, textAlign: 'center' },
  sub: { ...type.bodySm, color: p.bodyText, textAlign: 'center', marginTop: space.s2, marginBottom: space.s5 },
  opt: {
    flexDirection: 'row', gap: space.s4, alignItems: 'center',
    backgroundColor: p.background, borderWidth: 1, borderColor: p.lineStrong,
    borderRadius: radius.lg, padding: space.s4, marginBottom: space.s3, ...shadow.sm,
  },
  pressed: { opacity: 0.7 },
  t: { ...type.body, color: p.ink, fontWeight: '600' },
  micro: { ...type.micro, color: p.bodyText, marginTop: 2 },
  foot: { ...type.micro, color: p.bodyText, textAlign: 'center', marginTop: space.s2 },
  icon: { ...type.body, color: p.primary },
});
