import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api, FeedStatus, img, MyThread, Storefront } from '../api';
import { useAuth } from '../auth';
import { C, shadow, space, type } from '../theme';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import { StatusViewer, statusLabel } from '../components/StatusViewer';
import { DrawerRoute } from '../ui';
import { Palette, useTheme } from '../useTheme';

// Customer Updates: live feed of recent business statuses, one card per
// business — avatar ring plays its stories. Posting lives in business
// mode only — no add tile, no account switcher.
export function UpdatesScreen({
  onMessage, onOpen, dRoutes, dActive, onDNav, onSignIn, onStartSelling,
}: {
  onMessage: (businessId: string, label: string) => void;
  onOpen: (slug: string) => void;
  dRoutes: DrawerRoute[]; dActive: DrawerRoute; onDNav: (r: DrawerRoute) => void;
  onSignIn?: () => void; onStartSelling?: () => void;
}) {
  const [items, setItems] = useState<FeedStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [viewBiz, setViewBiz] = useState<string | null>(null);
  const { p } = useTheme();
  const s = themed(p);

  const load = async () => {
    setLoading(true);
    try { setItems(await api.updates()); setFailed(false); } catch { setItems([]); setFailed(true); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  // Newest-first feed, grouped so each business gets one card.
  const groups = useMemo(() => {
    const m = new Map<string, { biz: FeedStatus['business']; items: FeedStatus[] }>();
    for (const it of items) {
      const g = m.get(it.businessId);
      if (g) g.items.push(it);
      else m.set(it.businessId, { biz: it.business, items: [it] });
    }
    return [...m.values()];
  }, [items]);
  const viewing = viewBiz ? groups.find(g => g.biz.id === viewBiz) ?? null : null;

  return (
    <View style={s.root}>
      <ScrollView style={s.root} contentContainerStyle={s.col}
        bounces={false} overScrollMode="never">
      <View style={s.headRow}>
        <Text style={s.h1}>Updates</Text>
        {onStartSelling ? (
          <Text onPress={onStartSelling} numberOfLines={1} style={s.switch}>Start selling</Text>
        ) : null}
      </View>
      {loading && <Skeleton kind="card" />}
      {!loading && failed && (
        <View style={s.card}>
          <Text style={s.t}>Couldn&apos;t load updates.</Text>
          <Text style={s.micro}>Check your connection, then retry.</Text>
          <View style={{ marginTop: space.s3 }}>
            <Button title="Retry" variant="secondary" onPress={load} />
          </View>
        </View>
      )}
      {!loading && !failed && groups.length === 0 && (
        <Text style={s.micro}>Nothing posted in the last 24 hours — check back soon.</Text>
      )}
      {groups.map(g => (
        <Pressable key={g.biz.id} onPress={() => setViewBiz(g.biz.id)} style={s.card}>
          <View style={s.row}>
            <Avatar name={g.biz.name} size={48} ring uri={g.biz.logoKey ? img(g.biz.logoKey) : null} />
            <View style={{ flex: 1 }}>
              <Text style={s.t} onPress={() => onOpen(g.biz.slug)}>{g.biz.name}</Text>
              <Text style={s.micro}>{g.items.length} update{g.items.length === 1 ? '' : 's'} · latest {ago(g.items[0].createdAt)}</Text>
            </View>
          </View>
          <View style={{ marginTop: space.s3 }}>
            <Button title="Message"
              onPress={() => onMessage(g.biz.id, `Say hello to ${g.biz.name}`)} />
          </View>
        </Pressable>
      ))}
      {viewing && (
        <StatusViewer
          items={viewing.items.map(s => ({ ...s, label: statusLabel(s, viewing.biz.name) }))}
          businessName={viewing.biz.name} businessId={viewing.biz.id}
          onClose={() => { setViewBiz(null); load(); }} onMessage={onMessage} />
      )}
      </ScrollView>
    </View>
  );
}

function ago(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

// Chats: only threads the customer actually opened — no demo entries.
// An empty list invites discovery instead.
export function ChatsScreen({ onOpenThread, dRoutes, dActive, onDNav, onSignIn, onStartSelling }: {
  onOpenThread: (businessId: string, label: string) => void;
  dRoutes: DrawerRoute[]; dActive: DrawerRoute; onDNav: (r: DrawerRoute) => void;
  onSignIn?: () => void; onStartSelling?: () => void;
}) {
  const { account } = useAuth();
  const [rows, setRows] = useState<MyThread[] | null>(null);
  const [failed, setFailed] = useState(false);
  const { p } = useTheme();
  const s = themed(p);
  const load = () => {
    api.myThreads().then(r => { setRows(r); setFailed(false); }).catch(() => { setRows([]); setFailed(true); });
  };
  useEffect(() => { load(); }, []);
  if (!account) {
    return (
      <View style={s.root}>
        <View style={s.col}>
          <View style={s.headRow}>
            <Text style={s.h1}>Chats</Text>
            {onStartSelling ? (
              <Text onPress={onStartSelling} numberOfLines={1} style={s.switch}>Start selling</Text>
            ) : null}
          </View>
          <View style={s.card}>
            <Text style={s.t}>Message a business to start chatting.</Text>
            <Text style={s.micro}>Find something you like — sign-in pops up when you message.</Text>
            <View style={{ marginTop: space.s3 }}>
              <Button title="Discover businesses" onPress={() => onDNav('discover')} />
            </View>
          </View>
        </View>
      </View>
    );
  }
  if (rows === null) return <ActivityIndicator style={{ marginTop: space.s8 }} />;
  const mine = rows.filter(t => t.customerId === account.id);

  return (
    <View style={s.root}>
      <View style={s.col}>
      <View style={s.headRow}>
        <Text style={s.h1}>Chats</Text>
        {onStartSelling ? (
          <Text onPress={onStartSelling} numberOfLines={1} style={s.switch}>Start selling</Text>
        ) : null}
      </View>
      {mine.map(t => (
        <Pressable key={t.id} onPress={() => onOpenThread(t.business.id, `Say hello to ${t.business.name}`)} style={({ pressed }) => [s.card, t.unread > 0 && s.fresh, pressed && s.pressed]}>
          <View style={s.row}>
            <Avatar name={t.business.name} size={56} online={t.online} uri={t.business.logoKey ? img(t.business.logoKey) : null} />
            <View style={{ flex: 1 }}>
              <Text style={[s.t, t.unread > 0 && s.tNew]}>{t.business.name}</Text>
              <Text style={s.micro} numberOfLines={1}>
                {t.messages[0]?.body || 'Photo'}
              </Text>
            </View>
            {t.unread > 0 ? (
              <View style={s.badge}><Text style={s.badgeT}>{t.unread}</Text></View>
            ) : null}
          </View>
        </Pressable>
      ))}
      {mine.length === 0 && !failed && (
        <Text style={s.micro}>No chats yet — discover a business and say hello.</Text>
      )}
      {mine.length === 0 && failed && (
        <View style={s.card}>
          <Text style={s.t}>Couldn&apos;t load chats.</Text>
          <Text style={s.micro}>Check your connection, then retry.</Text>
          <View style={{ marginTop: space.s3 }}>
            <Button title="Retry" variant="secondary" onPress={load} />
          </View>
        </View>
      )}
      </View>
    </View>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background },
  col: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', padding: space.s4 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: space.s2, marginBottom: space.s3 },
  h1: { ...type.h1, fontSize: 22, color: p.ink, flex: 1 },
  switch: { ...type.bodySm, color: p.primary, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  card: { backgroundColor: p.surface, borderRadius: 16, padding: space.s4, marginBottom: space.s3, ...shadow.md },
  pressed: { opacity: 0.85 },
  fresh: { borderWidth: 1, borderColor: C.success },
  row: { flexDirection: 'row', gap: space.s3, alignItems: 'center' },
  t: { ...type.h3, color: p.ink },
  tNew: { fontWeight: '700', fontFamily: 'Inter_700Bold' },
  micro: { ...type.micro, color: p.bodyText, marginTop: 4 },
  badge: {
    minWidth: 22, height: 22, borderRadius: 11, backgroundColor: C.error,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  badgeT: { color: '#fff', fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold' },
});
