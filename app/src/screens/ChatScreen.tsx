import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { api, Message } from '../api';
import { useAuth } from '../auth';
import { C, space, type } from '../theme';
import { Avatar } from '../components/Avatar';
import { Palette, useTheme } from '../useTheme';

// Step 6: thread with listing context (CHT-3). Native keyboard via TextInput.
export function ChatScreen({ threadId, context }: { threadId: string; context?: string }) {
  const { account } = useAuth();
  const [msgs, setMsgs] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState('');
  const [peer, setPeer] = useState('');
  const { p } = useTheme();
  const s = themed(p);

  const load = async () => {
    try {
      const [m, t] = await Promise.all([api.messages(threadId), api.thread(threadId)]);
      setMsgs(m);
      setPeer(t.peer.name);
    } catch { setMsgs([]); }
  };
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [threadId]);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    await api.sendMessage(threadId, { body });
    load();
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {!!context && (
        <View style={s.ctx}><Text style={s.ctxT} numberOfLines={1}>{context}</Text></View>
      )}
      {msgs === null ? <ActivityIndicator style={{ marginTop: space.s8 }} /> : msgs.length === 0 ? (
        <Text style={[s.text, { textAlign: 'center', marginTop: space.s8 }]}>No messages yet — say hello.</Text>
      ) : (
        <FlatList data={msgs} keyExtractor={m => m.id} contentContainerStyle={s.list}
          renderItem={({ item }) => {
            const mine = item.senderId === account?.id;
            return (
              <View style={[s.row, mine && s.rowMe]}>
                {!mine && <Avatar name={peer || '?'} size={32} />}
                <View style={[s.bubble, mine ? s.me : s.them]}>
                  <Text style={[s.text, mine && { color: '#fff' }]}>{item.body}</Text>
                </View>
              </View>
            );
          }} />
      )}
      <View style={s.box}>
        <TextInput style={s.input} placeholder="Type a message…" placeholderTextColor={p.bodyText} value={draft}
          onChangeText={setDraft} onSubmitEditing={send} returnKeyType="send" />
      </View>
    </KeyboardAvoidingView>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background },
  ctx: { backgroundColor: p.surface, borderBottomWidth: 1, borderBottomColor: p.line, padding: 8 },
  ctxT: { fontSize: 14, color: p.bodyText },
  list: { padding: space.s4 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginBottom: 8 },
  rowMe: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  them: { backgroundColor: p.surface, alignSelf: 'flex-start' },
  me: { backgroundColor: C.primary, alignSelf: 'flex-end' },
  text: { fontSize: 16, color: p.ink },
  box: { flexDirection: 'row', padding: space.s3, backgroundColor: p.surface, borderTopWidth: 1, borderTopColor: p.line },
  input: {
    flex: 1, height: 48, borderRadius: 8, borderWidth: 1, borderColor: p.lineStrong, color: p.ink,
    paddingHorizontal: space.s4, fontSize: 16, backgroundColor: p.surface,
  },
});
