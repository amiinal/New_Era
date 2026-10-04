import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth';
import { C, radius, space, type } from '../theme';
import { Palette, useTheme } from '../useTheme';
import { Button } from '../components/Button';

// Settings (HLP-2 support scope: self-serve first). Appearance, help,
// support contact for bugs/important issues, sign out, version.
export function Settings({ onClose, onHelp }: { onClose: () => void; onHelp: () => void }) {
  const { signOut } = useAuth();
  const { p, mode, setMode } = useTheme();
  const [sup, setSup] = useState(false);
  const s = themed(p);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={s.root}>
        <Text style={s.h1}>Settings</Text>

        <Text style={s.sec}>Appearance</Text>
        <View style={s.row}>
          {(['system', 'light', 'dark'] as const).map(m => (
            <Text key={m} onPress={() => setMode(m)} style={[s.opt, mode === m && s.optOn]}>
              {m[0].toUpperCase() + m.slice(1)}
            </Text>
          ))}
        </View>

        <Text style={s.sec}>Help</Text>
        <Pressable onPress={onHelp} style={s.item}>
          <Text style={s.itemT}>Help center & FAQ</Text>
          <Text style={s.chev}>›</Text>
        </Pressable>
        <Pressable onPress={() => setSup(!sup)} style={s.item}>
          <Text style={s.itemT}>Contact support</Text>
          <Text style={s.chev}>{sup ? '▲' : '▼'}</Text>
        </Pressable>
        {sup && (
          <Text style={s.micro}>
            Support hours: Mon–Fri, 9:00–17:00 WAT. Typical reply within one business day.
            For bugs or anything the FAQ doesn't cover: support@newera.shop
          </Text>
        )}

        <View style={{ height: space.s5 }} />
        <Button title="Sign out" variant="secondary" onPress={() => { signOut(); onClose(); }} />
        <View style={{ height: space.s2 }} />
        <Button title="Close" variant="tertiary" onPress={onClose} />
        <Text style={[s.micro, { textAlign: 'center', marginTop: space.s4 }]}>New Era · MVP beta · v1.0.0</Text>
      </View>
    </Modal>
  );
}

// Help center & FAQ (HLP-1): guides first, humans only for bugs.
const FAQ: [string, string][] = [
  ['How do I appear in Discover?', 'Publish 3 or more items with photos, plus a category and location. New businesses get a fair-rotation boost.'],
  ['How do chats work?', 'Customers message you from your storefront or listings. Reply fast — responsiveness lifts ranking.'],
  ['What do the availability states mean?', 'In stock, Limited, Sold out, or Made to order. Keep them accurate; stale states sink ranking.'],
  ['What are statuses?', 'Photo or text updates that expire after 24 hours — 5 per day. No likes, no counts.'],
  ['What are certificates?', 'Optional self-reported credentials on your storefront, labeled “not verified”. The verified badge with document review arrives in Phase 2.'],
  ['Is my data public?', 'Only your business profile, listings, statuses, and area-level location. Exact addresses stay private unless you share them.'],
];

export function Help({ onClose }: { onClose: () => void }) {
  const { p } = useTheme();
  const [open, setOpen] = useState<number | null>(null);
  const s = themed(p);
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={s.root}>
        <Text style={s.h1}>Help center</Text>
        {FAQ.map(([q, a], j) => (
          <View key={j} style={s.item}>
            <Pressable onPress={() => setOpen(open === j ? null : j)}>
              <Text style={s.itemT}>{q}</Text>
            </Pressable>
            {open === j && <Text style={s.micro}>{a}</Text>}
          </View>
        ))}
        <View style={{ height: space.s4 }} />
        <Button title="Close" variant="secondary" onPress={onClose} />
      </View>
    </Modal>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background, padding: space.s5 },
  h1: { ...type.h1, color: p.ink, marginBottom: space.s4 },
  sec: { ...type.h3, color: p.ink, marginTop: space.s4, marginBottom: space.s2 },
  micro: { ...type.micro, color: p.bodyText, marginTop: space.s2 },
  row: { flexDirection: 'row', gap: space.s2 },
  opt: {
    paddingVertical: space.s2, paddingHorizontal: space.s4, borderWidth: 1,
    borderColor: p.lineStrong, borderRadius: radius.md, color: p.bodyText, overflow: 'hidden',
  },
  optOn: { borderColor: p.primary, color: p.primary, fontWeight: '700' },
  item: {
    backgroundColor: p.surface, borderRadius: radius.lg, padding: space.s4,
    marginBottom: space.s2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  itemT: { ...type.body, color: p.ink, flex: 1 },
  chev: { fontSize: 20, color: p.bodyText },
});
