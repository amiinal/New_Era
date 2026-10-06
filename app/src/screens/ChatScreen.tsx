import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform,
  Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { MoreHorizontal, MoreVertical } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { api, Message } from '../api';
import { useAuth } from '../auth';
import { C, radius, space, type } from '../theme';
import { Avatar } from '../components/Avatar';
import { Palette, useTheme } from '../useTheme';

// Step 6: thread with listing context (CHT-3). Native keyboard via TextInput.
// Long-press (or ⋯) a message for copy/delete; header ⋯ deletes the chat.
export function ChatScreen({ threadId, context, onExit }: { threadId: string; context?: string; onExit?: () => void }) {
  const { account } = useAuth();
  const [msgs, setMsgs] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState('');
  const [peer, setPeer] = useState('');
  const [menuMsg, setMenuMsg] = useState<Message | null>(null);
  const [headMenu, setHeadMenu] = useState(false);
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
  const copy = async (m: Message) => {
    if (m.body) await Clipboard.setStringAsync(m.body);
    setMenuMsg(null);
  };
  const delMsg = async (m: Message) => {
    setMenuMsg(null);
    try {
      await api.deleteMessage(threadId, m.id);
      load();
    } catch {
      Alert.alert('Could not delete', 'Retry.');
    }
  };
  const delChat = () => {
    setHeadMenu(false);
    Alert.alert('Delete conversation?', 'Gone for both sides. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteThread(threadId);
            onExit?.();
          } catch {
            Alert.alert('Could not delete', 'Retry.');
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.head}>
        <Text style={s.peer} numberOfLines={1}>{peer || 'Chat'}</Text>
        <Pressable onPress={() => setHeadMenu(m => !m)} style={s.kebab} hitSlop={8}>
          <MoreVertical size={20} color={p.bodyText} />
        </Pressable>
      </View>
      {headMenu && (
        <View style={s.headMenu}>
          <Text onPress={delChat} style={s.danger}>Delete conversation</Text>
        </View>
      )}
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
                <Pressable onLongPress={() => setMenuMsg(item)} delayLongPress={400}
                  style={[s.bubble, mine ? s.me : s.them]}>
                  <Text style={[s.text, mine && { color: '#fff' }]}>{item.body}</Text>
                </Pressable>
                <Pressable onPress={() => setMenuMsg(item)} style={s.dots} hitSlop={8}>
                  <MoreHorizontal size={16} color={p.bodyText} />
                </Pressable>
              </View>
            );
          }} />
      )}
      <View style={s.box}>
        <TextInput style={s.input} placeholder="Type a message…" placeholderTextColor={p.bodyText} value={draft}
          onChangeText={setDraft} onSubmitEditing={send} returnKeyType="send" />
      </View>
      {menuMsg && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setMenuMsg(null)}>
          <Pressable style={s.scrim} onPress={() => setMenuMsg(null)}>
            <Pressable style={s.menu} onPress={() => {}}>
              {menuMsg.body ? <Text onPress={() => copy(menuMsg)} style={s.menuItem}>Copy text</Text> : null}
              {menuMsg.senderId === account?.id ? (
                <Text onPress={() => delMsg(menuMsg)} style={[s.menuItem, s.dangerItem]}>Delete message</Text>
              ) : null}
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background },
  head: { flexDirection: 'row', alignItems: 'center', backgroundColor: p.surface, paddingHorizontal: space.s4, paddingVertical: space.s3 },
  peer: { ...type.h3, color: p.ink, flex: 1 },
  kebab: { padding: space.s1 },
  headMenu: {
    backgroundColor: p.surface, borderBottomWidth: 1, borderBottomColor: p.line,
    padding: space.s4,
  },
  danger: { ...type.body, color: C.error },
  ctx: { backgroundColor: p.surface, borderBottomWidth: 1, borderBottomColor: p.line, padding: 8 },
  ctxT: { fontSize: 14, color: p.bodyText },
  list: { padding: space.s4 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginBottom: 8 },
  rowMe: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  them: { backgroundColor: p.surface, alignSelf: 'flex-start' },
  me: { backgroundColor: C.primary, alignSelf: 'flex-end' },
  text: { fontSize: 16, color: p.ink },
  dots: { padding: space.s1, alignSelf: 'center' },
  box: { flexDirection: 'row', padding: space.s3, backgroundColor: p.surface, borderTopWidth: 1, borderTopColor: p.line },
  input: {
    flex: 1, height: 48, borderRadius: 8, borderWidth: 1, borderColor: p.lineStrong, color: p.ink,
    paddingHorizontal: space.s4, fontSize: 16, backgroundColor: p.surface,
  },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,.4)', alignItems: 'center', justifyContent: 'center', padding: space.s5 },
  menu: { width: '100%', maxWidth: 320, backgroundColor: p.background, borderRadius: radius.lg, padding: space.s4 },
  menuItem: { ...type.body, color: p.ink, paddingVertical: space.s3 },
  dangerItem: { color: C.error },
});
