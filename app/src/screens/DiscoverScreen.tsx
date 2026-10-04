import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, Business, img } from '../api';
import { useAuth } from '../auth';
import { C, radius, space, type } from '../theme';
import { Avatar } from '../components/Avatar';
import { ProfileSheet } from '../components/ProfileSheet';

// Step 5: country + city search, browseable without account (wall at chat).
export function DiscoverScreen({ onOpen }: { onOpen: (slug: string) => void }) {
  const { account, mode, setAppMode, refresh } = useAuth();
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [items, setItems] = useState<Business[] | null>(null);
  const [hasBiz, setHasBiz] = useState<boolean | null>(null);
  const [prof, setProf] = useState(false);

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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {hasBiz !== null && mode === 'customer' && (
            <Text onPress={() => setAppMode('business')} style={styles.switch}>
              {hasBiz ? 'Business view' : 'Start selling'}
            </Text>
          )}
          <Pressable onPress={() => setProf(true)}>
            {account?.avatarKey
              ? <Image source={{ uri: img(account.avatarKey) }} style={styles.me} />
              : <Avatar name={account?.email ?? account?.phone ?? '?'} size={36} />}
          </Pressable>
        </View>
      </View>
      {prof && <ProfileSheet onClose={() => setProf(false)} onSaved={() => { setProf(false); refresh(); }} />}
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
  me: { width: 36, height: 36, borderRadius: 18, marginBottom: space.s4 },
  input: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.lineStrong,
    borderRadius: radius.md, height: 48, paddingHorizontal: space.s4, fontSize: 16,
  },
  card: { backgroundColor: C.surface, borderRadius: radius.lg, padding: space.s4, marginTop: space.s3 },
  name: { ...type.h3, color: C.ink },
  meta: { ...type.micro, color: C.bodyText, marginTop: 4 },
  empty: { ...type.body, color: C.bodyText, marginTop: space.s6, textAlign: 'center' },
});
