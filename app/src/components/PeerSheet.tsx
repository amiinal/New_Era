import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Peer } from '../api';
import { radius, space, type } from '../theme';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Palette, useTheme } from '../useTheme';

// Read-only customer card: tapping a customer's avatar shows who they are
// (name + tagline + online). Contact details stay private.
export function PeerSheet({ peer, onClose }: {
  peer: Extract<Peer, { kind: 'customer' }>;
  onClose: () => void;
}) {
  const { p } = useTheme();
  const s = themed(p);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.scrim}>
        <View style={s.card}>
          <Avatar name={peer.name} size={72} online={peer.online} />
          <Text style={s.h1}>{peer.name}</Text>
          {!!peer.tagline && peer.tagline !== peer.name && (
            <Text style={s.micro}>{peer.tagline}</Text>
          )}
          <Text style={[s.micro, { marginTop: space.s2 }]}>
            {peer.online ? 'Online now' : 'Offline'}
          </Text>
          <View style={{ height: space.s4 }} />
          <Button title="Close" variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,.4)', alignItems: 'center', justifyContent: 'center', padding: space.s4 },
  card: {
    width: '100%', maxWidth: 360, backgroundColor: p.background,
    borderRadius: radius.lg, padding: space.s5, alignItems: 'center',
  },
  h1: { ...type.h3, color: p.ink, marginTop: space.s3 },
  micro: { ...type.micro, color: p.bodyText, textAlign: 'center' },
});
