import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, img } from '../api';
import { useAuth } from '../auth';
import { radius, space, type } from '../theme';
import { Button } from './Button';
import { Palette, useTheme } from '../useTheme';
import { Help, Settings } from '../screens/Settings';

// Customer profile: photo + short tagline, private to the account.
// No public counts, no followers — identity only.
export function ProfileSheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { account, refresh } = useAuth();
  const [uri, setUri] = useState<string | null>(null);
  const [tagline, setTagline] = useState(account?.tagline ?? '');
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState(false);
  const [help, setHelp] = useState(false);
  const { p } = useTheme();
  const s = themed(p);
  const shown = uri ?? (account?.avatarKey ? img(account.avatarKey) : null);

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!r.canceled && r.assets[0]) setUri(r.assets[0].uri);
  };
  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      let avatarKey: string | undefined;
      if (uri) avatarKey = await api.uploadPhoto(uri, `account/${account?.id}/avatar-${Date.now()}.jpg`);
      await api.saveProfile({ ...(avatarKey ? { avatarKey } : {}), tagline: tagline.trim() });
      await refresh();
      onSaved();
    } catch (e) {
      Alert.alert('Could not save', String((e as Error).message || 'Check connection.'));
    } finally { setBusy(false); }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={s.root}>
        <Text style={s.h1}>Your profile</Text>
        {shown
          ? <Image source={{ uri: shown }} style={s.av} />
          : <View style={[s.av, s.empty]} />}
        <View style={{ height: space.s3 }} />
        <Button title="Choose photo" variant="secondary" onPress={pick} />
        <TextInput style={[s.input, { marginTop: space.s3 }]} placeholder="Short tagline (e.g. Cake lover in Ikeja)" placeholderTextColor={p.bodyText}
          value={tagline} onChangeText={setTagline} maxLength={120} />
        <Button title={busy ? 'Saving…' : 'Save'} onPress={save} disabled={busy} />
        <View style={{ height: space.s3 }} />
        <Button title="Settings" variant="secondary" onPress={() => setSettings(true)} />
        <View style={{ height: space.s3 }} />
        <Button title="Close" variant="secondary" onPress={onClose} />
      </View>
      {settings && <Settings onClose={() => setSettings(false)} onHelp={() => setHelp(true)} />}
      {help && <Help onClose={() => setHelp(false)} />}
    </Modal>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background, padding: space.s5, alignItems: 'center' },
  h1: { ...type.h1, color: p.ink, marginBottom: space.s4 },
  av: { width: 96, height: 96, borderRadius: 48 },
  empty: { backgroundColor: p.line },
  input: {
    width: '100%', backgroundColor: p.surface, borderWidth: 1, borderColor: p.lineStrong, color: p.ink,
    borderRadius: radius.md, height: 48, paddingHorizontal: space.s4, fontSize: 16,
  },
});
