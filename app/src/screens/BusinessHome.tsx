import { Menu } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api, Business } from '../api';
import { useAuth } from '../auth';
import { radius, space, type } from '../theme';
import { Palette, useTheme } from '../useTheme';
import { Avatar } from '../components/Avatar';
import { BizProfile } from '../components/BizProfile';
import { Button } from '../components/Button';
import { Composer } from '../components/Composer';
import { Drawer, DrawerRoute } from '../components/Drawer';
import { Onboarding } from './Onboarding';

// B1 business home (approved Step 10 layout): header with mode switch,
// hero actions, discovery checklist, free Insights (7/30d), listings
// preview, recent chats. Listings/inbox management are later slices.
export function BusinessHome({ onOpenStore, onManage, dRoutes, dActive, onDNav, autoStart, onAutoDone }: {
  onOpenStore: (slug: string) => void; onManage: () => void;
  dRoutes: DrawerRoute[]; dActive: DrawerRoute; onDNav: (r: DrawerRoute) => void;
  autoStart?: boolean; onAutoDone?: () => void;
}) {
  const { account, mode, setAppMode } = useAuth();
  const [biz, setBiz] = useState<Business | null>(null);
  const [range, setRange] = useState<7 | 30>(7);
  const [ins, setIns] = useState<{ storefrontViews: number; chatsStarted: number; listings: number; activeStatuses: number } | null>(null);
  const [compose, setCompose] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [onboard, setOnboard] = useState(false);
  const [menu, setMenu] = useState(false);
  const [edit, setEdit] = useState(false);
  const { p, dark } = useTheme();
  const s = themed(p, dark);
  const link = dark ? '#7B90D6' : '#2C3E7A';

  const loadBiz = async () => {
    try {
      const list = await api.myBusinesses();
      setBiz(list[0] ?? null);
    } catch { setBiz(null); }
  };
  useEffect(() => { loadBiz().finally(() => setLoaded(true)); }, []);
  // Role entry: business picks open the wizard straight away when empty.
  useEffect(() => {
    if (autoStart && loaded && !biz) setOnboard(true);
    if (autoStart && loaded && biz) onAutoDone?.();
  }, [autoStart, loaded, biz?.id]);
  useEffect(() => {
    if (biz) api.insights(biz.id, range).then(setIns).catch(() => setIns(null));
  }, [biz?.id, range]);
  if (!loaded) return <ActivityIndicator style={{ marginTop: space.s8 }} />;
  if (!biz) {
    return (
      <View style={s.root}>
        <Text style={s.h1}>Business home</Text>
        <Text style={s.micro}>No storefront yet — go live in about 5 minutes.</Text>
        <View style={{ marginTop: space.s4 }}>
          <Button title="Start selling" onPress={() => setOnboard(true)} />
        </View>
        {onboard && <Onboarding onDone={() => { setOnboard(false); onAutoDone?.(); setLoaded(false); loadBiz().finally(() => setLoaded(true)); }} />}
      </View>
    );
  }

  return (
    <ScrollView style={s.root}>
      <View style={s.head}>
        <Pressable onPress={() => setMenu(true)}>
          <Menu size={24} color={p.ink} />
        </Pressable>
        <Pressable onPress={() => setEdit(true)}>
          <Avatar name={biz.name} size={56} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.h1}>{biz.name}</Text>
          <Text style={s.micro}>{biz.category} · {biz.city}</Text>
        </View>
        <Pressable onPress={() => setAppMode(mode === 'business' ? 'customer' : 'business')}>
          <Text style={[s.switch, { color: link }]}>{mode === 'business' ? 'Customer view' : 'Business view'}</Text>
        </Pressable>
      </View>

      <View style={s.actions}>
        <View style={{ flex: 2 }}><Button title="+ Add listing" onPress={onManage} /></View>
        <View style={{ flex: 1.4 }}><Button title="Post status" variant="secondary" onPress={() => setCompose(true)} /></View>
      </View>

      <View style={s.card}>
        <Text style={s.t}>Discovery checklist</Text>
        <Text style={s.micro}>3+ photo items + category + location to appear in Discover.</Text>
      </View>

      <View style={s.card}>
        <View style={s.row}>
          <Text style={s.t}>Insights</Text>
          <View style={{ flexDirection: 'row', gap: space.s2 }}>
            {([7, 30] as const).map(r => (
              <Text key={r} onPress={() => setRange(r)}
                style={[s.range, range === r && s.rangeOn]}>{r}d</Text>
            ))}
          </View>
        </View>
        {ins ? (
          <View style={s.grid}>
            <View style={s.metric}><Text style={s.mn}>{ins.storefrontViews}</Text><Text style={s.micro}>Storefront views</Text></View>
            <View style={s.metric}><Text style={s.mn}>{ins.listings}</Text><Text style={s.micro}>Live listings</Text></View>
            <View style={s.metric}><Text style={s.mn}>{ins.chatsStarted}</Text><Text style={s.micro}>Chats started</Text></View>
            <View style={s.metric}><Text style={s.mn}>{ins.activeStatuses}</Text><Text style={s.micro}>Active statuses</Text></View>
          </View>
        ) : <Text style={s.micro}>Loading…</Text>}
        <Text style={s.micro}>Private to you · deeper trends arrive with premium.</Text>
      </View>

      <Pressable onPress={() => onOpenStore(biz.slug)}>
        <Text style={[s.link, { color: link }]}>View public storefront</Text>
      </Pressable>
      <Text style={s.micro}>Signed in as {account?.email ?? account?.phone} · Listings + inbox management next.</Text>

      {compose && (
        <Composer businessId={biz.id} onClose={() => setCompose(false)}
          onPosted={() => { setCompose(false); api.insights(biz.id, range).then(setIns).catch(() => {}); }} />
      )}
      {menu && <Drawer mode="business" routes={dRoutes} active={dActive}
        onNav={r => { setMenu(false); onDNav(r); }} onClose={() => setMenu(false)} />}
      {edit && <BizProfile onClose={() => setEdit(false)}
        onSaved={() => { setEdit(false); setLoaded(false); loadBiz().finally(() => setLoaded(true)); }} />}
    </ScrollView>
  );
}

const themed = (p: Palette, dark: boolean) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background, padding: space.s4 },
  head: { flexDirection: 'row', gap: space.s3, alignItems: 'center' },
  h1: { ...type.h1, fontSize: 22, color: p.ink },
  micro: { ...type.micro, color: p.bodyText, marginTop: 4 },
  switch: { ...type.bodySm, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: space.s2, marginTop: space.s4 },
  card: { backgroundColor: p.surface, borderRadius: radius.lg, padding: space.s4, marginTop: space.s3 },
  t: { ...type.h3, color: p.ink },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  range: { ...type.bodySm, color: p.bodyText, padding: space.s2 },
  rangeOn: { color: dark ? '#7B90D6' : '#2C3E7A', fontWeight: '700' },
  mrow: { flexDirection: 'row', alignItems: 'baseline', gap: space.s3, marginTop: space.s2 },
  mn: { ...type.h2, color: p.ink, fontVariant: ['tabular-nums'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s3, marginTop: space.s2 },
  metric: {
    flexBasis: '47%', flexGrow: 1, backgroundColor: p.background,
    borderRadius: radius.md, padding: space.s3,
  },
  link: { ...type.body, color: dark ? '#7B90D6' : '#2C3E7A', textAlign: 'center', marginVertical: space.s5 },
});
