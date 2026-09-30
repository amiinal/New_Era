import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api, Business } from '../api';
import { useAuth } from '../auth';
import { C, radius, space, type } from '../theme';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Composer } from '../components/Composer';

// B1 business home (approved Step 10 layout): header with mode switch,
// hero actions, discovery checklist, free Insights (7/30d), listings
// preview, recent chats. Listings/inbox management are later slices.
export function BusinessHome({ onOpenStore }: { onOpenStore: (slug: string) => void }) {
  const { account, mode, setAppMode } = useAuth();
  const [biz, setBiz] = useState<Business | null>(null);
  const [range, setRange] = useState<7 | 30>(7);
  const [ins, setIns] = useState<{ storefrontViews: number; chatsStarted: number; listings: number; activeStatuses: number } | null>(null);
  const [compose, setCompose] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.myBusinesses()
      .then(list => setBiz(list[0] ?? null))
      .catch(() => setBiz(null))
      .finally(() => setLoaded(true));
  }, []);
  useEffect(() => {
    if (biz) api.insights(biz.id, range).then(setIns).catch(() => setIns(null));
  }, [biz?.id, range]);
  if (!loaded) return <ActivityIndicator style={{ marginTop: space.s8 }} />;
  if (!biz) {
    return (
      <View style={styles.root}>
        <Text style={styles.h1}>Business home</Text>
        <Text style={styles.micro}>This account has no business yet — onboarding lands in the next slice.</Text>
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
        <View style={{ flex: 2 }}><Button title="+ Add listing" onPress={() => {}} /></View>
        <View style={{ flex: 1 }}><Button title="Post status" variant="secondary" onPress={() => setCompose(true)} /></View>
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
          <>
            <Metric n={ins.storefrontViews} label="Storefront views" />
            <Metric n={ins.listings} label="Live listings" />
            <Metric n={ins.chatsStarted} label="Chats started" />
            <Metric n={ins.activeStatuses} label="Active statuses" />
          </>
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

function Metric({ n, label }: { n: number; label: string }) {
  return (
    <View style={styles.mrow}>
      <Text style={styles.mn}>{n}</Text>
      <Text style={styles.micro}>{label}</Text>
    </View>
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
  link: { ...type.body, color: C.primary, textAlign: 'center', marginVertical: space.s5 },
});
