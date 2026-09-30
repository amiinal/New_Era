import { Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, Storefront } from '../api';
import { C, space, type } from '../theme';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';

// Updates (Step 7/8 shell): add-story tile first, then one card per
// business with the avatar ring. Matches Docs/storefront-preview.html.
export function UpdatesScreen({
  onMessage, onOpen,
}: {
  onMessage: (businessId: string, label: string) => void;
  onOpen: (slug: string) => void;
}) {
  const [sf, setSf] = useState<Storefront | null>(null);
  useEffect(() => { api.storefront('mamas-kitchen').then(setSf).catch(() => setSf(null)); }, []);

  return (
    <View style={styles.root}>
      <Text style={styles.h1}>Updates</Text>
      <Pressable onPress={() => Alert.alert('Add to story', 'Photo + text composer lands in the next build step.')}
        style={styles.card}>
        <View style={styles.row}>
          <View style={styles.plus}>
            <Plus size={24} color={C.cta} />
          </View>
          <View>
            <Text style={styles.t}>Add to your story</Text>
            <Text style={styles.micro}>Share a photo or text update</Text>
          </View>
        </View>
      </Pressable>
      {sf && (
        <Pressable onPress={() => onOpen('mamas-kitchen')} style={styles.card}>
          <View style={styles.row}>
            <Avatar name={sf.business.name} size={48} ring />
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

  return (
    <View style={styles.root}>
      <Text style={styles.h1}>Chats</Text>
      {biz && (
        <Pressable onPress={() => onOpenThread(biz.id, `Say hello to ${biz.name}`)} style={styles.card}>
          <View style={styles.row}>
            <Avatar name={biz.name} size={48} />
            <View>
              <Text style={styles.t}>{biz.name}</Text>
              <Text style={styles.micro}>Tap to open demo thread</Text>
            </View>
          </View>
        </Pressable>
      )}
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
});
