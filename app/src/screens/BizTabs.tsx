import { Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, Business } from '../api';
import { C, space, type } from '../theme';
import { Palette, useTheme } from '../useTheme';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Composer } from '../components/Composer';
import { StatusViewer } from '../components/StatusViewer';
import { statusLabel } from '../components/StatusViewer';
import { TabHead } from '../components/TabHead';
import { DrawerRoute } from '../components/Drawer';

// Business Updates: add-story tile + own statuses. No Message buttons —
export function BizUpdates({ onStore, dRoutes, dActive, onDNav }: {
  onStore: (slug: string) => void;
  dRoutes: DrawerRoute[]; dActive: DrawerRoute; onDNav: (r: DrawerRoute) => void;
}) {
  const [biz, setBiz] = useState<Business | null>(null);
  const [statuses, setStatuses] = useState<import('../api').Status[]>([]);
  const [compose, setCompose] = useState(false);
  const [view, setView] = useState(false);
  const { p } = useTheme();
  const s = themed(p);

  const load = async () => {
    try {
      const list = await api.myBusinesses();
      if (!list[0]) { setBiz(null); return; }
      setBiz(list[0]);
      const sf = await api.storefront(list[0].slug);
      setStatuses(sf.statuses);
    } catch { setBiz(null); }
  };
  useEffect(() => { load(); }, []);

  return (
    <View style={s.root}>
      <TabHead title="Updates" drawer="business" routes={dRoutes} active={dActive} onNav={onDNav} />
      <Pressable onPress={() => setCompose(true)} style={s.card}>
        <View style={s.row}>
          <View style={s.plus}><Plus size={24} color="#C24E22" /></View>
          <View>
            <Text style={s.t}>Add to your story</Text>
            <Text style={s.micro}>Share a photo or text update</Text>
          </View>
        </View>
      </Pressable>
      {biz && (
        <Pressable onPress={() => statuses.length && setView(true)} style={s.card}>
          <View style={s.row}>
            <Avatar name={biz.name} size={48} ring={statuses.length > 0} />
            <View style={{ flex: 1 }}>
              <Text style={s.t}>{biz.name}</Text>
              <Text style={s.micro}>{statuses.length} updates · tap to play</Text>
            </View>
          </View>
        </Pressable>
      )}
      {compose && biz && (
        <Composer businessId={biz.id} onClose={() => setCompose(false)}
          onPosted={() => { setCompose(false); load(); }} />
      )}
      {view && biz && (
        <StatusViewer
          items={statuses.map(s => ({ ...s, label: statusLabel(s, biz.name) }))}
          businessName={biz.name} businessId={biz.id}
          onClose={() => setView(false)} onMessage={() => setView(false)} />
      )}
    </View>
  );
}

// Business inbox: threads started by customers, newest first.
// Unread threads are tinted so new arrivals stand out.
export function BizInbox({ onThread, dRoutes, dActive, onDNav }: {
  onThread: (threadId: string, label: string) => void;
  dRoutes: DrawerRoute[]; dActive: DrawerRoute; onDNav: (r: DrawerRoute) => void;
}) {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof api.bizThreads>> | null>(null);
  const { p } = useTheme();
  const s = themed(p);
  useEffect(() => {
    api.myBusinesses().then(async list => {
      if (!list[0]) { setRows([]); return; }
      setRows(await api.bizThreads(list[0].id));
    }).catch(() => setRows([]));
  }, []);
  if (rows === null) return <ActivityIndicator style={{ marginTop: space.s8 }} />;

  return (
    <View style={s.root}>
      <TabHead title="Inbox" drawer="business" routes={dRoutes} active={dActive} onNav={onDNav} />
      {rows.length === 0 && <Text style={s.micro}>No chats yet — share the storefront link.</Text>}
      {rows.map(r => {
        const name = r.customer.name;
        return (
          <Pressable key={r.id} style={[s.card, r.unread > 0 && s.fresh]}
            onPress={() => onThread(r.id, name)}>
            <View style={s.row}>
              <Avatar name={name} size={48} online={r.customer.online} />
              <View style={{ flex: 1 }}>
                <Text style={[s.t, r.unread > 0 && s.tNew]} numberOfLines={1}>{name}</Text>
                {!!r.customer.tagline && r.customer.tagline !== name && (
                  <Text style={s.micro} numberOfLines={1}>{r.customer.tagline}</Text>
                )}
                {!!r.customer.contact && (
                  <Text style={s.micro} numberOfLines={1}>Reach: {r.customer.contact}</Text>
                )}
                <Text style={s.micro} numberOfLines={1}>
                  {r.messages[0]?.body ?? 'Photo message'}
                </Text>
              </View>
              {r.unread > 0 ? (
                <View style={s.badge}><Text style={s.badgeT}>{r.unread}</Text></View>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background, padding: space.s4 },
  card: { backgroundColor: p.surface, borderRadius: 16, padding: space.s4, marginBottom: space.s3 },
  fresh: { borderWidth: 1, borderColor: C.success },
  row: { flexDirection: 'row', gap: space.s3, alignItems: 'center' },
  t: { ...type.h3, color: p.ink },
  tNew: { fontWeight: '700' },
  micro: { ...type.micro, color: p.bodyText, marginTop: 4 },
  badge: {
    minWidth: 22, height: 22, borderRadius: 11, backgroundColor: C.error,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  badgeT: { color: '#fff', fontSize: 12, fontWeight: '700' },
  plus: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(194,78,34,.12)',
  },
  plusT: { fontSize: 24, color: C.cta },
});
