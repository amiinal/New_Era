import React, { useState } from 'react';
import {
  Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import QRCode from 'react-native-qrcode-svg';
import { Share } from 'react-native';
import { api } from '../api';
import { useAuth } from '../auth';
import { C, radius, space, type } from '../theme';
import { Button } from '../components/Button';
import { ListingForm } from '../components/ListingForm';

const CATEGORIES = ['Food service', 'Bakery', 'Salon', 'Tailor', 'Catering', 'Fashion', 'Electronics', 'Other'];

// ONB-1..11: interactive wizard — every step is a real action.
// Basics → first listing → certificates (optional) → you're live.
export function Onboarding({ onDone }: { onDone: () => void }) {
  const { account } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Food service');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [nationwide, setNationwide] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [biz, setBiz] = useState<{ id: string; slug: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const pickInto = (set: (u: string) => void) => async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!r.canceled && r.assets[0]) set(r.assets[0].uri);
  };
  const pickLogo = pickInto(setLogo);
  const pickCover = pickInto(setCover);

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
        name: name.trim(), category, country: account?.country ?? 'NG', city: city.trim(),
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
      <ScrollView style={styles.root}>
        {step === 0 && (
          <>
            <Text style={styles.h1}>Your business</Text>
            <TextInput style={styles.input} placeholder="Business name (required)" value={name} onChangeText={setName} />
            <Text style={styles.sec}>Category</Text>
            <View style={styles.wrap}>
              {CATEGORIES.map(c => (
                <Text key={c} onPress={() => setCategory(c)} style={[styles.opt, category === c && styles.optOn]}>{c}</Text>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="City (required)" value={city} onChangeText={setCity} />
            <TextInput style={styles.input} placeholder="Area / neighborhood" value={area} onChangeText={setArea} />
            <Pressable onPress={() => setNationwide(!nationwide)} style={styles.check}>
              <Text style={styles.box}>{nationwide ? '✓' : ''}</Text>
              <Text style={styles.checkT}>Serve nationwide (online / delivery)</Text>
            </Pressable>
            <Pressable onPress={pickLogo} style={styles.logoRow}>
              {logo
                ? <Image source={{ uri: logo }} style={styles.logo} />
                : <View style={[styles.logo, styles.logoEmpty]}><Text style={styles.micro}>Logo (optional)</Text></View>}
            </Pressable>
            <Pressable onPress={pickCover} style={styles.logoRow}>
              {cover
                ? <Image source={{ uri: cover }} style={[styles.logo, { width: 192, borderRadius: 12 }]} />
                : <View style={[styles.logo, styles.logoEmpty, { width: 192, borderRadius: 12 }]}><Text style={styles.micro}>Header image (optional)</Text></View>}
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
        {step === 3 && biz && <LiveStep slug={biz.slug} onDone={onDone} />}
      </ScrollView>
    </Modal>
  );
}

function CertStep({ businessId, onDone }: { businessId: string; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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
      <Text style={styles.h1}>Certificates (optional)</Text>
      <Text style={styles.micro}>Self-reported — shown with a “not verified” label until Phase 2 review.</Text>
      <TextInput style={[styles.input, { marginTop: space.s3 }]} placeholder="Certificate title" value={title} onChangeText={setTitle} />
      <Pressable onPress={pick} style={styles.logoRow}>
        {photo
          ? <Image source={{ uri: photo }} style={styles.logo} />
          : <View style={[styles.logo, styles.logoEmpty]}><Text style={styles.micro}>Certificate photo (required if titled)</Text></View>}
      </Pressable>
      <Button title={busy ? 'Saving…' : 'Continue'} onPress={save} disabled={busy} />
    </>
  );
}

function LiveStep({ slug, onDone }: { slug: string; onDone: () => void }) {
  const link = `https://newera.shop/s/${slug}`;
  return (
    <>
      <Text style={styles.h1}>You&apos;re live!</Text>
      <Text style={styles.micro}>Share the link anywhere — it works without the app.</Text>
      <View style={{ alignItems: 'center', marginVertical: space.s5 }}>
        <QRCode value={link} size={180} />
      </View>
      <Button title="Share link" onPress={() => Share.share({ message: link })} />
      <View style={{ height: space.s3 }} />
      <Button title="Add 2 more items to appear in Discover" variant="secondary" onPress={onDone} />
      <View style={{ height: space.s3 }} />
      <Button title="Done" variant="tertiary" onPress={onDone} />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background, padding: space.s5 },
  h1: { ...type.h1, color: C.ink, marginBottom: space.s4 },
  sec: { ...type.h3, color: C.ink, marginBottom: space.s2, marginTop: space.s2 },
  micro: { ...type.micro, color: C.bodyText, marginBottom: space.s2 },
  input: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.lineStrong,
    borderRadius: radius.md, height: 48, paddingHorizontal: space.s4, fontSize: 16, marginBottom: space.s3,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2, marginBottom: space.s3 },
  opt: { padding: space.s3, borderWidth: 1, borderColor: C.lineStrong, borderRadius: radius.md, color: C.bodyText },
  optOn: { borderColor: C.primary, color: C.primary, fontWeight: '600' },
  check: { flexDirection: 'row', alignItems: 'center', gap: space.s2, marginBottom: space.s3 },
  box: {
    width: 24, height: 24, borderRadius: 4, borderWidth: 1, borderColor: C.primary,
    textAlign: 'center', color: C.primary, fontWeight: '700',
  },
  checkT: { ...type.body, color: C.ink },
  logoRow: { marginBottom: space.s4 },
  logo: { width: 96, height: 96, borderRadius: 48 },
  logoEmpty: { backgroundColor: C.line, alignItems: 'center', justifyContent: 'center' },
});
