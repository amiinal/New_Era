import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { api, img, Listing, symFor } from '../api';
import { C, radius, space, type } from '../theme';
import { Button } from '../components/Button';
import { Palette, useTheme } from '../useTheme';

const AVAIL: Record<Listing['availability'], { color: string; label: string }> = {
  in_stock: { color: C.success, label: 'In stock' },
  limited: { color: C.warningText, label: 'Limited' },
  sold_out: { color: C.error, label: 'Sold out' },
  made_to_order: { color: C.bodyText, label: 'Made to order' },
};

// Listing detail (LST): photos, price + currency, availability, inquiry
// brief for services. Photo-less and failed loads get real states.
export function ListingScreen({ id, onChat }: { id: string; onChat: (businessId: string, listingId: string, label: string) => void }) {
  const [item, setItem] = useState<Listing | null | undefined>(undefined);
  const [page, setPage] = useState(0);
  const { width } = useWindowDimensions();
  const { p } = useTheme();
  const s = themed(p);
  useEffect(() => { api.listing(id).then(setItem).catch(() => setItem(null)); }, [id]);
  if (item === undefined) return <ActivityIndicator style={{ marginTop: space.s8 }} />;
  if (item === null) return <Text style={s.center}>Couldn&apos;t load this listing — pull to retry.</Text>;

  const a = AVAIL[item.availability];
  const price = item.price ? `${symFor(item.currency)}${item.price}` : 'Price on request';
  return (
    <ScrollView style={s.root}>
      {item.photos.length > 0 ? (
        <View>
          <FlatList data={item.photos} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            keyExtractor={(_, j) => String(j)}
            onMomentumScrollEnd={e => setPage(Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width))}
            renderItem={({ item: uri }) => (
              <Image source={{ uri: img(uri) }} resizeMode="contain"
                style={{ width: width - 32, height: 280, borderRadius: 16, backgroundColor: p.background }} />
            )} />
          {item.photos.length > 1 && (
            <View style={s.dots}>
              {item.photos.map((_, j) => <View key={j} style={[s.dot, j === page && s.dotOn]} />)}
            </View>
          )}
        </View>
      ) : (
        <View style={[s.photoEmpty, { width: width - 32 }]}>
          <Text style={s.micro}>No photos yet</Text>
        </View>
      )}
      <View style={s.card}>
        <Text style={s.h1}>{item.title}</Text>
        <Text style={s.price}>{price}</Text>
        <Text style={s.avail}>
          <View style={[s.avDot, { backgroundColor: a.color }]} />
          <Text style={s.availT}> {a.label}</Text>
        </Text>
        {item.type === 'service' && (
          <Text style={s.micro}>Inquiry only — date, area and budget are confirmed in chat.</Text>
        )}
        <View style={{ marginTop: space.s4 }}>
          <Button title="Message about this" onPress={() => onChat(item.businessId, item.id, `About: ${item.title} · ${price}`)} />
        </View>
      </View>
    </ScrollView>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background },
  center: { flex: 1, textAlign: 'center', marginTop: space.s8, color: p.bodyText },
  photoEmpty: {
    height: 280, borderRadius: 16, backgroundColor: p.line,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: space.s4,
  },
  phWrap: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  photo: { width: '100%', height: 150, borderRadius: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: p.line },
  dotOn: { width: 18, backgroundColor: C.cta },
  card: { backgroundColor: p.surface, borderRadius: 16, margin: space.s4, padding: space.s3 },
  h1: { ...type.h1, fontSize: 20, color: p.ink },
  price: { fontSize: 15, color: p.ink, fontVariant: ['tabular-nums'], marginTop: space.s1 },
  avail: { marginTop: space.s2 },
  avDot: { width: 8, height: 8, borderRadius: 4 },
  availT: { fontSize: 13, color: p.bodyText },
  micro: { ...type.micro, color: p.bodyText, marginTop: space.s2 },
});
