import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, Business, img } from '../api';
import { radius, space, type } from '../theme';
import { Button } from './Button';
import { Palette, useTheme } from '../useTheme';

const words = (t: string) => t.split(/\s+/).filter(Boolean).length;

// Business profile edit: logo + cover header + 250-word bio.
export function BizProfile({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [biz, setBiz] = useState<Business | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [busy, setBusy] = useState(false);
  const { p } = useTheme();
  const s = themed(p);

  useEffect(() => {
    api.myBusinesses().then(list => {
      if (list[0]) { setBiz(list[0]); setBio(list[0].bio ?? ''); }
    }).catch(() => {});
  }, []);

  const pick = (set: (u: string) => void) => async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!r.canceled && r.assets[0]) set(r.assets[0].uri);
  };
  const upload = (localUri: string, key: string) => api.uploadPhoto(localUri, key);
  const save = async () => {
    if (!biz || busy) return;
    if (words(bio) > 250) { Alert.alert('Bio too long', 'Keep it to 250 words or fewer.'); return; }
    setBusy(true);
    try {
      const patch: { logoKey?: string; coverKey?: string; bio?: string } = { bio: bio.trim() };
      if (logo) patch.logoKey = await upload(logo, `business/${biz.id}/logo-${Date.now()}.jpg`);
      if (cover) patch.coverKey = await upload(cover, `business/${biz.id}/cover-${Date.now()}.jpg`);
      await api.patchBusiness(biz.id, patch);
      onSaved();
    } catch (e) {
      Alert.alert('Could not save', String((e as Error).message || 'Check connection.'));
    } finally { setBusy(false); }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.root}>
      <ScrollView style={s.card}>
        <Text style={s.h1}>Business profile</Text>
      <Text style={s.sec}>Logo</Text>
      <PickBox uri={logo} shown={biz?.logoKey} onPick={pick(setLogo)} />
      <Text style={s.sec}>Header background</Text>
      <PickBox uri={cover} shown={biz?.coverKey} wide onPick={pick(setCover)} />
        <Text style={s.sec}>Bio</Text>
        <TextInput style={[s.input, { minHeight: 96, textAlignVertical: 'top' }]} multiline
          placeholder="Tell customers who you are (max 250 words)…" placeholderTextColor={p.bodyText}
          value={bio} onChangeText={setBio} maxLength={1600} />
        <Text style={s.micro}>{words(bio)}/250 words</Text>
        <View style={{ height: space.s4 }} />
        <Button title={busy ? 'Saving…' : 'Save'} onPress={save} disabled={busy} />
        <View style={{ height: space.s3 }} />
        <Button title="Close" variant="secondary" onPress={onClose} />
      </ScrollView>
      </View>
    </Modal>
  );
}

function PickBox({ uri, shown, wide, onPick }: {
  uri: string | null; shown?: string | null; wide?: boolean; onPick: () => void;
}) {
  const { p } = useTheme();
  const box = wide
    ? { width: '100%' as const, height: 140, borderRadius: 12 }
    : { width: 96, height: 96, borderRadius: 48 };
  const src = uri ?? (shown ? img(shown) : null);
  return (
    <Pressable onPress={onPick} style={[box, { backgroundColor: p.line, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }]}>
      {src
        ? <Image source={{ uri: src }} style={{ width: '100%', height: '100%' }} />
        : <Text style={{ color: p.bodyText }}>Tap to choose</Text>}
    </Pressable>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(0,0,0,.4)', alignItems: 'center', justifyContent: 'center', padding: space.s4 },
  card: {
    width: '100%', maxWidth: 480, maxHeight: '92%', backgroundColor: p.background,
    borderRadius: radius.lg, padding: space.s5,
  },
  h1: { ...type.h1, color: p.ink, marginBottom: space.s4 },
  micro: { ...type.micro, color: p.bodyText },
  sec: { ...type.h3, color: p.ink, marginBottom: space.s2, marginTop: space.s3 },
  input: {
    backgroundColor: p.surface, borderWidth: 1, borderColor: p.lineStrong, color: p.ink,
    borderRadius: radius.md, padding: space.s4, fontSize: 16,
  },
});
