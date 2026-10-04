import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { api } from '../api';
import { useAuth } from '../auth';
import { C, radius, space, type } from '../theme';
import { Button } from '../components/Button';

// Centered card auth: logo + tagline, email/phone toggle, country
// dropdown, OTP step. Sign-up is the same OTP flow (new accounts are
// created on first verify) — the link below just restarts it.
const COUNTRIES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
];

export function AuthScreen() {
  const { signIn, pendingTo } = useAuth();
  const [mode, setMode] = useState<'email' | 'phone'>(pendingTo.includes('@') || !pendingTo ? 'email' : 'phone');
  const [to, setTo] = useState(pendingTo);
  const [code, setCode] = useState('');
  const [country, setCountry] = useState('NG');
  const [drop, setDrop] = useState(false);
  const [sent, setSent] = useState(false);

  const reset = () => { setCode(''); setSent(false); };

  const request = async () => {
    if (!to.trim()) { Alert.alert('Enter email or phone', 'We need somewhere to send the code.'); return; }
    try {
      const address = to.trim();
      const body = mode === 'email' ? { email: address } : { phone: address };
      const r = await api.requestCode(body);
      setSent(true);
      if (r.devCode) Alert.alert('Dev code', r.devCode);
    } catch (e) {
      const m = String((e as Error).message || '');
      Alert.alert('Code not sent', m.startsWith('429')
        ? 'Too many tries — wait a minute, then send once.'
        : 'Check the API is running and the phone reaches it, then retry.');
    }
  };
  const verify = async () => {
    try {
      await signIn(to.trim(), code, country);
    } catch (e) {
      const m = String((e as Error).message || '');
      Alert.alert('Could not sign in', m.startsWith('5')
        ? 'Server or database error — check the API and database, then retry.'
        : 'Invalid or expired code — request one code and enter it within 10 minutes.');
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <View style={styles.brand}>
          <Svg width={64} height={64} viewBox="0 0 100 100">
            <Path d="M 26 80 L 26 50 C 26 38, 74 92, 74 80 L 74 14"
              fill="none" stroke={C.primary} strokeWidth={8} strokeLinecap="round" />
          </Svg>
          <Text style={styles.word}>New Era</Text>
          <Text style={styles.tag}>Found. Not just online.</Text>
        </View>

        <Text style={styles.h1}>Sign in</Text>
        {!sent ? (
          <>
            <TextInput style={styles.input}
              placeholder={mode === 'email' ? 'Add the email you used to login here' : 'Add your phone number'}
              value={to} onChangeText={setTo} autoCapitalize="none"
              keyboardType={mode === 'email' ? 'email-address' : 'phone-pad'} />
            <Text onPress={() => { setMode(mode === 'email' ? 'phone' : 'email'); setTo(''); }}
              style={styles.swap}>
              {mode === 'email' ? 'Add phone number instead' : 'Add email instead'}
            </Text>
            <Pressable onPress={() => setDrop(!drop)} style={styles.drop}>
              <Text style={styles.dropT}>{COUNTRIES.find(c => c.code === country)?.name}</Text>
              <Text style={styles.dropT}>{drop ? '▲' : '▼'}</Text>
            </Pressable>
            {drop && (
              <View style={styles.menu}>
                {COUNTRIES.map(c => (
                  <Text key={c.code} onPress={() => { setCountry(c.code); setDrop(false); }}
                    style={[styles.opt, country === c.code && styles.optOn]}>
                    {c.name}
                  </Text>
                ))}
              </View>
            )}
            <Button title="Send code" onPress={request} />
            <Text style={styles.signup}>
              New here? <Text style={styles.link} onPress={reset}>Sign up</Text>
            </Text>
          </>
        ) : (
          <>
            <TextInput style={styles.input} placeholder="6-digit code" value={code}
              onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
            <Button title="Verify" onPress={verify} />
            <Text style={styles.signup}>
              Wrong address? <Text style={styles.link} onPress={reset}>Start over</Text>
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center', padding: space.s5 },
  card: {
    width: '100%', maxWidth: 420, backgroundColor: C.surface,
    borderRadius: radius.lg, padding: space.s5,
  },
  brand: { alignItems: 'center', marginBottom: space.s4 },
  word: { ...type.h1, fontSize: 24, color: C.primary, marginTop: space.s2 },
  tag: { ...type.micro, color: C.bodyText, marginTop: 2 },
  h1: { ...type.h1, fontSize: 22, color: C.ink, marginBottom: space.s4, textAlign: 'center' },
  input: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.lineStrong,
    borderRadius: radius.md, height: 48, paddingHorizontal: space.s4, fontSize: 16, marginBottom: space.s2,
  },
  swap: { ...type.bodySm, color: C.primary, marginBottom: space.s3 },
  drop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: C.lineStrong, borderRadius: radius.md,
    height: 48, paddingHorizontal: space.s4, marginBottom: space.s2,
  },
  dropT: { ...type.body, color: C.ink },
  menu: { borderWidth: 1, borderColor: C.line, borderRadius: radius.md, marginBottom: space.s3, overflow: 'hidden' },
  opt: { ...type.body, color: C.ink, padding: space.s3 },
  optOn: { color: C.primary, fontWeight: '700', backgroundColor: 'rgba(44,62,122,.06)' },
  signup: { ...type.bodySm, color: C.bodyText, textAlign: 'center', marginTop: space.s4 },
  link: { color: C.primary, fontWeight: '600' },
});
