import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { img, Listing, symFor } from '../api';
import { C, radius, shadow, space } from '../theme';
import { Palette, useTheme } from '../useTheme';

const AVAIL: Record<Listing['availability'], { color: string; label: string }> = {
  in_stock: { color: C.success, label: 'In stock' },
  limited: { color: C.warningText, label: 'Limited' },
  sold_out: { color: C.error, label: 'Sold out' },
  made_to_order: { color: C.bodyText, label: 'Made to order' },
};
// Listing card: uniform square photo, h3 title, tabular price + dot.
// Photo tap messages about the dish directly; body tap opens detail.
export function ListingCard({ item, onPress, onPhoto, onMessage }: {
  item: Listing; onPress: () => void; onPhoto?: () => void; onMessage?: () => void;
}) {
  const a = AVAIL[item.availability];
  const { p } = useTheme();
  const s = themed(p);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && s.pressed]}>
      {item.photos[0] ? (
        <Pressable onPress={onPhoto ?? onPress} style={s.phWrap}>
          <Image source={{ uri: img(item.photos[0]) }} style={s.photo} resizeMode="contain" />
        </Pressable>
      ) : (
        <View style={[s.photo, s.empty]} />
      )}
      <View style={s.body}>
        <Text style={s.title} numberOfLines={2}>{item.title}</Text>
        {!!item.description && (
          <Text style={s.desc} numberOfLines={2}>{item.description}</Text>
        )}
        <Text style={s.price}>
          {item.price ? `${symFor(item.currency)}${item.price}` : 'Price on request'}
          {'  '}
          <View style={[s.dot, { backgroundColor: a.color }]} />
          <Text style={s.avail}> {a.label}</Text>
        </Text>
        {!!onMessage && (
          <Pressable onPress={onMessage} style={s.msgBtn}>
            <Text style={s.msgT}>Message</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  card: { flex: 1, backgroundColor: p.surface, borderRadius: radius.lg, overflow: 'hidden', ...shadow.md },
  pressed: { opacity: 0.92 },
  photo: { width: '100%', aspectRatio: 1 },
  phWrap: { backgroundColor: p.line },
  empty: { backgroundColor: p.line },
  body: { padding: space.s4 - 4 },
  title: { fontSize: 16, fontWeight: '600', color: p.ink },
  desc: { fontSize: 13, color: p.bodyText, marginTop: 2 },
  price: { fontSize: 14, color: p.ink, fontVariant: ['tabular-nums'], marginTop: 4 },
  avail: { fontSize: 12, color: p.bodyText },
  dot: { width: 8, height: 8, borderRadius: 4 },
  msgBtn: {
    marginTop: 8, height: 36, borderRadius: 8, backgroundColor: C.cta,
    alignItems: 'center', justifyContent: 'center',
  },
  msgT: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
