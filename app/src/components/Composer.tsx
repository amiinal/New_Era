import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../api';
import { C, radius, space, type } from '../theme';
import { Button } from './Button';

export const STORY_BGS = [
  '#C24E22', '#2C3E7A', '#1E1E24', '#8B8F9B',
  '#0A6B62', '#D63384', '#B0362C', '#B97A1B', '#0E9488',
];

// Add-status composer: gallery photo (+ caption) or text on background
// with a portrait preview of exactly what will post. 5/day enforced server-side.
export function Composer({ businessId, onClose, onPosted }: {
  businessId: string; onClose: () => void; onPosted: () => void;
}) {
  const [mode, setMode] = useState<'pick' | 'photo' | 'text'>('pick');
  const [uri, setUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [text, setText] = useState('');
  const [bg, setBg] = useState(STORY_BGS[0]);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!r.canceled && r.assets[0]) {
      setUri(r.assets[0].uri);
      setMode('photo');
    }
  };

  const upload = (localUri: string, key: string) => api.uploadPhoto(localUri, key);

  const post = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (mode === 'photo' && uri) {
        const key = `business/${businessId}/status/${Date.now()}.jpg`;
        const finalKey = await upload(uri, key);
        await api.postStatus(businessId, { kind: 'photo', imageKey: finalKey, caption: caption.trim() || undefined });
      } else if (mode === 'text' && text.trim()) {
        await api.postStatus(businessId, { kind: 'text', text: text.trim(), bg });
      } else return;
      onPosted();
    } catch (e) {
      Alert.alert('Could not post', String((e as Error).message || 'Check connection, then retry.'));
    } finally { setBusy(false); }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Text style={styles.h1}>New status</Text>
        {mode === 'pick' && (
          <>
            <Button title="Add from gallery" onPress={pick} />
            <View style={{ height: space.s3 }} />
            <Button title="Text update" variant="secondary" onPress={() => setMode('text')} />
          </>
        )}
        {mode === 'photo' && uri && (
          <>
            <Image source={{ uri }} style={styles.prev} />
            <TextInput style={styles.input} placeholder="Add a caption…" value={caption}
              onChangeText={setCaption} />
            <Button title={busy ? 'Posting…' : 'Post'} onPress={post} disabled={busy} />
          </>
        )}
        {mode === 'text' && (
          <>
            <View style={[styles.portrait, { backgroundColor: bg }]}>
              <Text style={styles.portraitT}>{text || 'Your text here'}</Text>
            </View>
            <TextInput style={styles.input} placeholder="Type your update…" value={text}
              onChangeText={setText} multiline />
            <View style={styles.dots}>
              {STORY_BGS.map(b => (
                <Pressable key={b} onPress={() => setBg(b)}
                  style={[styles.dot, { backgroundColor: b }, bg === b && styles.dotOn]} />
              ))}
            </View>
            <Button title={busy ? 'Posting…' : 'Post'} onPress={post} disabled={busy || !text.trim()} />
          </>
        )}
        <View style={{ height: space.s3 }} />
        <Button title="Close" variant="secondary" onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background, padding: space.s5 },
  h1: { ...type.h1, color: C.ink, marginBottom: space.s4 },
  input: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.lineStrong,
    borderRadius: radius.md, minHeight: 48, paddingHorizontal: space.s4, fontSize: 16, marginVertical: space.s3,
  },
  prev: { width: '100%', height: 180, borderRadius: radius.lg },
  portrait: { width: 180, height: 320, borderRadius: radius.lg, alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center', padding: 20 },
  portraitT: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2, marginVertical: space.s3 },
  dot: { width: 40, height: 40, borderRadius: 20 },
  dotOn: { borderWidth: 2, borderColor: C.primary },
});
