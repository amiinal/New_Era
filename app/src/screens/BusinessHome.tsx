import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api, Business } from '../api';
import { useAuth } from '../auth';
import { C, radius, space, type } from '../theme';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Composer } from '../components/Composer';
import { Onboarding } from './Onboarding';

// B1 business home (approved Step 10 layout): header with mode switch,
// hero actions, discovery checklist, free Insights (7/30d), listings
// preview, recent chats. Listings/inbox management are later slices.
export function BusinessHome({ onOpenStore, onManage }: {
  onOpenStore: (slug: string) => void; onManage: () => void;
}) {
  const { account, mode, setAppMode } = useAuth();
  const [biz, setBiz] = useState<Business | null>(null);
  const [range, setRange] = useState<7 | 30>(7);
  const [ins, setIns] = useState<{ storefrontViews: number; chatsStarted: number; listings: number; activeStatuses: number } | null>(null);
  const [compose, setCompose] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [onboard, setOnboard] = useState(false);

  const loadBiz = async () => {
    try {
      const list = await api.myBusinesses();
      setBiz(list[0] ?? null);
    } catch { setBiz(null); }
  };
  useEffect(() => { loadBiz().finally(() => setLoaded(true)); }, []);
  useEffect(() => {
    if (biz) api.insights(biz.id, range).then(setIns).catch(() => setIns(null));
  }, [biz?.id, range]);
  if (!loaded) return <ActivityIndicator style={{ marginTop: space.s8 }} />;
  if (!biz) {
    return (
      <View style={styles.root}>
        <Text style={styles.h1}>Business home</Text>
        <Text style={styles.micro}>No storefront yet — go live in about 5 minutes.</Text>
        <View style={{ marginTop: space.s4 }}>
          <Button title="Start selling" onPress={() => setOnboard(true)} />
        </View>
        {onboard && <Onboarding onDone={() => { setOnboard(false); setLoaded(false); loadBiz().finally(() => setLoaded(true)); }} />}
      </View>
    );
  }

  return (
    <ScrollView style={styles.root}>
      <View style={styles.head}>
        <Avatar name={biz.name} size={56} />
        <View style={{ flex: 1 }}>
          <Text style={styles.h1}>{biz.name}</Text>
          <Text style={styles.micro}>{biz.category} · {biz.city}</Text>
        </View>
        <Pressable onPress={() => setAppMode(mode === 'business' ? 'customer' : 'business')}>
          <Text style={styles.switch}>{mode === 'business' ? 'Customer view' : 'Business view'}</Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <View style={{ flex: 2 }}><Button title="+ Add listing" onPress={onManage} /></View>
        <View style={{ flex: 1.4 }}><Button title="Post status" variant="secondary" onPress={() => setCompose(true)} /></View>
      </View>

      <View style={styles.card}>
        <Text style={styles.t}>Discovery checklist</Text>
        <Text style={styles.micro}>3+ photo items + category + location to appear in Discover.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.t}>Insights</Text>
          <View style={{ flexDirection: 'row', gap: space.s2 }}>
            {([7, 30] as const).map(r => (
              <Text key={r} onPress={() => setRange(r)}
                style={[styles.range, range === r && styles.rangeOn]}>{r}d</Text>
            ))}
          </View>
        </View>
        {ins ? (
          <View style={styles.grid}>
            <View style={styles.metric}><Text style={styles.mn}>{ins.storefrontViews}</Text><Text style={styles.micro}>Storefront views</Text></View>
            <View style={styles.metric}><Text style={styles.mn}>{ins.listings}</Text><Text style={styles.micro}>Live listings</Text></View>
            <View style={styles.metric}><Text style={styles.mn}>{ins.chatsStarted}</Text><Text style={styles.micro}>Chats started</Text></View>
            <View style={styles.metric}><Text style={styles.mn}>{ins.activeStatuses}</Text><Text style={styles.micro}>Active statuses</Text></View>
          </View>
        ) : <Text style={styles.micro}>Loading…</Text>}
        <Text style={styles.micro}>Private to you · deeper trends arrive with premium.</Text>
      </View>

      <Pressable onPress={() => onOpenStore(biz.slug)}>
        <Text style={styles.link}>View public storefront</Text>
      </Pressable>
      <Text style={styles.micro}>Signed in as {account?.email ?? account?.phone} · Listings + inbox management next.</Text>

      {compose && (
        <Composer businessId={biz.id} onClose={() => setCompose(false)}
          onPosted={() => { setCompose(false); api.insights(biz.id, range).then(setIns).catch(() => {}); }} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background, padding: space.s4 },
  head: { flexDirection: 'row', gap: space.s3, alignItems: 'center' },
  h1: { ...type.h1, fontSize: 22, color: C.ink },
  micro: { ...type.micro, color: C.bodyText, marginTop: 4 },
  switch: { ...type.bodySm, color: C.primary, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: space.s2, marginTop: space.s4 },
  card: { backgroundColor: C.surface, borderRadius: radius.lg, padding: space.s4, marginTop: space.s3 },
  t: { ...type.h3, color: C.ink },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  range: { ...type.bodySm, color: C.bodyText, padding: space.s2 },
  rangeOn: { color: C.primary, fontWeight: '700' },
  mrow: { flexDirection: 'row', alignItems: 'baseline', gap: space.s3, marginTop: space.s2 },
  mn: { ...type.h2, color: C.ink, fontVariant: ['tabular-nums'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s3, marginTop: space.s2 },
  metric: {
    flexBasis: '47%', flexGrow: 1, backgroundColor: C.background,
    borderRadius: radius.md, padding: space.s3,
  },
  link: { ...type.body, color: C.primary, textAlign: 'center', marginVertical: space.s5 },
});
