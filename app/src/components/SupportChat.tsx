import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, SupportMsg } from '../api';
import { C, radius, space, type } from '../theme';
import { Button } from './Button';
import { Palette, useTheme } from '../useTheme';

// In-app support chat: message the team, read replies here.
// Same thread as the web Support page (HLP-2, self-serve first).
export function SupportChat({ onClose }: { onClose: () => void }) {
  const [msgs, setMsgs] = useState<SupportMsg[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState('');
  const { p } = useTheme();
  const s = themed(p);

  const load = async () => {
    try { setMsgs(await api.supportMine()); setFailed(false); } catch { setMsgs([]); setFailed(true); }
  };
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, []);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    try {
      await api.sendSupport(body);
      load();
    } catch {
      Alert.alert('Could not send', 'Check the API is running, then retry.');
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={s.root}>
        <Text style={s.h1}>Customer support</Text>
        <Text style={s.micro}>Mon–Fri, 9:00–17:00 WAT · replies within one business day.</Text>
        <ScrollView style={s.thread} contentContainerStyle={s.list}>
          {msgs === null ? <ActivityIndicator style={{ marginTop: space.s5 }} />
            : failed ? (
              <View style={{ alignItems: 'center', marginTop: space.s5 }}>
                <Text style={[s.micro, { textAlign: 'center' }]}>Couldn&apos;t load messages.</Text>
                <View style={{ marginTop: space.s3, alignSelf: 'stretch' }}>
                  <Button title="Retry" variant="secondary" onPress={load} />
                </View>
              </View>
            ) : msgs.length === 0 ? (
              <Text style={[s.micro, { textAlign: 'center', marginTop: space.s5 }]}>
                No messages yet — tell us what you need help with.
              </Text>
            ) : msgs.map(m => (
              <View key={m.id} style={[s.row, !m.fromAdmin && s.rowMe]}>
                <View style={[s.bubble, m.fromAdmin ? s.them : s.me]}>
                  <Text style={[s.text, !m.fromAdmin && { color: '#fff' }]}>{m.body}</Text>
                </View>
              </View>
            ))}
        </ScrollView>
        <View style={s.box}>
          <TextInput style={s.input} placeholder="What do you need help with?" placeholderTextColor={p.bodyText}
            value={draft} onChangeText={setDraft} onSubmitEditing={send} returnKeyType="send" />
          <View style={s.send}><Button title="Send" onPress={send} /></View>
        </View>
        <Button title="Close" variant="tertiary" onPress={onClose} />
      </View>
    </Modal>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background, padding: space.s5 },
  h1: { ...type.h1, color: p.ink, textAlign: 'center' },
  micro: { ...type.micro, color: p.bodyText, textAlign: 'center', marginTop: space.s2 },
  thread: { flex: 1, marginTop: space.s4 },
  list: { paddingBottom: space.s3 },
  row: { flexDirection: 'row', marginBottom: space.s2 },
  rowMe: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', padding: space.s3, borderRadius: radius.lg },
  them: { backgroundColor: p.surface, alignSelf: 'flex-start' },
  me: { backgroundColor: C.primary, alignSelf: 'flex-end' },
  text: { fontSize: 15, color: p.ink },
  box: { flexDirection: 'row', gap: space.s2, marginTop: space.s3, marginBottom: space.s3 },
  input: {
    flex: 1, height: 48, borderRadius: radius.md, borderWidth: 1,
    borderColor: p.lineStrong, color: p.ink, backgroundColor: p.surface,
    paddingHorizontal: space.s4, fontSize: 16,
  },
  send: { justifyContent: 'center', minWidth: 96 },
});
