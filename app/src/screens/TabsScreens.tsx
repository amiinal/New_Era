import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, Storefront } from '../api';
import { C, space, type } from '../theme';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { StatusViewer, statusLabel } from '../components/StatusViewer';

// Customer Updates: one card per business, avatar ring plays its stories.
// Posting lives in business mode only — no add tile, no account switcher.
export function UpdatesScreen({
  onMessage, onOpen,
}: {
  onMessage: (businessId: string, label: string) => void;
  onOpen: (slug: string) => void;
}) {
  const [sf, setSf] = useState<Storefront | null>(null);
  const [view, setView] = useState(false);

  const load = async () => {
    try { setSf(await api.storefront('mamas-kitchen')); } catch { setSf(null); }
  };
  useEffect(() => { load(); }, []);

  return (
    <View style={styles.root}>
      <Text style={styles.h1}>Updates</Text>
      {sf && (
        <Pressable onPress={() => setView(true)} style={styles.card}>
          <View style={styles.row}>
            <Avatar name={sf.business.name} size={48} ring={sf.statuses.length > 0} />
            <View style={{ flex: 1 }}>
              <Text style={styles.t}>{sf.business.name}</Text>
              <Text style={styles.micro}>{sf.statuses.length} updates · latest 5h ago</Text>
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
export function ChatsScreen({ onOpenThread }: { onOpenThread: (businessId: string, label: string) => void }) {
  const [biz, setBiz] = useState<{ id: string; name: string } | null>(null);
  useEffect(() => {
    api.storefront('mamas-kitchen')
      .then(sf => setBiz({ id: sf.business.id, name: sf.business.name }))
      .catch(() => setBiz(null));
  }, []);
  if (!biz) return <ActivityIndicator style={{ marginTop: space.s8 }} />;

  return (
    <View style={styles.root}>
      <Text style={styles.h1}>Chats</Text>
      <Pressable onPress={() => onOpenThread(biz.id, `Say hello to ${biz.name}`)} style={styles.card}>
        <View style={styles.row}>
          <Avatar name={biz.name} size={48} />
          <View>
            <Text style={styles.t}>{biz.name}</Text>
            <Text style={styles.micro}>Tap to open demo thread</Text>
          </View>
        </View>
      </Pressable>
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
});
