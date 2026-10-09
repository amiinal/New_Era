import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, MyThread, Storefront } from '../api';
import { useAuth } from '../auth';
import { C, shadow, space, type } from '../theme';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import { StatusViewer, statusLabel } from '../components/StatusViewer';
import { TabHead } from '../components/TabHead';
import { DrawerRoute } from '../components/Drawer';
import { Palette, useTheme } from '../useTheme';

// Customer Updates: one card per business, avatar ring plays its stories.
// Posting lives in business mode only — no add tile, no account switcher.
export function UpdatesScreen({
  onMessage, onOpen, dRoutes, dActive, onDNav, onSignIn,
}: {
  onMessage: (businessId: string, label: string) => void;
  onOpen: (slug: string) => void;
  dRoutes: DrawerRoute[]; dActive: DrawerRoute; onDNav: (r: DrawerRoute) => void;
  onSignIn?: () => void;
}) {
  const [sf, setSf] = useState<Storefront | null>(null);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState(false);
  const { p } = useTheme();
  const s = themed(p);

  const load = async () => {
    try { setSf(await api.storefront('mamas-kitchen')); setFailed(false); } catch { setSf(null); setFailed(true); }
  };
  useEffect(() => { load(); }, []);

  return (
    <View style={s.root}>
      <View style={s.col}>
      <TabHead title="Updates" drawer="customer" routes={dRoutes} active={dActive} onNav={onDNav} onSignIn={onSignIn} />
      {!sf && !failed && <Skeleton kind="card" />}
      {!sf && failed && (
        <View style={s.card}>
          <Text style={s.t}>Couldn&apos;t load updates.</Text>
          <Text style={s.micro}>Check your connection, then retry.</Text>
          <View style={{ marginTop: space.s3 }}>
            <Button title="Retry" variant="secondary" onPress={load} />
          </View>
        </View>
      )}
      {sf && sf.statuses.length === 0 && (
        <Text style={s.micro}>Nothing posted in the last 24 hours — check back soon.</Text>
      )}
      {sf && sf.statuses.length > 0 && (
        <Pressable onPress={() => setView(true)} style={s.card}>
          <View style={s.row}>
            <Avatar name={sf.business.name} size={48} ring={sf.statuses.length > 0} />
            <View style={{ flex: 1 }}>
              <Text style={s.t}>{sf.business.name}</Text>
              <Text style={s.micro}>{sf.statuses.length} updates · latest 5h ago</Text>
            </View>
          </View>
          <View style={{ marginTop: space.s3 }}>
            <Button title="Message"
              onPress={() => onMessage(sf.business.id, `Say hello to ${sf.business.name}`)} />
          </View>
        </Pressable>
      )}
      {view && sf && (
        <StatusViewer
          items={sf.statuses.map(s => ({ ...s, label: statusLabel(s, sf.business.name) }))}
          businessName={sf.business.name} businessId={sf.business.id}
          onClose={() => { setView(false); load(); }} onMessage={onMessage} />
      )}
      </View>
    </View>
  );
}

// Chats (Step 8 shell): real threads first, Mama's Kitchen demo to start
// one when empty — same history in app and web (CHT-4).
export function ChatsScreen({ onOpenThread, dRoutes, dActive, onDNav, onSignIn }: {
  onOpenThread: (businessId: string, label: string) => void;
  dRoutes: DrawerRoute[]; dActive: DrawerRoute; onDNav: (r: DrawerRoute) => void;
  onSignIn?: () => void;
}) {
  const { account } = useAuth();
  const [rows, setRows] = useState<MyThread[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [biz, setBiz] = useState<{ id: string; name: string } | null>(null);
  const { p } = useTheme();
  const s = themed(p);
  const load = () => {
    api.myThreads().then(r => { setRows(r); setFailed(false); }).catch(() => { setRows([]); setFailed(true); });
    api.storefront('mamas-kitchen')
      .then(sf => setBiz({ id: sf.business.id, name: sf.business.name }))
      .catch(() => setBiz(null));
  };
  useEffect(() => { load(); }, []);
  if (rows === null || !account) return <ActivityIndicator style={{ marginTop: space.s8 }} />;
  const mine = rows.filter(t => t.customerId === account.id);

  return (
    <View style={s.root}>
      <View style={s.col}>
      <TabHead title="Chats" drawer="customer" routes={dRoutes} active={dActive} onNav={onDNav} onSignIn={onSignIn} />
      {mine.map(t => (
        <Pressable key={t.id} onPress={() => onOpenThread(t.business.id, `Say hello to ${t.business.name}`)} style={({ pressed }) => [s.card, t.unread > 0 && s.fresh, pressed && s.pressed]}>
          <View style={s.row}>
            <Avatar name={t.business.name} size={56} online={t.online} />
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
      {mine.length === 0 && !failed && biz && (
        <Pressable onPress={() => onOpenThread(biz.id, `Say hello to ${biz.name}`)} style={({ pressed }) => [s.card, pressed && s.pressed]}>
          <View style={s.row}>
            <Avatar name={biz.name} size={48} />
            <View>
              <Text style={s.t}>{biz.name}</Text>
              <Text style={s.micro}>Tap to open demo thread</Text>
            </View>
          </View>
        </Pressable>
      )}
      {mine.length === 0 && !failed && !biz && (
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
  card: { backgroundColor: p.surface, borderRadius: 16, padding: space.s4, marginBottom: space.s3, ...shadow.md },
  pressed: { opacity: 0.85 },
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
});
