import { Compass, Store } from 'lucide-react-native';
import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, shadow, space, type } from '../theme';
import { Palette, useTheme } from '../useTheme';
import { useBg } from '../background';

// ONB role entry: fresh users pick customer vs business once, so business
// users go straight to storefront creation instead of via Discover.
// Fills the full height: brand top, choice card middle, reassurance bottom.
export function RoleSelect({ onPick }: { onPick: (mode: 'customer' | 'business') => void }) {
  const { p, dark } = useTheme();
  const s = themed(p);
  const bg = useBg(dark);
  return (
    <ImageBackground source={bg} style={s.bg} resizeMode="cover">
    <View style={s.root}>
      <View style={s.brand}>
        <Text style={s.word}>New Era</Text>
        <Text style={s.tag}>Found. Not just online.</Text>
      </View>
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
      <Text style={s.fillNote}>One account works everywhere on New Era.</Text>
    </View>
    </ImageBackground>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  bg: { flex: 1, backgroundColor: p.background },
  root: {
    flex: 1, justifyContent: 'space-between', overflow: 'hidden',
    padding: space.s5, paddingVertical: space.s5,
  },
  brand: { alignItems: 'center', alignSelf: 'center', width: '100%', maxWidth: 420 },
  word: { fontSize: 28, fontWeight: '700', color: p.ink, textAlign: 'center' },
  tag: { ...type.bodySm, color: p.bodyText, marginTop: 2, textAlign: 'center' },
  card: { width: '100%', maxWidth: 420, alignSelf: 'center', backgroundColor: p.surface, borderRadius: 28, padding: space.s5, ...shadow.md },
  h1: { ...type.h1, fontSize: 22, color: p.ink, textAlign: 'center' },
  sub: { ...type.bodySm, color: p.bodyText, textAlign: 'center', marginTop: space.s2, marginBottom: space.s4 },
  opt: {
    flexDirection: 'row', gap: space.s3, alignItems: 'center',
    backgroundColor: p.background, borderWidth: 1, borderColor: p.lineStrong,
    borderRadius: radius.lg, padding: space.s3, marginBottom: space.s2, ...shadow.sm,
  },
  pressed: { opacity: 0.7 },
  t: { ...type.body, color: p.ink, fontWeight: '600' },
  micro: { ...type.micro, color: p.bodyText, marginTop: 2 },
  foot: { ...type.micro, color: p.bodyText, textAlign: 'center', marginTop: space.s2 },
  fillNote: { ...type.micro, color: p.bodyText, textAlign: 'center', alignSelf: 'center', width: '100%', maxWidth: 420 },
  icon: { ...type.body, color: p.primary },
});
