import * as ImagePicker from 'expo-image-picker';
import { Check } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, img } from '../api';
import { useAuth } from '../auth';
import { radius, shadow, space, type } from '../theme';
import { Button } from './Button';
import { Palette, useTheme } from '../useTheme';
import { Help, Settings } from '../screens/Settings';

// Customer profile: photo + short tagline, private to the account.
// No public counts, no followers — identity only.
export function ProfileSheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { account, refresh } = useAuth();
  const [uri, setUri] = useState<string | null>(null);
  const [name, setName] = useState(account?.displayName ?? '');
  const [tagline, setTagline] = useState(account?.tagline ?? '');
  const [showEmail, setShowEmail] = useState(!!account?.showEmail);
  const [showPhone, setShowPhone] = useState(!!account?.showPhone);
  const [contactPhone, setContactPhone] = useState(account?.contactPhone ?? '');
  const [showContactPhone, setShowContactPhone] = useState(!!account?.showContactPhone);
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
      await api.saveProfile({
        ...(avatarKey ? { avatarKey } : {}),
        tagline: tagline.trim(),
        displayName: name.trim() || null,
        showEmail,
        showPhone,
        contactPhone: contactPhone.trim() || null,
        showContactPhone,
      });
      await refresh();
      onSaved();
    } catch (e) {
      Alert.alert('Could not save', String((e as Error).message || 'Check connection.'));
    } finally { setBusy(false); }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.root}>
      <ScrollView style={s.card} contentContainerStyle={s.cardInner}>
        <Text style={s.h1}>Your profile</Text>
        {shown
          ? <Image source={{ uri: shown }} style={s.av} />
          : <View style={[s.av, s.empty]} />}
        <View style={{ height: space.s3 }} />
        <Button title="Choose photo" variant="secondary" onPress={pick} />
        <TextInput style={[s.input, { marginTop: space.s3 }]} placeholder="Your name (shown to businesses)" placeholderTextColor={p.bodyText}
          value={name} onChangeText={setName} maxLength={40} />
        <TextInput style={[s.input, { marginTop: space.s3, marginBottom: space.s2 }]} placeholder="Short tagline (e.g. Cake lover in Ikeja)" placeholderTextColor={p.bodyText}
          value={tagline} onChangeText={setTagline} maxLength={120} />
        <TextInput style={[s.input, { marginTop: space.s3, marginBottom: space.s2 }]} placeholder="Contact phone (optional, not verified)" placeholderTextColor={p.bodyText}
          value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" maxLength={20} />
        {!!contactPhone.trim() && (
          <Pressable onPress={() => setShowContactPhone(!showContactPhone)} style={[s.check, { marginBottom: space.s2 }]}>
            <View style={s.box}>{showContactPhone ? <Check size={16} color={p.primary} /> : null}</View>
            <Text style={s.checkT}>Show contact phone to businesses</Text>
          </Pressable>
        )}
        <Text style={s.micro}>Businesses you chat with can see:</Text>
        {([
          ['email', account?.email, showEmail, setShowEmail],
          ['phone', account?.phone, showPhone, setShowPhone],
        ] as const).map(([kind, value, on, set]) => (
          value ? (
            <Pressable key={kind} onPress={() => set(!on)} style={s.check}>
              <View style={s.box}>{on ? <Check size={16} color={p.primary} /> : null}</View>
              <Text style={s.checkT}>Show my {kind} ({value})</Text>
            </Pressable>
          ) : null
        ))}
        <Button title={busy ? 'Saving…' : 'Save'} onPress={save} disabled={busy} />
        <View style={{ height: space.s3 }} />
        <Button title="Settings" variant="secondary" onPress={() => setSettings(true)} />
        <View style={{ height: space.s3 }} />
        <Button title="Close" variant="secondary" onPress={onClose} />
      </ScrollView>
      </View>
      {settings && <Settings onClose={() => setSettings(false)} onHelp={() => setHelp(true)} />}
      {help && <Help onClose={() => setHelp(false)} />}
    </Modal>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(0,0,0,.4)', alignItems: 'center', justifyContent: 'center', padding: space.s4 },
  card: {
    width: '100%', maxWidth: 480, backgroundColor: p.background, borderRadius: radius.lg, ...shadow.lg,
  },
  cardInner: {
    padding: space.s5, alignItems: 'center', flexGrow: 1,
  },
  h1: { ...type.h1, color: p.ink, marginBottom: space.s4 },
  av: { width: 96, height: 96, borderRadius: 48 },
  header: { width: '100%', height: 110, borderRadius: 12, marginBottom: space.s2 },
  empty: { backgroundColor: p.line },
  input: {
    width: '100%', backgroundColor: p.surface, borderWidth: 1, borderColor: p.lineStrong, color: p.ink,
    borderRadius: radius.md, height: 48, paddingHorizontal: space.s4, fontSize: 16,
  },
  micro: { ...type.micro, color: p.bodyText, marginTop: space.s3, alignSelf: 'flex-start' },
  check: { flexDirection: 'row', alignItems: 'center', gap: space.s2, marginTop: space.s2, alignSelf: 'flex-start' },
  box: {
    width: 24, height: 24, borderRadius: 4, borderWidth: 1, borderColor: p.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  checkT: { ...type.body, color: p.ink },
});
