import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, Business } from '../api';
import { useAuth } from '../auth';
import { C, radius, space, type } from '../theme';
import { TabHead } from '../components/TabHead';
import { DrawerRoute } from '../components/Drawer';
import { Skeleton } from '../components/Skeleton';
import { Palette, useTheme } from '../useTheme';

// Step 5: country + city search, browseable without account (wall at chat).
export function DiscoverScreen({ onOpen, dRoutes, dActive, onDNav }: {
  onOpen: (slug: string) => void;
  dRoutes: DrawerRoute[]; dActive: DrawerRoute; onDNav: (r: DrawerRoute) => void;
}) {
  const { account, mode, setAppMode, refresh } = useAuth();
  const { p } = useTheme();
  const s = themed(p);
  const link = p.primary;
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
    <View style={s.root}>
      <TabHead title="Discover" drawer={mode === 'business' ? 'business' : 'customer'} routes={dRoutes} active={dActive} onNav={onDNav} right={
        hasBiz !== null && mode === 'customer' ? (
          <Text onPress={() => setAppMode('business')} style={[s.switch, { color: link }]}>
            {hasBiz ? 'Business view' : 'Start selling'}
          </Text>
        ) : undefined
      } />
      <TextInput style={s.input} placeholder="Search businesses…" placeholderTextColor={p.bodyText} value={q}
        onChangeText={setQ} onSubmitEditing={load} returnKeyType="search" />
      <TextInput style={[s.input, { marginTop: space.s3 }]} placeholder="City (optional)" placeholderTextColor={p.bodyText}
        value={city} onChangeText={setCity} onSubmitEditing={load} />
      {items === null ? (
        <><Skeleton kind="row" /><Skeleton kind="row" /><Skeleton kind="row" /></>
      ) : (
        <FlatList data={items} keyExtractor={b => b.id}
          ListEmptyComponent={<Text style={s.empty}>No businesses yet — try widening the city.</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => onOpen(item.slug)} style={s.card}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.meta}>{item.category} · {item.city}, {item.country}</Text>
            </Pressable>
          )} />
      )}
    </View>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background, padding: space.s4 },
  switch: { ...type.bodySm, color: p.primary, fontWeight: '600' },
  input: {
    backgroundColor: p.surface, borderWidth: 1, borderColor: p.lineStrong, color: p.ink,
    borderRadius: radius.md, height: 48, paddingHorizontal: space.s4, fontSize: 16,
  },
  card: { backgroundColor: p.surface, borderRadius: radius.lg, padding: space.s4, marginTop: space.s3 },
  name: { ...type.h3, color: p.ink },
  meta: { ...type.micro, color: p.bodyText, marginTop: 4 },
  empty: { ...type.body, color: p.bodyText, marginTop: space.s6, textAlign: 'center' },
});
