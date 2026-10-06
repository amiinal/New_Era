import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Business } from '../api';
import { C, radius, shadow, space, type } from '../theme';
import { Button } from './Button';
import { Palette, useTheme } from '../useTheme';

// TRU-7: first chat with a business in another country, or a remote /
// nationwide service. Warning tint per design §1.3 (never white on amber).
// Keep in step with the web Thread caution card.
export function CautionSheet({ business, crossBorder, onAck, onBack }: {
  business: Business; crossBorder: boolean;
  onAck: () => void; onBack: () => void;
}) {
  const { p } = useTheme();
  const s = themed(p);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onBack}>
      <View style={s.scrim}>
        <View style={s.card}>
          <Text style={s.h1}>Stay safe</Text>
          <Text style={s.micro}>
            {crossBorder
              ? `This business is in ${business.country} — a different country from yours.`
              : 'This is a remote service — you may never meet this seller in person.'}
          </Text>
          {[
            'Don’t pay in full upfront to a seller you don’t know.',
            'Never share bank details, card numbers, or OTP codes.',
            'Meet in a public place for in-person exchange where you can.',
            'Report anything suspicious straight from this chat.',
          ].map(t => (
            <Text key={t} style={s.bullet}>•  {t}</Text>
          ))}
          <View style={{ height: space.s4 }} />
          <Button title="I understand — continue" onPress={onAck} />
          <View style={{ height: space.s2 }} />
          <Button title="Go back" variant="tertiary" onPress={onBack} />
        </View>
      </View>
    </Modal>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,.4)', alignItems: 'center', justifyContent: 'center', padding: space.s4 },
  card: {
    width: '100%', maxWidth: 420, backgroundColor: 'rgba(232,166,57,.15)',
    borderWidth: 1, borderColor: C.warningTint, borderRadius: radius.lg, padding: space.s5,
    ...shadow.lg,
  },
  h1: { ...type.h3, color: p.ink, marginBottom: space.s2 },
  micro: { ...type.bodySm, color: p.ink, marginBottom: space.s3 },
  bullet: { ...type.bodySm, color: p.ink, marginBottom: space.s2 },
});
