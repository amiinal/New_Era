import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import {
  Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { api, img, Listing } from '../api';
import { C, radius, space, type } from '../theme';
import { Button } from './Button';

const AVAIL: Listing['availability'][] = ['in_stock', 'limited', 'sold_out', 'made_to_order'];
const AVAIL_LABEL: Record<Listing['availability'], string> = {
  in_stock: 'In stock', limited: 'Limited', sold_out: 'Sold out', made_to_order: 'Made to order',
};

// LST-1: camera-first form — photo(s), name, price; everything else
// collapsed. Product/Service toggle; variations are separate listings.
export function ListingForm({ businessId, initial, onClose, onSaved }: {
  businessId: string; initial?: Listing | null;
  onClose: () => void; onSaved: () => void;
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

  const addUri = (uri: string) => {
    if (photos.length >= 3) { Alert.alert('Photo limit', 'Up to 3 photos per listing.'); return; }
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
      if (initial) await api.patchListing(initial.id, body);
      else await api.createListing(businessId, body);
      onSaved();
    } catch (e) {
      Alert.alert('Could not save', String((e as Error).message || 'Check connection, then retry.'));
    } finally { setBusy(false); }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      {cam ? (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView ref={ref} style={{ flex: 1 }} />
          <View style={styles.camrow}>
            <Button title="Close" variant="secondary" onPress={() => setCam(false)} />
            <Button title="Capture" onPress={shoot} />
          </View>
        </View>
      ) : (
        <ScrollView style={styles.root}>
          <Text style={styles.h1}>{initial ? 'Edit listing' : 'New listing'}</Text>
          <ScrollView horizontal style={styles.strip}>
            {photos.map((u, j) => <Image key={j} source={{ uri: /:\/\//.test(u) ? u : img(u) }} style={styles.thumb} />)}
            {photos.length < 3 && (
              <Pressable onPress={openCam} style={styles.addBtn}><Text style={styles.addT}>Capture</Text></Pressable>
            )}
            {photos.length < 3 && (
              <Pressable onPress={gallery} style={styles.addBtn}><Text style={styles.addT}>Gallery</Text></Pressable>
            )}
          </ScrollView>
          <View style={styles.toggle}>
            {(['product', 'service'] as const).map(t => (
              <Text key={t} onPress={() => setKind(t)} style={[styles.opt, kind === t && styles.optOn]}>
                {t === 'product' ? 'Product' : 'Service'}
              </Text>
            ))}
          </View>
          <TextInput style={styles.input} placeholder="Name" value={title} onChangeText={setTitle} />
          <TextInput style={styles.input} placeholder="Price (or leave blank for on request)"
            value={price} onChangeText={setPrice} keyboardType="numbers-and-punctuation" />
          {kind === 'service' && (
            <Text style={styles.micro}>Services show "starting from" and are inquiry-only (LST-2/3).</Text>
          )}
          <Text style={styles.sec}>Availability</Text>
          <View style={styles.toggle}>
            {AVAIL.map(a => (
              <Text key={a} onPress={() => setAvail(a)} style={[styles.opt, avail === a && styles.optOn]}>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background, padding: space.s5 },
  h1: { ...type.h1, color: C.ink, marginBottom: space.s4 },
  strip: { flexDirection: 'row', marginBottom: space.s4 },
  thumb: { width: 96, height: 96, borderRadius: radius.md, marginRight: space.s2 },
  addBtn: {
    width: 96, height: 96, borderRadius: radius.md, borderWidth: 1, borderColor: C.lineStrong,
    alignItems: 'center', justifyContent: 'center', marginRight: space.s2,
  },
  addT: { color: C.primary, fontWeight: '600' },
  toggle: { flexDirection: 'row', gap: space.s2, marginBottom: space.s4, flexWrap: 'wrap' },
  opt: { padding: space.s3, borderWidth: 1, borderColor: C.lineStrong, borderRadius: radius.md, color: C.bodyText },
  optOn: { borderColor: C.primary, color: C.primary, fontWeight: '600' },
  input: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.lineStrong,
    borderRadius: radius.md, height: 48, paddingHorizontal: space.s4, fontSize: 16, marginBottom: space.s3,
  },
  micro: { ...type.micro, color: C.bodyText, marginBottom: space.s3 },
  sec: { ...type.h3, color: C.ink, marginBottom: space.s2 },
  camrow: { flexDirection: 'row', gap: space.s3, padding: space.s5, backgroundColor: '#000' },
});
