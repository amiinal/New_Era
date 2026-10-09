import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, Business } from '../api';
import { useAuth } from '../auth';
import { radius, shadow, space, type } from '../theme';
import { Button } from '../components/Button';
import { TabHead } from '../components/TabHead';
import { DrawerRoute } from '../components/Drawer';
import { Skeleton } from '../components/Skeleton';
import { Palette, useTheme } from '../useTheme';

// Step 5: country + city search, browseable without account (wall at chat).
// Mirrors the website Discover: same headings, categories, and filters.
const CATEGORIES = ['Fashion', 'Beauty', 'Food', 'Home', 'Electronics', 'Services'];
export function DiscoverScreen({ onOpen, dRoutes, dActive, onDNav, onStartSelling, onSignIn }: {
  onOpen: (slug: string) => void;
  dRoutes: DrawerRoute[]; dActive: DrawerRoute; onDNav: (r: DrawerRoute) => void;
  onStartSelling?: () => void; onSignIn?: () => void;
}) {
  const { account, mode, setAppMode } = useAuth();
  const { p } = useTheme();
  const s = themed(p);
  const link = p.primary;
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [items, setItems] = useState<Business[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [hasBiz, setHasBiz] = useState<boolean | null>(null);

  const load = async (withCat?: string) => {
    const cat = withCat !== undefined ? withCat : category;
    try {
      setItems(await api.discover({
        country: account?.country ?? 'NG',
        ...(city ? { city } : {}), ...(q ? { q } : {}), ...(cat ? { category: cat } : {}),
      }));
      setFailed(false);
    } catch { setItems([]); setFailed(true); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { api.myBusinesses().then(b => setHasBiz(b.length > 0)).catch(() => {}); }, []);

  return (
    <View style={s.root}>
      <View style={s.col}>
      <TabHead title="Discover" drawer={mode === 'business' ? 'business' : 'customer'} routes={dRoutes} active={dActive} onNav={onDNav} onSignIn={onSignIn} right={
        account ? (
          hasBiz !== null && mode === 'customer' ? (
            <Text onPress={() => setAppMode('business')} style={[s.switch, { color: link }]}>
              {hasBiz ? 'Business view' : 'Start selling'}
            </Text>
          ) : undefined
        ) : onStartSelling ? (
          <Text onPress={onStartSelling} style={[s.switch, { color: link }]}>Start selling</Text>
        ) : undefined
      } />
      <Text style={s.h1}>What are you looking for?</Text>
      <Text style={s.sub}>Find products, services, and businesses near you.</Text>
      <TextInput style={s.input} placeholder="What are you looking for?" placeholderTextColor={p.bodyText} value={q}
        onChangeText={setQ} onSubmitEditing={() => load()} returnKeyType="search" />
      <TextInput style={[s.input, { marginTop: space.s3 }]} placeholder="City (optional)" placeholderTextColor={p.bodyText}
        value={city} onChangeText={setCity} onSubmitEditing={() => load()} />
      <View style={s.chips}>
        {['', ...CATEGORIES].map(c => (
          <Text key={c || 'all'} onPress={() => { setCategory(c); load(c); }}
            style={[s.chip, category === c && s.chipOn]}>{c || 'All'}</Text>
        ))}
      </View>
      {items === null ? (
        <><Skeleton kind="row" /><Skeleton kind="row" /><Skeleton kind="row" /></>
      ) : failed ? (
        <View style={s.card}>
          <Text style={s.empty}>Couldn&apos;t load — check your connection.</Text>
          <View style={{ marginTop: space.s3 }}>
            <Button title="Retry" variant="secondary" onPress={() => load()} />
          </View>
        </View>
      ) : (
        <FlatList data={items} keyExtractor={b => b.id} style={{ flex: 1 }}
          ListEmptyComponent={<Text style={s.empty}>No businesses yet — try widening the city.</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => onOpen(item.slug)}
              style={({ pressed }) => [s.card, pressed && s.pressed]}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.meta}>{item.category} · {item.city}, {item.country}</Text>
              {(item.matchedListings?.length ?? 0) > 0 ? (
                <Text style={s.meta} numberOfLines={1}>Matches: {item.matchedListings!.join(' · ')}</Text>
              ) : null}
            </Pressable>
          )} />
      )}
      </View>
    </View>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background },
  col: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', padding: space.s4 },
  switch: { ...type.bodySm, color: p.primary, fontWeight: '600' },
  h1: { ...type.h1, fontSize: 22, color: p.ink, marginBottom: space.s1 },
  sub: { ...type.bodySm, color: p.bodyText, marginBottom: space.s4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2, marginTop: space.s3 },
  chip: {
    paddingVertical: space.s2, paddingHorizontal: space.s4, borderWidth: 1,
    borderColor: p.lineStrong, borderRadius: 18, color: p.bodyText, overflow: 'hidden',
    fontSize: 14,
  },
  chipOn: { borderColor: p.primary, color: p.primary, fontWeight: '700' },
  input: {
    backgroundColor: p.surface, borderWidth: 1, borderColor: p.lineStrong, color: p.ink,
    borderRadius: radius.md, height: 48, paddingHorizontal: space.s4, fontSize: 16,
  },
  card: { backgroundColor: p.surface, borderRadius: radius.lg, padding: space.s4, marginTop: space.s3, ...shadow.md },
  pressed: { opacity: 0.85 },
  name: { ...type.h3, color: p.ink },
  meta: { ...type.micro, color: p.bodyText, marginTop: 4 },
  empty: { ...type.body, color: p.bodyText, marginTop: space.s6, textAlign: 'center' },
});
