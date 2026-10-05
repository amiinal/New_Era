import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../api';
import { useAuth } from '../auth';
import { radius, space, type } from '../theme';
import { Button } from './Button';
import { Palette, useTheme } from '../useTheme';

// Keep in step with web/src/ReportForm.jsx.
export const REPORT_REASONS = [
  'Scam or fraud',
  'Prohibited item',
  'Wrong or misleading info',
  'Fake certificate',
  'Harassment or abuse',
  'Something else',
];

// TRU-1: pick a reason + leave a contact so the team can follow up.
export function ReportDialog({ targetType, targetId, title, onClose, onSent }: {
  targetType: string; targetId: string; title: string;
  onClose: () => void; onSent: () => void;
}) {
  const { account } = useAuth();
  const [reason, setReason] = useState<string | null>(null);
  const [contact, setContact] = useState(account?.email ?? account?.phone ?? '');
  const [busy, setBusy] = useState(false);
  const { p } = useTheme();
  const s = themed(p);

  const send = async () => {
    if (!reason) { Alert.alert('Pick a reason', 'Choose what is wrong so the team can act.'); return; }
    setBusy(true);
    try {
      await api.report({
        targetType, targetId, reason,
        ...(contact.trim() ? { contact: contact.trim() } : {}),
      });
      onSent();
    } catch {
      Alert.alert('Could not send', 'Sign in first, then retry.');
    } finally { setBusy(false); }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.scrim}>
        <View style={s.card}>
          <Text style={s.h1}>Report {title}</Text>
          <Text style={s.micro}>What&apos;s wrong?</Text>
          {REPORT_REASONS.map(r => (
            <Pressable key={r} onPress={() => setReason(r)} style={[s.opt, reason === r && s.optOn]}>
              <Text style={[s.optT, reason === r && s.optTOn]}>{r}</Text>
            </Pressable>
          ))}
          <Text style={[s.micro, { marginTop: space.s3 }]}>Your email or phone (for follow-up)</Text>
          <TextInput style={s.input} placeholder="How can we reach you?" placeholderTextColor={p.bodyText}
            value={contact} onChangeText={setContact} autoCapitalize="none" keyboardType="email-address" />
          <Button title={busy ? 'Sending…' : 'Send report'} onPress={send} disabled={busy} />
          <View style={{ height: space.s2 }} />
          <Button title="Cancel" variant="tertiary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,.4)', alignItems: 'center', justifyContent: 'center', padding: space.s4 },
  card: { width: '100%', maxWidth: 420, backgroundColor: p.background, borderRadius: radius.lg, padding: space.s5 },
  h1: { ...type.h3, color: p.ink, marginBottom: space.s1 },
  micro: { ...type.micro, color: p.bodyText, marginBottom: space.s2 },
  opt: {
    borderWidth: 1, borderColor: p.lineStrong, borderRadius: radius.md,
    padding: space.s3, marginBottom: space.s2,
  },
  optOn: { borderColor: p.primary },
  optT: { ...type.body, color: p.ink },
  optTOn: { fontWeight: '600', color: p.primary },
  input: {
    backgroundColor: p.surface, borderWidth: 1, borderColor: p.lineStrong, color: p.ink,
    borderRadius: radius.md, height: 48, paddingHorizontal: space.s4, fontSize: 16, marginBottom: space.s3,
  },
});
