import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { img, Listing } from '../api';
import { C, radius, space } from '../theme';

const AVAIL: Record<Listing['availability'], { color: string; label: string }> = {
  in_stock: { color: C.success, label: 'In stock' },
  limited: { color: C.warningText, label: 'Limited' },
  sold_out: { color: C.error, label: 'Sold out' },
  made_to_order: { color: C.bodyText, label: 'Made to order' },
};
// Listing card: uniform square photo, h3 title, tabular price + dot.
// Photo tap messages about the dish directly; body tap opens detail.
export function ListingCard({ item, onPress, onPhoto }: {
  item: Listing; onPress: () => void; onPhoto?: () => void;
}) {
  const a = AVAIL[item.availability];
  return (
    <Pressable onPress={onPress} style={styles.card}>
      {item.photos[0] ? (
        <Pressable onPress={onPhoto ?? onPress}>
          <Image source={{ uri: img(item.photos[0]) }} style={styles.photo} />
        </Pressable>
      ) : (
        <View style={[styles.photo, styles.empty]} />
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.price}>
          {item.price ?? 'Price on request'}
          {'  '}
          <View style={[styles.dot, { backgroundColor: a.color }]} />
          <Text style={styles.avail}> {a.label}</Text>
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: C.surface, borderRadius: radius.lg, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 1 },
  empty: { backgroundColor: C.line },
  body: { padding: space.s4 - 4 },
  title: { fontSize: 16, fontWeight: '600', color: C.ink },
  price: { fontSize: 14, color: C.ink, fontVariant: ['tabular-nums'], marginTop: 4 },
  avail: { fontSize: 12, color: C.bodyText },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
