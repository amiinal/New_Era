import React from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

// Fullscreen photo: the whole image, uncropped (contain on neutral
// black), tap anywhere or ✕ to close. Used for listing photos.
export function FullImage({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  const { height } = useWindowDimensions();
  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.root}>
        {uri ? <Image source={{ uri }} style={[styles.img, { maxHeight: height * 0.8 }]} resizeMode="contain" /> : null}
        <Text style={styles.x}>✕ Close</Text>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  img: { width: '100%' },
  x: { color: '#fff', fontSize: 16, marginTop: 16 },
});
