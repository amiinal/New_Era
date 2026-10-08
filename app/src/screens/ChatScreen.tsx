import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform,
  Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { MoreHorizontal, MoreVertical, Plus, Send } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { api, Business, img, Message, Peer } from '../api';
import { useAuth } from '../auth';
import { getFlag, setFlag } from '../store';
import { C, radius, shadow, space, type } from '../theme';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { CautionSheet } from '../components/CautionSheet';
import { Palette, useTheme } from '../useTheme';
import { PeerSheet } from '../components/PeerSheet';

// Step 6: thread with listing context (CHT-3). Native keyboard via TextInput.
// Long-press (or ⋯) a message for copy/delete; header ⋯ deletes the chat.
// Avatars are live: business opens the storefront, customer opens their card.
const fmtTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};
export function ChatScreen({ threadId, context, onExit, onOpenStore, onBack }: {
  threadId: string; context?: string; onExit?: () => void; onOpenStore?: (slug: string) => void; onBack?: () => void;
}) {
  const { account, mode } = useAuth();
  const [msgs, setMsgs] = useState<Message[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState('');
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerCard, setPeerCard] = useState(false);
  const [menuMsg, setMenuMsg] = useState<Message | null>(null);
  const [headMenu, setHeadMenu] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [caution, setCaution] = useState<{ biz: Business; cross: boolean } | null>(null);
  const { p } = useTheme();
  const s = themed(p);

  const load = async () => {
    try {
      const [m, t] = await Promise.all([api.messages(threadId), api.thread(threadId)]);
      setMsgs(m);
      setPeer(t.peer);
      setFailed(false);
      // TRU-6: once a reply lands, ask privately — once per thread.
      // Feeds ranking signals, never public stars.
      if (t.peer.kind === 'business' && m.some(x => x.senderId !== account?.id)) {
        getFlag(`nudge:${threadId}`).then(v => { if (!v) setNudge(true); });
      }
      // TRU-7: first chat across a border, or a remote service — warn once.
      if (t.peer.kind === 'business' && mode === 'customer' && account) {
        const b = await api.business(t.thread.businessId).catch(() => null);
        if (b) {
          const cross = b.country !== account.country;
          const remote = /nation/i.test(b.deliveryArea || '');
          if ((cross || remote) && !await getFlag(`caution:${b.id}`)) {
            setCaution({ biz: b, cross });
          }
        }
      }
    } catch { setMsgs([]); setFailed(true); }
  };
  const ackCaution = async () => {
    if (caution) await setFlag(`caution:${caution.biz.id}`, '1');
    setCaution(null);
  };
  const answer = async (yes: boolean) => {
    setNudge(false);
    await setFlag(`nudge:${threadId}`, '1');
    api.recordEvent('nudge_reply', { threadId, answer: yes ? 'yes' : 'no' }).catch(() => {});
  };
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [threadId]);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    await api.sendMessage(threadId, { body });
    load();
  };
  const attach = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
    if (r.canceled || !r.assets[0]) return;
    try {
      const key = await api.uploadPhoto(r.assets[0].uri, `chat/${threadId}/${Date.now()}.jpg`);
      await api.sendMessage(threadId, { imageKey: key });
      load();
    } catch {
      Alert.alert('Could not send photo', 'Check your connection, then retry.');
    }
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

  const openPeer = () => {
    if (!peer) return;
    if (peer.kind === 'business') onOpenStore?.(peer.slug);
    else setPeerCard(true);
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.head}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={8} style={s.backBtn}>
            <Text style={s.backT}>‹</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={openPeer} hitSlop={8}>
          <Avatar name={peer?.name || '?'} size={44} online={peer?.online} />
        </Pressable>
        <Pressable onPress={openPeer} style={{ flex: 1 }} hitSlop={8}>
          <Text style={s.peer} numberOfLines={1}>{peer?.name || 'Chat'}</Text>
          <Text style={s.presence}>{peer ? (peer.online ? 'Online now' : 'Offline') : ''}</Text>
        </Pressable>
        <View style={s.kebabWrap}>
          <Pressable onPress={() => setHeadMenu(m => !m)} style={s.kebab} hitSlop={8}>
            <MoreVertical size={20} color={p.bodyText} />
          </Pressable>
          {headMenu && (
            <View style={s.headPop}>
              <Text onPress={delChat} style={s.danger}>Delete conversation</Text>
            </View>
          )}
        </View>
      </View>
      {!!context && (
        <View style={s.ctx}><Text style={s.ctxT} numberOfLines={1}>{context}</Text></View>
      )}
      {msgs === null ? <ActivityIndicator style={{ marginTop: space.s8 }} /> : failed ? (
        <View style={s.errBox}>
          <Text style={[s.text, { textAlign: 'center' }]}>Couldn&apos;t load messages.</Text>
          <View style={{ marginTop: space.s3, alignSelf: 'stretch' }}>
            <Button title="Retry" variant="secondary" onPress={load} />
          </View>
        </View>
      ) : msgs.length === 0 ? (
        <Text style={[s.text, { textAlign: 'center', marginTop: space.s8 }]}>No messages yet — say hello.</Text>
      ) : (
        <FlatList data={msgs} keyExtractor={m => m.id} contentContainerStyle={s.list}
          renderItem={({ item }) => {
            const mine = item.senderId === account?.id;
            const open = menuMsg?.id === item.id;
            const toggle = () => setMenuMsg(open ? null : item);
            return (
              <View style={[s.row, mine && s.rowMe]}>
                {!mine && (
                  <Pressable onPress={openPeer} hitSlop={8}>
                    <Avatar name={peer?.name || '?'} size={40} online={peer?.online} />
                  </Pressable>
                )}
                <View style={[s.col, mine && s.colMe]}>
                  <View style={s.bubbleRow}>
                    <Pressable onPress={toggle} onLongPress={() => setMenuMsg(item)} delayLongPress={400}
                      style={[s.bubble, mine ? s.me : s.them]}>
                      {!!item.imageKey && (
                        <Image source={{ uri: img(item.imageKey) }} style={s.msgImg} />
                      )}
                      {!!item.body && (
                        <Text style={[s.text, mine && { color: '#fff' }]}>{item.body}</Text>
                      )}
                    </Pressable>
                    <Pressable onPress={toggle} style={s.dots} hitSlop={8}>
                      <MoreHorizontal size={16} color={p.bodyText} />
                    </Pressable>
                  </View>
                  {open && (
                    <View style={s.pop}>
                      {item.body ? <Text onPress={() => copy(item)} style={s.popItem}>Copy text</Text> : null}
                      {mine ? (
                        <Text onPress={() => delMsg(item)} style={[s.popItem, s.dangerItem]}>Delete message</Text>
                      ) : null}
                    </View>
                  )}
                  <Text style={s.stamp}>{fmtTime(item.createdAt)}</Text>
                </View>
              </View>
            );
          }} />
      )}
      <View style={s.box}>
        <Pressable onPress={attach} style={s.plusBtn} hitSlop={8}>
          <Plus size={22} color={p.primary} />
        </Pressable>
        <TextInput style={s.input} placeholder="Type a message…" placeholderTextColor={p.bodyText} value={draft}
          onChangeText={setDraft} onSubmitEditing={send} returnKeyType="send" />
        <Pressable onPress={send} style={({ pressed }) => [s.sendBtn, pressed && s.pressed]} hitSlop={8}>
          <Send size={20} color="#fff" />
        </Pressable>
      </View>
      {nudge && (
        <View style={s.nudge}>
          <Text style={s.nudgeT}>Did you get a reply?</Text>
          <View style={s.nudgeRow}>
            <Text onPress={() => answer(true)} style={s.nudgeYes}>Yes</Text>
            <Text onPress={() => answer(false)} style={s.nudgeNo}>Not yet</Text>
          </View>
        </View>
      )}
      {peer?.kind === 'customer' && peerCard && (
        <PeerSheet peer={peer} onClose={() => setPeerCard(false)} />
      )}
      {caution && (
        <CautionSheet business={caution.biz} crossBorder={caution.cross}
          onAck={ackCaution} onBack={() => { setCaution(null); onExit?.(); }} />
      )}
    </KeyboardAvoidingView>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.chatBg },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.s2, backgroundColor: p.surface, paddingHorizontal: space.s3, paddingVertical: space.s3 },
  backBtn: { padding: space.s1 },
  backT: { fontSize: 26, color: p.primary, fontWeight: '600', lineHeight: 28 },
  peer: { ...type.h3, color: p.ink, flex: 1 },
  presence: { ...type.micro, color: p.bodyText },
  kebab: { padding: space.s1 },
  kebabWrap: { position: 'relative', zIndex: 20, elevation: 20 },
  headPop: {
    position: 'absolute', top: 32, right: 0, backgroundColor: p.surface,
    borderRadius: radius.md, paddingHorizontal: space.s4, paddingVertical: space.s3,
    minWidth: 180, zIndex: 10, ...shadow.md,
  },
  danger: { ...type.body, color: C.error },
  ctx: { backgroundColor: p.surface, borderBottomWidth: 1, borderBottomColor: p.line, padding: 8 },
  ctxT: { fontSize: 14, color: p.bodyText },
  list: { padding: space.s4 },
  errBox: { padding: space.s5, alignItems: 'center' },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginBottom: 8 },
  rowMe: { justifyContent: 'flex-end' },
  col: { maxWidth: '85%' },
  colMe: { alignItems: 'flex-end' },
  bubbleRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  pop: {
    marginTop: 4, minWidth: 160, backgroundColor: p.surface, borderRadius: radius.md,
    paddingHorizontal: space.s4, paddingVertical: space.s2, ...shadow.md,
  },
  popItem: { ...type.body, color: p.ink, paddingVertical: space.s2 },
  stamp: { fontSize: 11, color: p.bodyText, marginTop: 2 },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16, ...shadow.sm },
  msgImg: { width: 200, height: 150, borderRadius: 8, marginBottom: 4 },
  them: { backgroundColor: p.surface, alignSelf: 'flex-start' },
  me: { backgroundColor: C.primary, alignSelf: 'flex-end' },
  text: { fontSize: 16, color: p.ink },
  dots: { padding: space.s1, alignSelf: 'center' },
  box: { flexDirection: 'row', gap: space.s2, alignItems: 'center', padding: space.s3, backgroundColor: p.surface, borderTopWidth: 1, borderTopColor: p.line },
  plusBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: p.background,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: C.cta,
    alignItems: 'center', justifyContent: 'center', ...shadow.cta,
  },
  pressed: { opacity: 0.85 },
  nudge: {
    backgroundColor: p.surface, borderTopWidth: 1, borderTopColor: p.line,
    padding: space.s3, alignItems: 'center',
  },
  nudgeT: { ...type.bodySm, color: p.ink, fontWeight: '600' },
  nudgeRow: { flexDirection: 'row', gap: space.s5, marginTop: space.s2 },
  nudgeYes: { ...type.body, color: C.success, fontWeight: '600' },
  nudgeNo: { ...type.body, color: p.bodyText },
  input: {
    flex: 1, height: 48, borderRadius: 8, borderWidth: 1, borderColor: p.lineStrong, color: p.ink,
    paddingHorizontal: space.s4, fontSize: 16, backgroundColor: p.surface,
  },
  dangerItem: { color: C.error },
});
