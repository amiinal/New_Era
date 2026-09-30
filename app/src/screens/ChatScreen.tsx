import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { api, Message } from '../api';
import { useAuth } from '../auth';
import { C, space, type } from '../theme';

// Step 6: thread with listing context (CHT-3). Native keyboard via TextInput.
export function ChatScreen({ threadId, context }: { threadId: string; context?: string }) {
  const { account } = useAuth();
  const [msgs, setMsgs] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState('');

  const load = async () => {
    try { setMsgs(await api.messages(threadId)); } catch { setMsgs([]); }
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
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {!!context && (
        <View style={styles.ctx}><Text style={styles.ctxT} numberOfLines={1}>{context}</Text></View>
      )}
      {msgs === null ? <ActivityIndicator style={{ marginTop: space.s8 }} /> : (
        <FlatList data={msgs} keyExtractor={m => m.id} contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.senderId === account?.id ? styles.me : styles.them]}>
              <Text style={[styles.text, item.senderId === account?.id && { color: '#fff' }]}>
                {item.body}
              </Text>
            </View>
          )} />
      )}
      <View style={styles.box}>
        <TextInput style={styles.input} placeholder="Type a message…" value={draft}
          onChangeText={setDraft} onSubmitEditing={send} returnKeyType="send" />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  ctx: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line, padding: 8 },
  ctxT: { fontSize: 14, color: C.bodyText },
  list: { padding: space.s4 },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16, marginBottom: 8 },
  them: { backgroundColor: C.surface, alignSelf: 'flex-start' },
  me: { backgroundColor: C.primary, alignSelf: 'flex-end' },
  text: { fontSize: 16, color: C.ink },
  box: { flexDirection: 'row', padding: space.s3, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.line },
  input: {
    flex: 1, height: 48, borderRadius: 8, borderWidth: 1, borderColor: C.lineStrong,
    paddingHorizontal: space.s4, fontSize: 16, backgroundColor: C.surface,
  },
});
