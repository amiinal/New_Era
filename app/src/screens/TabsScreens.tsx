import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, Storefront } from '../api';
import { space, type } from '../theme';
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
  onMessage, onOpen, dRoutes, dActive, onDNav,
}: {
  onMessage: (businessId: string, label: string) => void;
  onOpen: (slug: string) => void;
  dRoutes: DrawerRoute[]; dActive: DrawerRoute; onDNav: (r: DrawerRoute) => void;
}) {
  const [sf, setSf] = useState<Storefront | null>(null);
  const [view, setView] = useState(false);
  const { p } = useTheme();
  const s = themed(p);

  const load = async () => {
    try { setSf(await api.storefront('mamas-kitchen')); } catch { setSf(null); }
  };
  useEffect(() => { load(); }, []);

  return (
    <View style={s.root}>
      <TabHead title="Updates" drawer="customer" routes={dRoutes} active={dActive} onNav={onDNav} />
      {!sf && <Skeleton kind="card" />}
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
  );
}

// Chats (Step 8 shell): Mama's Kitchen demo thread first. Tapping opens
// the real thread — same history in app and web (CHT-4).
export function ChatsScreen({ onOpenThread, dRoutes, dActive, onDNav }: {
  onOpenThread: (businessId: string, label: string) => void;
  dRoutes: DrawerRoute[]; dActive: DrawerRoute; onDNav: (r: DrawerRoute) => void;
}) {
  const [biz, setBiz] = useState<{ id: string; name: string } | null>(null);
  const { p } = useTheme();
  const s = themed(p);
  useEffect(() => {
    api.storefront('mamas-kitchen')
      .then(sf => setBiz({ id: sf.business.id, name: sf.business.name }))
      .catch(() => setBiz(null));
  }, []);
  if (!biz) return <ActivityIndicator style={{ marginTop: space.s8 }} />;

  return (
    <View style={s.root}>
      <TabHead title="Chats" drawer="customer" routes={dRoutes} active={dActive} onNav={onDNav} />
      <Pressable onPress={() => onOpenThread(biz.id, `Say hello to ${biz.name}`)} style={s.card}>
        <View style={s.row}>
          <Avatar name={biz.name} size={48} />
          <View>
            <Text style={s.t}>{biz.name}</Text>
            <Text style={s.micro}>Tap to open demo thread</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background, padding: space.s4 },
  card: { backgroundColor: p.surface, borderRadius: 16, padding: space.s4, marginBottom: space.s3 },
  row: { flexDirection: 'row', gap: space.s3, alignItems: 'center' },
  t: { ...type.h3, color: p.ink },
  micro: { ...type.micro, color: p.bodyText, marginTop: 4 },
});
