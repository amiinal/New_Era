import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { radius, shadow, space, type } from '../theme';
import { Button } from './Button';
import { Palette, useTheme } from '../useTheme';

// TRU-2: prohibited items + conduct. Static policy, day one.
// Keep in step with web/src/Prohibited.jsx.
export const PROHIBITED: [string, string][] = [
  ['Drugs and controlled substances', 'Illegal drugs, and medicines that need a prescription sold without one.'],
  ['Weapons and explosives', 'Guns, ammunition, explosives, and anything made to harm.'],
  ['Counterfeit and stolen goods', 'Fakes, counterfeit currency or documents, and anything stolen.'],
  ['Money schemes', 'Pyramid and Ponzi schemes, guaranteed-return forex or crypto trading, and unlicensed lending. Never send money to recover winnings or unlock a loan.'],
  ['Fake cures', 'Remedies or devices claimed to cure serious illness without approval.'],
  ['Adult and exploitative services', 'Sexual services, human trafficking, and exploitative labour of any kind.'],
  ['Protected wildlife', 'Ivory, skins, and other products from protected animals.'],
  ['Scams and harassment', 'Advance-fee fraud, impersonation, threats, hate, and spam. Meet in public places where you can, and report anything suspicious.'],
];

export function Prohibited({ onClose }: { onClose: () => void }) {
  const { p } = useTheme();
  const s = themed(p);
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <ScrollView style={s.root} contentContainerStyle={s.colWrap}>
      <View style={s.col}>
        <Text style={s.h1}>Prohibited items & conduct</Text>
        <Text style={s.micro}>
          These are never allowed on New Era. Listings that break the rules are
          removed, and accounts behind scams are suspended.
        </Text>
        {PROHIBITED.map(([t, d], j) => (
          <View key={j} style={s.card}>
            <Text style={s.t}>{t}</Text>
            <Text style={s.answer}>{d}</Text>
          </View>
        ))}
        <View style={{ height: space.s4 }} />
        <Button title="Close" variant="secondary" onPress={onClose} />
      </View>
      </ScrollView>
    </Modal>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background },
  inner: { padding: space.s5 },
  colWrap: { flexGrow: 1, alignItems: 'center' },
  col: { width: '100%', maxWidth: 720, padding: space.s5 },
  h1: { ...type.h1, color: p.ink, marginBottom: space.s2 },
  micro: { ...type.micro, color: p.bodyText, marginBottom: space.s3 },
  card: { backgroundColor: p.surface, borderRadius: radius.lg, padding: space.s4, marginBottom: space.s2, ...shadow.md },
  t: { ...type.body, color: p.ink, fontWeight: '600' },
  answer: { ...type.bodySm, color: p.bodyText, marginTop: space.s2 },
});
