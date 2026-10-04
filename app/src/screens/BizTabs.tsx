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

// Business Updates: add-story tile + own statuses. No Message buttons —
export function BizUpdates({ onStore }: { onStore: (slug: string) => void }) {
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
      <TabHead title="Updates" />
      <Pressable onPress={() => setCompose(true)} style={s.card}>
        <View style={s.row}>
          <View style={s.plus}><Text style={s.plusT}>+</Text></View>
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
export function BizInbox({ onThread }: { onThread: (threadId: string, label: string) => void }) {
  const [rows, setRows] = useState<{ id: string; label: string }[] | null>(null);
  const { p } = useTheme();
  const s = themed(p);
  useEffect(() => {
    api.myBusinesses().then(async list => {
      if (!list[0]) { setRows([]); return; }
      const threads = await api.bizThreads(list[0].id);
      setRows(threads.map(t => ({
        id: t.id,
        label: t.messages[0]?.body ?? 'Photo message',
      })));
    }).catch(() => setRows([]));
  }, []);
  if (rows === null) return <ActivityIndicator style={{ marginTop: space.s8 }} />;

  return (
    <View style={s.root}>
      <TabHead title="Inbox" />
      {rows.length === 0 && <Text style={s.micro}>No chats yet — share the storefront link.</Text>}
      {rows.map(r => (
        <Pressable key={r.id} style={s.card}
          onPress={() => onThread(r.id, 'Customer chat')}>
          <Text style={s.t} numberOfLines={1}>{r.label}</Text>
          <Text style={s.micro}>Tap to reply</Text>
        </Pressable>
      ))}
    </View>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background, padding: space.s4 },
  card: { backgroundColor: p.surface, borderRadius: 16, padding: space.s4, marginBottom: space.s3 },
  row: { flexDirection: 'row', gap: space.s3, alignItems: 'center' },
  t: { ...type.h3, color: p.ink },
  micro: { ...type.micro, color: p.bodyText, marginTop: 4 },
  plus: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(194,78,34,.12)',
  },
  plusT: { fontSize: 24, color: C.cta },
});
