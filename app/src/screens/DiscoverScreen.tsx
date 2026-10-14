import { MapPin, Search, X } from 'lucide-react-native';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, Business, img, SITE_URL } from '../api';
import { useAuth } from '../auth';
import { COUNTRIES } from '../countries';
import { getFlag, setFlag } from '../store';
import { radius, shadow, space, type } from '../theme';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import { TabHead } from '../components/TabHead';
import { DrawerRoute } from '../components/Drawer';
import { Palette, useTheme } from '../useTheme';

// Discover: static header (title + mode switch + location pill + search),
// filter sheet (query, city, country, tags), scrolling business cards.
// Location defaults to real geolocation; everything else is picked in the
// sheet and committed with Apply.
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
  const [country, setCountry] = useState('NG');
  const [category, setCategory] = useState('');
  const [items, setItems] = useState<Business[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [hasBiz, setHasBiz] = useState<boolean | null>(null);
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
  // Filter sheet draft state (committed with Apply).
  const [sheet, setSheet] = useState(false);
  const [dQ, setDQ] = useState('');
  const [dCity, setDCity] = useState('');
  const [dCountry, setDCountry] = useState('NG');
  const [dCat, setDCat] = useState('');

  const runLoad = async (scope: { country: string; city?: string; q?: string; category?: string }) => {
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
  const load = (withCat?: string) => {
    const cat = withCat !== undefined ? withCat : category;
    runLoad({
      country,
      ...(city ? { city } : {}), ...(q ? { q } : {}), ...(cat ? { category: cat } : {}),
    });
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { api.myBusinesses().then(b => setHasBiz(b.length > 0)).catch(() => {}); }, []);

  // Real location first: device GPS → city + country. Silent fallback keeps
  // the NG default when denied, off, or unresolvable.
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const [g] = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude, longitude: pos.coords.longitude,
        });
        if (!g) return;
        if (g.isoCountryCode && COUNTRIES.some(c => c.code === g.isoCountryCode)) {
          setCountry(g.isoCountryCode);
          setDCountry(g.isoCountryCode);
        }
        const detected = g.city || g.subregion || '';
        if (detected) {
          setCity(detected);
          setDCity(detected);
        }
      } catch { /* keep defaults */ }
    })();
  }, []);

  const openSheet = () => {
    setDQ(q);
    setDCity(city);
    setDCountry(country);
    setDCat(category);
    setSheet(true);
  };
  const applySheet = () => {
    setQ(dQ);
    setCity(dCity);
    setCountry(dCountry);
    setCategory(dCat);
    setSheet(false);
    runLoad({
      country: dCountry,
      ...(dCity ? { city: dCity } : {}), ...(dQ ? { q: dQ } : {}), ...(dCat ? { category: dCat } : {}),
    });
  };
  const clearFilters = () => {
    setQ('');
    setCategory('');
    setSheet(false);
    runLoad({ country, ...(city ? { city } : {}) });
  };

  const countryName = COUNTRIES.find(c => c.code === country)?.name ?? country;
  const pillText = `${city ? `${city}, ` : ''}${countryName}`;
  const here = (b: Business) =>
    city && b.city && b.city.toLowerCase() === city.toLowerCase();

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
      <View style={s.headRow}>
        <Text style={s.h1}>Discover</Text>
        <Pressable onPress={openSheet} style={s.pill} hitSlop={8}>
          <MapPin size={14} color={p.primary} />
          <Text style={s.pillT} numberOfLines={1}>{pillText}</Text>
        </Pressable>
      </View>
      <Pressable onPress={openSheet} style={({ pressed }) => [s.searchBar, pressed && s.pressed]}>
        <View style={s.searchIcon}>
          <Search size={16} color="#fff" />
        </View>
        <Text style={s.searchHint} numberOfLines={1}>
          {q || (category ? `${category} near ${city || countryName}` : 'Search businesses…')}
        </Text>
      </Pressable>
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
          ListEmptyComponent={(
            <View style={s.card}>
              <Text style={s.empty}>No matches here — try widening the city or clearing tags.</Text>
              <View style={{ marginTop: space.s3 }}>
                <Button title="Clear filters" variant="secondary" onPress={clearFilters} />
              </View>
            </View>
          )}
          renderItem={({ item }) => (
            <Pressable onPress={() => onOpen(item.slug)}
              style={({ pressed }) => [s.card, pressed && s.pressed]}>
              <View style={s.bizRow}>
                <Avatar name={item.name} size={48} uri={item.logoKey ? img(item.logoKey) : null} />
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{item.name}</Text>
                  <Text style={s.meta}>{item.category} · {item.city}, {item.country}</Text>
                  {here(item) ? <Text style={s.here}>In {item.city}</Text> : null}
                  {(item.matchedListings?.length ?? 0) > 0 ? (
                    <Text style={s.meta} numberOfLines={1}>Matches: {item.matchedListings!.join(' · ')}</Text>
                  ) : null}
                </View>
              </View>
            </Pressable>
          )} />
      )}
      </View>
      <Modal visible={sheet} animationType="slide" transparent onRequestClose={() => setSheet(false)}>
        <View style={s.sheetScrim}>
          <View style={s.sheet}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>Find businesses</Text>
              <Pressable onPress={() => setSheet(false)} hitSlop={8} style={s.sheetX}>
                <X size={20} color={p.bodyText} />
              </Pressable>
            </View>
            <TextInput style={s.input} placeholder="What are you looking for?" placeholderTextColor={p.bodyText}
              value={dQ} onChangeText={setDQ} autoFocus returnKeyType="search" onSubmitEditing={applySheet} />
            <ScrollView style={s.sheetBody} keyboardShouldPersistTaps="handled">
            <TextInput style={[s.input, { marginTop: space.s3 }]} placeholder="City" placeholderTextColor={p.bodyText}
              value={dCity} onChangeText={setDCity} />
            <Text style={s.sec}>Country</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.countryRow}>
              {COUNTRIES.map(c => (
                <Text key={c.code} onPress={() => setDCountry(c.code)}
                  style={[s.chip, dCountry === c.code && s.chipOn]}>{c.name}</Text>
              ))}
            </ScrollView>
            <Text style={s.sec}>Categories</Text>
            <View style={s.chips}>
              {['', ...CATEGORIES, ...seenCats.filter(c => !CATEGORIES.includes(c))].map(c => (
                <Text key={c || 'all'} onPress={() => setDCat(c)}
                  style={[s.chip, dCat === c && s.chipOn]}>{c || 'All'}</Text>
              ))}
            </View>
            </ScrollView>
            <View style={s.sheetFoot}>
              <View style={{ flex: 1 }}><Button title="Cancel" variant="secondary" onPress={() => setSheet(false)} /></View>
              <View style={{ flex: 2 }}><Button title="Apply" onPress={applySheet} /></View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background },
  col: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', padding: space.s4 },
  switch: { ...type.bodySm, color: p.primary, fontWeight: '600' },
  h1: { ...type.h1, fontSize: 22, color: p.ink },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.s3 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '55%',
    backgroundColor: p.surface, borderWidth: 1, borderColor: p.lineStrong,
    borderRadius: 18, paddingVertical: 6, paddingHorizontal: space.s3, ...shadow.sm,
  },
  pillT: { ...type.bodySm, color: p.ink, fontWeight: '600', flexShrink: 1 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: space.s3,
    backgroundColor: p.surface, borderRadius: 28, height: 56,
    paddingHorizontal: space.s2, paddingRight: space.s4, marginBottom: space.s3, ...shadow.sm,
  },
  searchIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: p.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  searchHint: { ...type.body, color: p.bodyText, flex: 1 },
  sub: { ...type.bodySm, color: p.bodyText, marginBottom: space.s4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2, marginTop: space.s2, marginBottom: space.s2 },
  chip: {
    paddingVertical: space.s2, paddingHorizontal: space.s4, borderWidth: 1,
    borderColor: p.lineStrong, borderRadius: 18, color: p.bodyText, overflow: 'hidden',
    fontSize: 14,
  },
  chipOn: { backgroundColor: p.primary, borderColor: p.primary, color: '#fff', fontWeight: '700' },
  input: {
    backgroundColor: p.surface, borderWidth: 1, borderColor: p.lineStrong, color: p.ink,
    borderRadius: radius.md, height: 48, paddingHorizontal: space.s4, fontSize: 16,
  },
  sec: { ...type.h3, color: p.ink, marginBottom: space.s2, marginTop: space.s4 },
  countryRow: { flexDirection: 'row', marginBottom: space.s2 },
  card: { backgroundColor: p.surface, borderRadius: radius.lg, padding: space.s4, marginTop: space.s3, ...shadow.md },
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
  bizRow: { flexDirection: 'row', gap: space.s3, alignItems: 'center' },
  pressed: { opacity: 0.85 },
  name: { ...type.h3, color: p.ink },
  meta: { ...type.micro, color: p.bodyText, marginTop: 4 },
  here: { fontSize: 12, color: p.primary, fontWeight: '700', marginTop: 2 },
  empty: { ...type.body, color: p.bodyText, marginTop: space.s6, textAlign: 'center' },
  sheetScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,.4)', justifyContent: 'flex-end' },
  sheet: {
    width: '100%', maxWidth: 720, alignSelf: 'center', backgroundColor: p.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: space.s5,
    maxHeight: '88%',
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.s3 },
  sheetBody: { flexShrink: 1 },
  sheetTitle: { ...type.h2, color: p.ink },
  sheetX: { padding: space.s1 },
  sheetFoot: { flexDirection: 'row', gap: space.s2, marginTop: space.s5, marginBottom: space.s2 },
});
