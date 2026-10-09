import { Check, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import QRCode from 'react-native-qrcode-svg';
import { Share } from 'react-native';
import { api, SITE_URL } from '../api';
import { useAuth } from '../auth';
import { C, radius, space, type } from '../theme';
import { Button } from '../components/Button';
import { ListingForm } from '../components/ListingForm';
import { Palette, useTheme } from '../useTheme';

const CATEGORIES = [
  'Food service', 'Bakery', 'Salon', 'Barbershop', 'Tailor', 'Fashion',
  'Beauty', 'Catering', 'Electronics', 'Home goods', 'Photography',
  'Graphic Design', 'Other',
];

// ONB-1..11: interactive wizard — every step is a real action.
// Basics → first listing → certificates (optional) → you're live.
// Exitable before the end (progress so far is kept); onAddMore routes
// straight into listings management from the live screen.
export function Onboarding({ onDone, onAddMore }: { onDone: () => void; onAddMore?: () => void }) {
  const { account } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Food service');
  const [customCategory, setCustomCategory] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [nationwide, setNationwide] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [biz, setBiz] = useState<{ id: string; slug: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const { p } = useTheme();
  const s = themed(p);
  const link = p.primary;

  const pickInto = (set: (u: string) => void) => async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!r.canceled && r.assets[0]) set(r.assets[0].uri);
  };
  const pickLogo = pickInto(setLogo);
  const pickCover = pickInto(setCover);

  // Leaving early keeps whatever is already created — resume anytime
  // from Business home.
  const exit = () => {
    Alert.alert('Leave setup?', 'Your progress so far is kept.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Exit', onPress: onDone },
    ]);
  };

  const create = async () => {
    if (!name.trim() || !city.trim()) {
      Alert.alert('Missing details', 'Business name and city are required.');
      return;
    }
    setBusy(true);
    try {
      let logoKey: string | undefined;
      if (logo) logoKey = await api.uploadPhoto(logo, `business/tmp/logo-${Date.now()}.jpg`);
      let coverKey: string | undefined;
      if (cover) coverKey = await api.uploadPhoto(cover, `business/tmp/cover-${Date.now()}.jpg`);
      const b = await api.createBusiness({
        name: name.trim(),
        category: category === 'Other' ? (customCategory.trim() || 'Other') : category,
        country: account?.country ?? 'NG', city: city.trim(),
        area: area.trim() || undefined,
        deliveryArea: nationwide ? undefined : area.trim() || undefined,
        nationwide, logoKey, coverKey,
      });
      setBiz({ id: b.id, slug: b.slug });
      setStep(1);
    } catch (e) {
      Alert.alert('Could not create', String((e as Error).message || 'Check connection.'));
    } finally { setBusy(false); }
  };

  return (
    <Modal visible animationType="slide">
      <ScrollView style={s.root}>
        <View style={s.topRow}>
          <View style={[s.prog, { flex: 1 }]}>
            {[0, 1, 2, 3].map(j => (
              <View key={j} style={[s.seg, j <= step && s.segOn]} />
            ))}
          </View>
          {step < 3 ? (
            <Pressable onPress={exit} style={s.exit} hitSlop={8}>
              <X size={20} color={p.bodyText} />
            </Pressable>
          ) : null}
        </View>
        <Text style={s.micro}>Step {step + 1} of 4 · {
          ['Business details', 'First listing', 'Certificates (optional)', "You're live"][step]
        }</Text>
        {step === 0 && (
          <>
            <Text style={s.h1}>Your business</Text>
            <TextInput style={s.input} placeholder="Business name (required)" placeholderTextColor={p.bodyText} value={name} onChangeText={setName} />
            <Text style={s.sec}>Category</Text>
            <View style={s.wrap}>
              {CATEGORIES.map(c => (
                <Text key={c} onPress={() => setCategory(c)} style={[s.opt, category === c && s.optOn]}>{c}</Text>
              ))}
            </View>
            {category === 'Other' ? (
              <TextInput style={s.input} placeholder="Type your category" placeholderTextColor={p.bodyText}
                value={customCategory} onChangeText={setCustomCategory} maxLength={40} />
            ) : null}
            <TextInput style={s.input} placeholder="City (required)" placeholderTextColor={p.bodyText} value={city} onChangeText={setCity} />
            <TextInput style={s.input} placeholder="Area / neighborhood" placeholderTextColor={p.bodyText} value={area} onChangeText={setArea} />
            <Pressable onPress={() => setNationwide(!nationwide)} style={s.check}>
              <View style={s.box}>{nationwide ? <Check size={16} color={link} /> : null}</View>
              <Text style={s.checkT}>Serve nationwide (online / delivery)</Text>
            </Pressable>
            <Pressable onPress={pickLogo} style={s.logoRow}>
              {logo
                ? <Image source={{ uri: logo }} style={s.logo} />
                : <View style={[s.logo, s.logoEmpty]}><Text style={s.micro}>Logo (optional)</Text></View>}
            </Pressable>
            <Pressable onPress={pickCover} style={s.logoRow}>
              {cover
                ? <Image source={{ uri: cover }} style={[s.logo, { width: 192, borderRadius: 12 }]} />
                : <View style={[s.logo, s.logoEmpty, { width: 192, borderRadius: 12 }]}><Text style={s.micro}>Header image (optional)</Text></View>}
            </Pressable>
            <Button title={busy ? 'Creating…' : 'Continue'} onPress={create} disabled={busy} />
          </>
        )}
        {step === 1 && biz && (
          <ListingForm businessId={biz.id} onClose={() => setStep(2)}
            onSaved={() => setStep(2)} />
        )}
        {step === 2 && biz && (
          <CertStep businessId={biz.id} onDone={() => setStep(3)} />
        )}
        {step === 3 && biz && <LiveStep slug={biz.slug} onDone={onDone} onAddMore={onAddMore} />}
      </ScrollView>
    </Modal>
  );
}

