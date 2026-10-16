import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { radius, shadow, space, type } from '../theme';
import { Button } from './Button';
import { Palette, useTheme } from '../useTheme';
import { confirmAction } from '../ui';

const NINETY_DAYS = 90 * 24 * 3600 * 1000;

// Hibernating account gate: storefront hidden, chats paused, nothing
// deleted. Reopen restores everything; permanent delete unlocks after
// 90 days, customers only (stores stay accountable — see FAQ).
export function Hibernate({ since, onReopened, onGone }: {
  since: string | null;
  onReopened: () => Promise<void>;
  onGone: () => Promise<void>;
}) {
  const { p } = useTheme();
  const s = themed(p);
  const [busy, setBusy] = useState(false);
  const days = since ? Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / (24 * 3600 * 1000))) : 0;
  const deletable = !!since && Date.now() - new Date(since).getTime() >= NINETY_DAYS;

  const reopen = async () => {
    setBusy(true);
    try {
      await api.reactivate();
      await onReopened();
    } catch {
      Alert.alert('Could not reopen', 'Check your connection, then retry.');
    } finally { setBusy(false); }
  };
  const destroy = () => {
    confirmAction(
      'Delete permanently?',
      'This removes your listings, messages, and account for good. This cannot be undone.',
      'Delete everything',
      async () => {
        setBusy(true);
        try {
          await api.deleteAccount();
          await onGone();
        } catch (e) {
          Alert.alert('Could not delete', String((e as Error).message || 'Check connection, then retry.'));
        } finally { setBusy(false); }
      },
    );
  };
  return (
    <View style={s.root}>
      <View style={s.card}>
        <Text style={s.h1}>Taking a break?</Text>
        <Text style={s.sub}>
          Your account is hibernating. Your customer profile and storefront (if you have one)
          are hidden, chats are paused, and nothing is deleted — reopen anytime and everything
          comes back exactly as you left it.
        </Text>
        <Button title={busy ? 'Working…' : 'Reopen my account'} onPress={reopen} disabled={busy} />
        <View style={{ height: space.s4 }} />
        {deletable ? (
          <>
            <Text style={s.micro}>
              Hibernating {days} days — permanent delete is unlocked. Business accounts
              can&apos;t be deleted here; talk to support so open orders stay protected.
            </Text>
            <View style={{ height: space.s2 }} />
            <Button title="Delete permanently" variant="secondary" onPress={destroy} disabled={busy} />
            <View style={{ height: space.s2 }} />
          </>
        ) : (
          <Text style={s.micro}>
            {since
              ? `Hibernating ${days} of 90 days — permanent delete unlocks after 90 days.`
              : 'Permanent delete unlocks after 90 days hibernating.'}
          </Text>
        )}
        <Pressable onPress={onGone} style={{ marginTop: space.s3 }}>
          <Text style={[s.link, { textAlign: 'center' }]}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.s5, backgroundColor: p.background },
  card: {
    width: '100%', maxWidth: 420, backgroundColor: p.surface,
    borderRadius: radius.lg, padding: space.s5, ...shadow.md,
  },
  h1: { ...type.h1, color: p.ink, textAlign: 'center' },
  sub: { ...type.bodySm, color: p.bodyText, textAlign: 'center', marginTop: space.s2, marginBottom: space.s5 },
  micro: { ...type.micro, color: p.bodyText, textAlign: 'center' },
  link: { color: p.primary, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
});
