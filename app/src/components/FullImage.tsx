import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

// Centered photo card (never full-bleed): the whole image, uncropped,
// on a surface card. Swipeable set with arrows + counter — tap outside
// or Close to dismiss.
export function FullImage({ uris, index, onClose }: { uris: string[]; index: number; onClose: () => void }) {
  const [at, setAt] = useState(index);
  useEffect(() => { setAt(index); }, [index, uris]);
  const go = (d: number) => setAt(a => Math.max(0, Math.min(uris.length - 1, a + d)));
  return (
    <Modal visible={uris.length > 0} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable onPress={onClose} style={styles.scrim} />
        <View style={styles.card}>
          {uris[at] ? <Image source={{ uri: uris[at] }} style={styles.img} resizeMode="contain" /> : null}
          {uris.length > 1 ? (
            <View style={styles.bar}>
              <Pressable onPress={() => go(-1)} style={styles.arrow} hitSlop={8}>
                <ChevronLeft size={22} color="#1E1E24" />
              </Pressable>
              <Text style={styles.count}>{at + 1} / {uris.length}</Text>
              <Pressable onPress={() => go(1)} style={styles.arrow} hitSlop={8}>
                <ChevronRight size={22} color="#1E1E24" />
              </Pressable>
            </View>
          ) : null}
        </View>
        <Pressable onPress={onClose} style={styles.xrow}>
          <X size={18} color="#fff" />
          <Text style={styles.x}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(0,0,0,.85)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  scrim: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  card: {
    width: '100%', maxWidth: 480, backgroundColor: '#fff',
    borderRadius: 16, overflow: 'hidden',
  },
  img: { width: '100%', aspectRatio: 1 },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8 },
  arrow: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  count: { fontSize: 14, color: '#5B5F6B', fontWeight: '600' },
  x: { color: '#fff', fontSize: 16 },
  xrow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
});
