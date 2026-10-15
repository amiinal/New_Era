import { MapPin, Search, X } from 'lucide-react-native';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, Business, img, SITE_URL } from '../api';
import { COUNTRIES } from '../countries';
import { getFlag, setFlag } from '../store';
import { C, radius, shadow, space, type } from '../theme';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import { DrawerRoute } from '../ui';
import { Palette, useTheme } from '../useTheme';

// Discover: static header (title + location pill + search),
// filter sheet (query, city, country, tags), scrolling business cards.
// Location defaults to real geolocation; everything else is picked in the
// sheet and committed with Apply.
const CATEGORIES = ['Fashion', 'Beauty', 'Food', 'Home', 'Electronics', 'Services'];

function growCats(list: Business[], prev: string[]): string[] {
  const next = [...prev];
  for (const b of list) {
    if (b.category && !CATEGORIES.includes(b.category) && !next.includes(b.category)) {
      next.push(b.category);
    }
  }
  return next;
}

function growCities(list: Business[], prev: string[]): string[] {
  const next = [...prev];
  for (const b of list) {
    if (b.city && !next.includes(b.city)) next.push(b.city);
  }
  return next.slice(0, 8);
}
export function DiscoverScreen({ onOpen, dRoutes, dActive, onDNav, onStartSelling, onSignIn }: {
  onOpen: (slug: string) => void;
  dRoutes: DrawerRoute[]; dActive: DrawerRoute; onDNav: (r: DrawerRoute) => void;
  onStartSelling?: () => void; onSignIn?: () => void;
}) {
  const { p } = useTheme();
  const s = themed(p);
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('NG');
  const [cats, setCats] = useState<string[]>([]);
  const [items, setItems] = useState<Business[] | null>(null);
  const [failed, setFailed] = useState(false);
  // Nearby fallback: same intent, country-wide, when the city has nothing.
  const [nearby, setNearby] = useState<Business[] | null>(null);
  const [seenCats, setSeenCats] = useState<string[]>([]);
  const [seenCities, setSeenCities] = useState<string[]>([]);
  // Country type-to-filter dropdown + focused-field highlight.
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
  const [dCats, setDCats] = useState<string[]>([]);
  const [countryQ, setCountryQ] = useState('');
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [focused, setFocused] = useState<'q' | 'city' | 'country' | null>(null);
  const focusStyle = (k: 'q' | 'city' | 'country') =>
    focused === k ? { borderColor: p.primary, borderWidth: 2 } : null;

  const runLoad = async (scope: { country: string; city?: string; q?: string; cats?: string[] }) => {
    setNearby(null);
    try {
      // One tag = one query; several tags = parallel queries merged by id.
      const wanted = (scope.cats ?? []).filter(Boolean);
      const queries = wanted.length > 0 ? wanted : [undefined];
      const batches = await Promise.all(queries.map(cat => api.discover({
        country: scope.country,
        ...(scope.city ? { city: scope.city } : {}),
        ...(scope.q ? { q: scope.q } : {}),
        ...(cat ? { category: cat } : {}),
      })));
      const seen = new Map<string, Business>();
      for (const rows of batches) for (const b of rows) seen.set(b.id, b);
      const rows = [...seen.values()];
      setItems(rows);
      setFailed(false);
      setSeenCats(prev => growCats(rows, prev));
      setSeenCities(prev => growCities(rows, prev));
      if (scope.city && rows.length === 0) {
        try {
          const nearBatches = await Promise.all(queries.map(cat => api.discover({
            country: scope.country,
            ...(scope.q ? { q: scope.q } : {}),
            ...(cat ? { category: cat } : {}),
          })));
          const nearSeen = new Map<string, Business>();
          for (const list of nearBatches) for (const b of list) nearSeen.set(b.id, b);
          const near = [...nearSeen.values()];
          setNearby(near);
          setSeenCats(prev => growCats(near, prev));
          setSeenCities(prev => growCities(near, prev));
        } catch { setNearby([]); }
      } else {
        setNearby([]);
      }
      api.recordEvent('search', {
        country: scope.country,
        ...(scope.city ? { city: scope.city } : {}),
        ...(scope.q ? { q: scope.q } : {}),
        ...(wanted.length > 0 ? { category: wanted.join(',') } : {}),
      }).catch(() => {});
    } catch { setItems([]); setNearby([]); setFailed(true); }
  };
  const load = () => {
    runLoad({
      country,
      ...(city ? { city } : {}), ...(q ? { q } : {}), ...(cats.length > 0 ? { cats } : {}),
    });
  };
  useEffect(() => { load(); }, []);

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
    setDCats(cats);
    setCountryQ('');
    setCountryOpen(false);
    setCityOpen(false);
    setSheet(true);
  };
  const applySheet = () => {
    setQ(dQ);
    setCity(dCity);
    setCountry(dCountry);
    setCats(dCats);
    setCountryOpen(false);
    setCityOpen(false);
    setSheet(false);
    runLoad({
      country: dCountry,
      ...(dCity ? { city: dCity } : {}), ...(dQ ? { q: dQ } : {}), ...(dCats.length > 0 ? { cats: dCats } : {}),
    });
  };
  const clearFilters = () => {
    setQ('');
    setCats([]);
    setSheet(false);
    runLoad({ country, ...(city ? { city } : {}) });
  };

  const countryName = COUNTRIES.find(c => c.code === country)?.name ?? country;
  const draftCountryName = COUNTRIES.find(c => c.code === dCountry)?.name ?? dCountry;
  const countryMatches = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countryQ.trim().toLowerCase()),
  ).slice(0, 8);
  const cityMatches = seenCities.filter(c =>
    c.toLowerCase().includes(dCity.trim().toLowerCase()),
  ).slice(0, 8);
  const pillText = `${city ? `${city}, ` : ''}${countryName}`;
  const here = (b: Business) =>
    city && b.city && b.city.toLowerCase() === city.toLowerCase();

  const bizCard = (item: Business) => (
    <>
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
      {(item.previewPhotos?.length ?? 0) > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={s.strip} contentContainerStyle={s.stripInner}>
          {item.previewPhotos!.slice(0, 5).map(u => (
            <Pressable key={u} onPress={() => onOpen(item.slug)}>
              <Image source={{ uri: img(u) }} style={s.stripImg} />
            </Pressable>
          ))}
          <Pressable onPress={() => onOpen(item.slug)} style={s.seeMore}>
            <Text style={s.seeMoreT}>See more ›</Text>
          </Pressable>
        </ScrollView>
      ) : null}
    </>
  );
  const emptyCard = (
    <View style={s.card}>
      <Text style={s.empty}>No matches here — try widening the city or clearing tags.</Text>
      <View style={{ marginTop: space.s3 }}>
        <Button title="Clear filters" variant="secondary" onPress={clearFilters} />
      </View>
    </View>
  );

  return (
    <View style={s.root}>
      <View style={s.col}>
      <View style={s.headRow}>
        <Text style={s.h1}>Discover</Text>
        <Pressable onPress={openSheet} style={s.pillText} hitSlop={8}>
          <MapPin size={14} color={p.primary} />
          <Text style={s.pillT} numberOfLines={1}>{pillText}</Text>
        </Pressable>
      </View>
      <Pressable onPress={openSheet} style={({ pressed }) => [s.searchBar, pressed && s.pressed]}>
        <View style={s.searchIcon}>
          <Search size={16} color="#fff" />
        </View>
        <Text style={s.searchHint} numberOfLines={1}>
          {q || (cats.length > 0 ? `${cats.join(' + ')} near ${city || countryName}` : 'Search businesses…')}
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
      ) : city && items.length === 0 ? (
        nearby === null ? (
          <><Skeleton kind="row" /><Skeleton kind="row" /></>
        ) : nearby.length > 0 ? (
          <ScrollView style={{ flex: 1 }}>
            <Text style={s.nearH}>Nothing in {city} yet</Text>
            <Text style={s.micro}>Nearby stores instead.</Text>
            {nearby.map(b => <View key={b.id}>{bizCard(b)}</View>)}
          </ScrollView>
        ) : (
          emptyCard
        )
      ) : items.length === 0 ? (
        emptyCard
      ) : (
        <FlatList data={items} keyExtractor={b => b.id} style={{ flex: 1 }}
          renderItem={({ item }) => bizCard(item)} />
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
            <TextInput style={[s.input, focusStyle('q')]} placeholder="What are you looking for?" placeholderTextColor={p.bodyText}
              value={dQ} onChangeText={setDQ} autoFocus returnKeyType="search" onSubmitEditing={applySheet}
              onFocus={() => setFocused('q')} onBlur={() => setFocused(null)} />
            <ScrollView style={s.sheetBody} keyboardShouldPersistTaps="handled">
            <TextInput style={[s.input, { marginTop: space.s3 }, focusStyle('city')]} placeholder="Search by city" placeholderTextColor={p.bodyText}
              value={dCity} onChangeText={t => { setDCity(t); setCityOpen(true); }}
              onFocus={() => { setCityOpen(true); setFocused('city'); }} onPressIn={() => setCityOpen(true)}
              onBlur={() => setFocused(null)} />
            {cityOpen && (
              <View style={s.drop}>
                <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {dCity.trim() ? (
                    <Text onPress={() => setCityOpen(false)} style={s.dropItem}>
                      Use “{dCity.trim()}”
                    </Text>
                  ) : null}
                  {cityMatches.filter(c => c.toLowerCase() !== dCity.trim().toLowerCase()).map(c => (
                    <Text key={c} onPress={() => { setDCity(c); setCityOpen(false); }} style={s.dropItem}>{c}</Text>
                  ))}
                  {dCity.trim() === '' && cityMatches.length === 0 && (
                    <Text style={s.micro}>Saved cities appear here — or just type it.</Text>
                  )}
                </ScrollView>
              </View>
            )}
            <Text style={s.sec}>Country</Text>
            <TextInput style={[s.input, focusStyle('country')]} placeholder={draftCountryName} placeholderTextColor={p.bodyText}
              value={countryQ}
              onFocus={() => { setCountryQ(''); setCountryOpen(true); setFocused('country'); }}
              onPressIn={() => setCountryOpen(true)}
              onChangeText={t => { setCountryQ(t); setCountryOpen(true); }}
              onBlur={() => setFocused(null)} />
            {countryOpen && (
              <View style={s.drop}>
                <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {countryMatches.map(c => (
                    <Text key={c.code} onPress={() => { setDCountry(c.code); setCountryQ(''); setCountryOpen(false); }}
                      style={[s.dropItem, dCountry === c.code && s.dropOn]}>
                      {dCountry === c.code ? '✓ ' : ''}{c.name}
                    </Text>
                  ))}
                  {countryMatches.length === 0 && <Text style={s.micro}>No match — try another spelling.</Text>}
                </ScrollView>
              </View>
            )}
            <Text style={s.sec}>Categories <Text style={s.secSub}>— pick as many as you like</Text></Text>
            <View style={s.chips}>
              {['', ...CATEGORIES, ...seenCats.filter(c => !CATEGORIES.includes(c))].map(c => {
                const on = c === '' ? dCats.length === 0 : dCats.includes(c);
                return (
                  <Text key={c || 'all'} onPress={() => {
                    if (c === '') setDCats([]);
                    else setDCats(on ? dCats.filter(x => x !== c) : [...dCats, c]);
                  }}
                    style={[s.chip, on && s.chipOn]}>{c || 'All'}</Text>
                );
              })}
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
  h1: { ...type.h1, fontSize: 22, color: p.ink, flex: 1 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: space.s2, marginBottom: space.s3 },
  pillText: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1, maxWidth: '42%' },
  pillT: { ...type.bodySm, color: p.primary, fontWeight: '600', flexShrink: 1 },
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
  secSub: { fontWeight: '400', fontSize: 14, color: p.bodyText },
  drop: {
    backgroundColor: p.surface, borderWidth: 1, borderColor: p.lineStrong,
    borderRadius: radius.md, marginTop: space.s1, paddingVertical: space.s1,
  },
  dropItem: { ...type.body, color: p.ink, paddingVertical: space.s2, paddingHorizontal: space.s4 },
  dropOn: { color: p.primary, fontWeight: '700' },
  micro: { ...type.micro, color: p.bodyText, padding: space.s2 },
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
  nearH: { ...type.h3, color: p.ink, marginTop: space.s3 },
  meta: { ...type.micro, color: p.bodyText, marginTop: 4 },
  here: { fontSize: 12, color: p.primary, fontWeight: '700', marginTop: 2 },
  strip: { marginTop: space.s2 },
  stripInner: { gap: space.s2, paddingRight: space.s1 },
  stripImg: { width: 120, height: 120, borderRadius: radius.md, backgroundColor: p.line },
  seeMore: {
    width: 96, height: 120, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: space.s2,
  },
  seeMoreT: { ...type.bodySm, color: C.cta, fontWeight: '700', textAlign: 'center', textDecorationLine: 'underline' },
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
