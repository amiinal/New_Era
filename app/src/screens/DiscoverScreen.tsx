import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, Business } from '../api';
import { useAuth } from '../auth';
import { C, radius, space, type } from '../theme';

// Step 5: country + city search, browseable without account (wall at chat).
export function DiscoverScreen({ onOpen }: { onOpen: (slug: string) => void }) {
  const { account, mode, setAppMode } = useAuth();
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [items, setItems] = useState<Business[] | null>(null);
  const [hasBiz, setHasBiz] = useState<boolean | null>(null);

  const load = async () => {
    try {
      setItems(await api.discover({ country: account?.country ?? 'NG', ...(city ? { city } : {}), ...(q ? { q } : {}) }));
    } catch { setItems([]); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { api.myBusinesses().then(b => setHasBiz(b.length > 0)).catch(() => {}); }, []);

  return (
    <View style={styles.root}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={styles.h1}>Discover</Text>
        {hasBiz !== null && mode === 'customer' && (
          <Text onPress={() => setAppMode('business')} style={styles.switch}>
            {hasBiz ? 'Business view' : 'Start selling'}
          </Text>
        )}
      </View>
      <TextInput style={styles.input} placeholder="Search businesses…" value={q}
        onChangeText={setQ} onSubmitEditing={load} returnKeyType="search" />
      <TextInput style={[styles.input, { marginTop: space.s3 }]} placeholder="City (optional)"
        value={city} onChangeText={setCity} onSubmitEditing={load} />
      {items === null ? <ActivityIndicator style={{ marginTop: space.s6 }} /> : (
        <FlatList data={items} keyExtractor={b => b.id}
          ListEmptyComponent={<Text style={styles.empty}>No businesses yet — try widening the city.</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => onOpen(item.slug)} style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.category} · {item.city}, {item.country}</Text>
            </Pressable>
          )} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background, padding: space.s4 },
  h1: { ...type.h1, color: C.ink, marginBottom: space.s4 },
  switch: { ...type.bodySm, color: C.primary, fontWeight: '600', marginBottom: space.s4 },
  input: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.lineStrong,
    borderRadius: radius.md, height: 48, paddingHorizontal: space.s4, fontSize: 16,
  },
  card: { backgroundColor: C.surface, borderRadius: radius.lg, padding: space.s4, marginTop: space.s3 },
  name: { ...type.h3, color: C.ink },
  meta: { ...type.micro, color: C.bodyText, marginTop: 4 },
  empty: { ...type.body, color: C.bodyText, marginTop: space.s6, textAlign: 'center' },
});
