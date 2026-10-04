import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import {
  Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { api, img, Listing } from '../api';
import { radius, space, type } from '../theme';
import { Button } from './Button';
import { Palette, useTheme } from '../useTheme';

const AVAIL: Listing['availability'][] = ['in_stock', 'limited', 'sold_out', 'made_to_order'];
const AVAIL_LABEL: Record<Listing['availability'], string> = {
  in_stock: 'In stock', limited: 'Limited', sold_out: 'Sold out', made_to_order: 'Made to order',
};

// LST-1: camera-first form — photo(s), name, price; everything else
// collapsed. Product/Service toggle; variations are separate listings.
export function ListingForm({ businessId, initial, onClose, onSaved }: {
  businessId: string; initial?: Listing | null;
  onClose: () => void; onSaved: (saved: Listing, isNew: boolean) => void;
}) {
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [price, setPrice] = useState(initial?.price ?? '');
  const [kind, setKind] = useState<'product' | 'service'>(initial?.type ?? 'product');
  const [avail, setAvail] = useState<Listing['availability']>(initial?.availability ?? 'in_stock');
  const [cam, setCam] = useState(false);
  const [busy, setBusy] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const { p, dark } = useTheme();
  const s = themed(p, dark);
  const link = dark ? '#7B90D6' : '#2C3E7A';

  const addUri = (uri: string) => {
    if (photos.length >= 5) { Alert.alert('Photo limit', 'Up to 5 photos per listing.'); return; }
    setPhotos([...photos, uri]);
  };
  const gallery = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!r.canceled && r.assets[0]) addUri(r.assets[0].uri);
  };
  const shoot = async () => {
    try {
      const p = await ref.current?.takePictureAsync({ quality: 0.7 });
      if (p?.uri) { addUri(p.uri); setCam(false); }
    } catch { Alert.alert('Camera failed', 'Try the gallery instead.'); }
  };
  const openCam = async () => {
    if (!permission?.granted) {
      const r = await requestPermission();
      if (!r.granted) { Alert.alert('Camera blocked', 'Allow access in settings, or use gallery.'); return; }
    }
    setCam(true);
  };

  const save = async () => {
    if (busy) return;
    if (!title.trim() || photos.length < 1) {
      Alert.alert('Incomplete', 'A photo and a name are required.');
      return;
    }
    setBusy(true);
    try {
      const keys: string[] = [];
      for (const uri of photos) {
        // Already stored (server key or http)? keep. Anything else is a
        // device URI (file:// or content://) and must be uploaded.
        if (/^https?:\/\//.test(uri) || !/:\/\//.test(uri)) { keys.push(uri); continue; }
        keys.push(await api.uploadPhoto(uri, `business/${businessId}/listing/${Date.now()}-${keys.length}.jpg`));
      }
      const body = {
        type: kind, title: title.trim(), price: price.trim() || undefined,
        availability: avail, photos: keys,
      };
      let saved: Listing; const isNew = !initial;
      if (initial) saved = await api.patchListing(initial.id, body);
      else saved = await api.createListing(businessId, body);
      onSaved(saved, isNew);
    } catch (e) {
      Alert.alert('Could not save', String((e as Error).message || 'Check connection, then retry.'));
    } finally { setBusy(false); }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      {cam ? (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView ref={ref} style={{ flex: 1 }} />
          <View style={s.camrow}>
            <Button title="Close" variant="secondary" onPress={() => setCam(false)} />
            <Button title="Capture" onPress={shoot} />
          </View>
        </View>
      ) : (
        <ScrollView style={s.root}>
          <Text style={s.h1}>{initial ? 'Edit listing' : 'New listing'}</Text>
          <ScrollView horizontal style={s.strip}>
            {photos.map((u, j) => <Image key={j} source={{ uri: /:\/\//.test(u) ? u : img(u) }} style={s.thumb} />)}
            {photos.length < 5 && (
              <Pressable onPress={openCam} style={s.addBtn}><Text style={[s.addT, { color: link }]}>Capture</Text></Pressable>
            )}
            {photos.length < 5 && (
              <Pressable onPress={gallery} style={s.addBtn}><Text style={[s.addT, { color: link }]}>Gallery</Text></Pressable>
            )}
          </ScrollView>
          <View style={s.toggle}>
            {(['product', 'service'] as const).map(t => (
              <Text key={t} onPress={() => setKind(t)} style={[s.opt, kind === t && s.optOn]}>
                {t === 'product' ? 'Product' : 'Service'}
              </Text>
            ))}
          </View>
          <TextInput style={s.input} placeholder="Name" placeholderTextColor={p.bodyText} value={title} onChangeText={setTitle} />
          <TextInput style={s.input} placeholder="Price (or leave blank for on request)" placeholderTextColor={p.bodyText}
            value={price} onChangeText={setPrice} keyboardType="numbers-and-punctuation" />
          {kind === 'service' && (
            <Text style={s.micro}>Services show "starting from" and are inquiry-only (LST-2/3).</Text>
          )}
          <Text style={s.sec}>Availability</Text>
          <View style={s.toggle}>
            {AVAIL.map(a => (
              <Text key={a} onPress={() => setAvail(a)} style={[s.opt, avail === a && s.optOn]}>
                {AVAIL_LABEL[a]}
              </Text>
            ))}
          </View>
          <Button title={busy ? 'Saving…' : initial ? 'Save changes' : 'Publish'} onPress={save} disabled={busy} />
          <View style={{ height: space.s3 }} />
          <Button title="Cancel" variant="secondary" onPress={onClose} />
        </ScrollView>
      )}
    </Modal>
  );
}

const themed = (p: Palette, dark: boolean) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background, padding: space.s5 },
  h1: { ...type.h1, color: p.ink, marginBottom: space.s4 },
  strip: { flexDirection: 'row', marginBottom: space.s4 },
  thumb: { width: 96, height: 96, borderRadius: radius.md, marginRight: space.s2 },
  addBtn: {
    width: 96, height: 96, borderRadius: radius.md, borderWidth: 1, borderColor: p.lineStrong,
    alignItems: 'center', justifyContent: 'center', marginRight: space.s2,
  },
  addT: { fontWeight: '600' },
  toggle: { flexDirection: 'row', gap: space.s2, marginBottom: space.s4, flexWrap: 'wrap' },
  opt: { padding: space.s3, borderWidth: 1, borderColor: p.lineStrong, borderRadius: radius.md, color: p.bodyText },
  optOn: { borderColor: dark ? '#7B90D6' : '#2C3E7A', color: dark ? '#7B90D6' : '#2C3E7A', fontWeight: '600' },
  input: {
    backgroundColor: p.surface, borderWidth: 1, borderColor: p.lineStrong, color: p.ink,
    borderRadius: radius.md, height: 48, paddingHorizontal: space.s4, fontSize: 16, marginBottom: space.s3,
  },
  micro: { ...type.micro, color: p.bodyText, marginBottom: space.s3 },
  sec: { ...type.h3, color: p.ink, marginBottom: space.s2 },
  camrow: { flexDirection: 'row', gap: space.s3, padding: space.s5, backgroundColor: '#000' },
});