function CertStep({ businessId, onDone }: { businessId: string; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { p } = useTheme();
  const s = themed(p);
  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!r.canceled && r.assets[0]) setPhoto(r.assets[0].uri);
  };
  const save = async () => {
    if (!title.trim() || !photo) { onDone(); return; }
    setBusy(true);
    try {
      const key = await api.uploadPhoto(photo, `business/${businessId}/cert/${Date.now()}.jpg`);
      await api.addCertificate(businessId, { title: title.trim(), photo: key });
      onDone();
    } catch (e) {
      Alert.alert('Could not save', String((e as Error).message || 'Check connection.'));
    } finally { setBusy(false); }
  };
  return (
    <>
      <Text style={s.h1}>Certificates (optional)</Text>
      <Text style={s.micro}>Self-reported — shown with a “not verified” label until Phase 2 review.</Text>
      <TextInput style={[s.input, { marginTop: space.s3 }]} placeholder="Certificate title" placeholderTextColor={p.bodyText} value={title} onChangeText={setTitle} />
      <Pressable onPress={pick} style={s.logoRow}>
        {photo
          ? <Image source={{ uri: photo }} style={s.logo} />
          : <View style={[s.logo, s.logoEmpty]}><Text style={s.micro}>Certificate photo (required if titled)</Text></View>}
      </Pressable>
      <Button title={busy ? 'Saving…' : 'Continue'} onPress={save} disabled={busy} />
    </>
  );
}

function LiveStep({ slug, onDone, onAddMore }: { slug: string; onDone: () => void; onAddMore?: () => void }) {
  const { p } = useTheme();
  const s = themed(p);
  const link = `${SITE_URL}/s/${slug}`;
  const share = async () => {
    try {
      await Share.share({ message: link });
    } catch {
      await Clipboard.setStringAsync(link);
      Alert.alert('Link copied', 'Sharing is unavailable here — paste it anywhere.');
    }
  };
  const copy = async () => {
    await Clipboard.setStringAsync(link);
    Alert.alert('Link copied', 'Paste it anywhere — it works without the app.');
  };
  return (
    <>
      <Text style={s.h1}>You&apos;re live!</Text>
      <Text style={s.micro}>Share the link anywhere — it works without the app.</Text>
      <View style={{ alignItems: 'center', marginVertical: space.s5 }}>
        <QRCode value={link} size={180} />
      </View>
      <Button title="Share link" onPress={share} />
      <View style={{ height: space.s3 }} />
      <Button title="Copy link" variant="secondary" onPress={copy} />
      <View style={{ height: space.s3 }} />
      <Button title="Add 2 more items to appear in Discover" variant="secondary" onPress={onAddMore ?? onDone} />
      <View style={{ height: space.s3 }} />
      <Button title="Done" variant="tertiary" onPress={onDone} />
    </>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background, padding: space.s5 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: space.s3 },
  exit: { padding: space.s1 },
  prog: { flexDirection: 'row', gap: 4, marginBottom: space.s2 },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: p.line },
  segOn: { backgroundColor: C.cta },
  h1: { ...type.h1, color: p.ink, marginBottom: space.s4 },
  sec: { ...type.h3, color: p.ink, marginBottom: space.s2, marginTop: space.s2 },
  micro: { ...type.micro, color: p.bodyText, marginBottom: space.s2 },
  input: {
    backgroundColor: p.surface, borderWidth: 1, borderColor: p.lineStrong, color: p.ink,
    borderRadius: radius.md, height: 48, paddingHorizontal: space.s4, fontSize: 16, marginBottom: space.s3,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2, marginBottom: space.s3 },
  opt: { padding: space.s3, borderWidth: 1, borderColor: p.lineStrong, borderRadius: radius.md, color: p.bodyText },
  optOn: { borderColor: p.primary, color: p.primary, fontWeight: '600' },
  check: { flexDirection: 'row', alignItems: 'center', gap: space.s2, marginBottom: space.s3 },
  box: {
    width: 24, height: 24, borderRadius: 4, borderWidth: 1,
    borderColor: p.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  checkT: { ...type.body, color: p.ink },
  logoRow: { marginBottom: space.s4 },
  logo: { width: 96, height: 96, borderRadius: 48 },
  logoEmpty: { backgroundColor: p.line, alignItems: 'center', justifyContent: 'center' },
});
