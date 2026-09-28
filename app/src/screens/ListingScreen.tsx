import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api, img, Listing } from '../api';
import { C, space, type } from '../theme';
import { Button } from './components/Button';

// Listing detail (LST): photo, price, availability, inquiry brief for services.
export function ListingScreen({ id, onChat }: { id: string; onChat: (businessId: string, listingId: string) => void }) {
  const [item, setItem] = useState<Listing | null | undefined>(undefined);
  useEffect(() => { api.listing(id).then(setItem).catch(() => setItem(null)); }, [id]);
  if (item === undefined || item === null) return <ActivityIndicator style={{ marginTop: space.s8 }} />;

  return (
    <ScrollView style={styles.root}>
      {item.photos[0] && <Image source={{ uri: img(item.photos[0]) }} style={styles.photo} />}
      <View style={styles.card}>
        <Text style={styles.h1}>{item.title}</Text>
        <Text style={styles.price}>{item.price ?? 'Price on request'}</Text>
        {item.type === 'service' && (
          <Text style={styles.micro}>Inquiry only — date, area and budget are confirmed in chat.</Text>
        )}
        <View style={{ marginTop: space.s4 }}>
          <Button title="Message about this" onPress={() => onChat(item.businessId, item.id)} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  photo: { width: '100%', height: 280 },
  card: { backgroundColor: C.surface, borderRadius: 16, margin: space.s4, padding: space.s4 },
  h1: { ...type.h1, fontSize: 22, color: C.ink },
  price: { fontSize: 16, color: C.ink, fontVariant: ['tabular-nums'], marginTop: space.s2 },
  micro: { ...type.micro, color: C.bodyText, marginTop: space.s2 },
});
