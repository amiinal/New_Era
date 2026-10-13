import { X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, Business, img, SITE_URL } from '../api';
import { useAuth } from '../auth';
import { getFlag, setFlag } from '../store';
import { radius, shadow, space, type } from '../theme';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
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
  // Custom "Other" categories businesses typed in: surface them as extra
  // filter chips so they stay discoverable. Accumulated, never collapses.
  const [seenCats, setSeenCats] = useState<string[]>([]);
  // PWA nudge: mobile browsers visiting the web app get an install card.
  // Never in the installed PWA (standalone), never on native builds.
  const [installCard, setInstallCard] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const mm = (globalThis as { matchMedia?: (q: string) => { matches: boolean } }).matchMedia;
    if (mm?.('(display-mode: standalone)').matches) return;
    getFlag('hideInstallCard').then(v => { if (!v) setInstallCard(true); });
  }, []);
  const hideInstall = () => { setFlag('hideInstallCard', '1'); setInstallCard(false); };

  const load = async (withCat?: string) => {
    const cat = withCat !== undefined ? withCat : category;
    const scope = {
      country: account?.country ?? 'NG',
      ...(city ? { city } : {}), ...(q ? { q } : {}), ...(cat ? { category: cat } : {}),
    };
    try {
      const rows = await api.discover(scope);
      setItems(rows);
      setFailed(false);
      setSeenCats(prev => {
        const next = [...prev];
        for (const b of rows) {
          if (b.category && !CATEGORIES.includes(b.category) && !next.includes(b.category)) {
            next.push(b.category);
          }
        }
        return next;
      });
      api.recordEvent('search', scope).catch(() => {});
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
      {installCard && (
        <View style={s.install}>
          <Image source={require('../../assets/icon.png')} style={s.installMark} />
          <View style={{ flex: 1 }}>
            <Text style={s.installT}>Take New Era with you</Text>
            <Text style={s.installS}>Install the app for the fastest experience.</Text>
          </View>
          <Text onPress={() => Linking.openURL(`${SITE_URL}/install`)} style={s.installGo}>Get the app</Text>
          <Pressable onPress={hideInstall} hitSlop={8} style={s.installX}>
            <X size={18} color={p.bodyText} />
          </Pressable>
        </View>
      )}
      <TextInput style={s.input} placeholder="What are you looking for?" placeholderTextColor={p.bodyText} value={q}
        onChangeText={setQ} onSubmitEditing={() => load()} returnKeyType="search" />
      <TextInput style={[s.input, { marginTop: space.s3 }]} placeholder="City (optional)" placeholderTextColor={p.bodyText}
        value={city} onChangeText={setCity} onSubmitEditing={() => load()} />
      <View style={s.chips}>
        {['', ...CATEGORIES].map(c => (
          <Text key={c || 'all'} onPress={() => { setCategory(c); load(c); }}
            style={[s.chip, category === c && s.chipOn]}>{c || 'All'}</Text>
        ))}
        {seenCats.map(c => (
          <Text key={c} onPress={() => { setCategory(c); load(c); }}
            style={[s.chip, category === c && s.chipOn]}>{c}</Text>
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
              <View style={s.bizRow}>
                <Avatar name={item.name} size={48} uri={item.logoKey ? img(item.logoKey) : null} />
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{item.name}</Text>
                  <Text style={s.meta}>{item.category} · {item.city}, {item.country}</Text>
                  {(item.matchedListings?.length ?? 0) > 0 ? (
                    <Text style={s.meta} numberOfLines={1}>Matches: {item.matchedListings!.join(' · ')}</Text>
                  ) : null}
                </View>
              </View>
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
  bizRow: { flexDirection: 'row', gap: space.s3, alignItems: 'center' },
  install: {
    flexDirection: 'row', alignItems: 'center', gap: space.s3,
    backgroundColor: p.surface, borderRadius: radius.lg, padding: space.s3,
    marginBottom: space.s3, ...shadow.sm,
  },
  installMark: { width: 36, height: 36, borderRadius: 8 },
  installT: { ...type.body, color: p.ink, fontWeight: '600' },
  installS: { ...type.micro, color: p.bodyText, marginTop: 2 },
  installGo: { ...type.bodySm, color: p.primary, fontWeight: '700' },
  installX: { padding: space.s1 },
  pressed: { opacity: 0.85 },
  name: { ...type.h3, color: p.ink },
  meta: { ...type.micro, color: p.bodyText, marginTop: 4 },
  empty: { ...type.body, color: p.bodyText, marginTop: space.s6, textAlign: 'center' },
});
