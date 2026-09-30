import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, Business } from '../api';
import { C, space, type } from '../theme';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Composer } from '../components/Composer';
import { StatusViewer } from '../components/StatusViewer';
import { statusLabel } from '../components/StatusViewer';

// Business Updates: add-story tile + own statuses. No Message buttons —
export function BizUpdates({ onStore }: { onStore: (slug: string) => void }) {
  const [biz, setBiz] = useState<Business | null>(null);
  const [statuses, setStatuses] = useState<import('../api').Status[]>([]);
  const [compose, setCompose] = useState(false);
  const [view, setView] = useState(false);

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
    <View style={styles.root}>
      <Text style={styles.h1}>Updates</Text>
      <Pressable onPress={() => setCompose(true)} style={styles.card}>
        <View style={styles.row}>
          <View style={styles.plus}><Text style={styles.plusT}>+</Text></View>
          <View>
            <Text style={styles.t}>Add to your story</Text>
            <Text style={styles.micro}>Share a photo or text update</Text>
          </View>
        </View>
      </Pressable>
      {biz && (
        <Pressable onPress={() => statuses.length && setView(true)} style={styles.card}>
          <View style={styles.row}>
            <Avatar name={biz.name} size={48} ring={statuses.length > 0} />
            <View style={{ flex: 1 }}>
              <Text style={styles.t}>{biz.name}</Text>
              <Text style={styles.micro}>{statuses.length} updates · tap to play</Text>
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
    <View style={styles.root}>
      <Text style={styles.h1}>Inbox</Text>
      {rows.length === 0 && <Text style={styles.micro}>No chats yet — share the storefront link.</Text>}
      {rows.map(r => (
        <Pressable key={r.id} style={styles.card}
          onPress={() => onThread(r.id, 'Customer chat')}>
          <Text style={styles.t} numberOfLines={1}>{r.label}</Text>
          <Text style={styles.micro}>Tap to reply</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background, padding: space.s4 },
  h1: { ...type.h1, color: C.ink, marginBottom: space.s4 },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: space.s4, marginBottom: space.s3 },
  row: { flexDirection: 'row', gap: space.s3, alignItems: 'center' },
  t: { ...type.h3, color: C.ink },
  micro: { ...type.micro, color: C.bodyText, marginTop: 4 },
  plus: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(194,78,34,.12)',
  },
  plusT: { fontSize: 24, color: C.cta },
});
