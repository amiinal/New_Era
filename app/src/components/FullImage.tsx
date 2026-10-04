import React from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

// Centered photo card (never full-bleed): the whole image, uncropped,
// on a surface card. Tap outside or Close to dismiss.
export function FullImage({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.root}>
        <View style={styles.card}>
          {uri ? <Image source={{ uri }} style={styles.img} resizeMode="contain" /> : null}
        </View>
        <Text style={styles.x}>✕ Close</Text>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(0,0,0,.85)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%', maxWidth: 480, backgroundColor: '#fff',
    borderRadius: 16, overflow: 'hidden',
  },
  img: { width: '100%', aspectRatio: 1 },
  x: { color: '#fff', fontSize: 16, marginTop: 16 },
});
