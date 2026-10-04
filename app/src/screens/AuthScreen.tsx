import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { api } from '../api';
import { useAuth } from '../auth';
import { COUNTRIES } from '../countries';
import { getFlag, setFlag } from '../store';
import { C, radius, space, type } from '../theme';
import { Button } from '../components/Button';

const FIELD_BG = '#F2F3F5'; // soft pill fill (auth only)

// Sleek card auth, no logo. Fresh installs see Sign up first; returning
// users see Sign in (remembered on-device). OTP underneath in both.
export function AuthScreen() {
  const { signIn, pendingTo } = useAuth();
  const [tab, setTab] = useState<'signup' | 'signin' | null>(null);
  const [mode, setMode] = useState<'email' | 'phone'>(pendingTo.includes('@') || !pendingTo ? 'email' : 'phone');
  const [to, setTo] = useState(pendingTo);
  const [code, setCode] = useState('');
  const [country, setCountry] = useState('NG');
  const [drop, setDrop] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    getFlag('returning').then(v => setTab(v ? 'signin' : 'signup'));
  }, []);
  if (!tab) return <View style={styles.root} />;

  const reset = () => { setCode(''); setSent(false); };

  const request = async () => {
    if (!to.trim()) { Alert.alert('Enter email or phone', 'We need somewhere to send the code.'); return; }
    try {
      const address = to.trim();
      const r = await api.requestCode(mode === 'email' ? { email: address } : { phone: fullPhone(address) });
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
      const address = to.trim();
      await signIn(mode === 'email' ? address : fullPhone(address), code, country);
      await setFlag('returning', '1');
    } catch (e) {
      const m = String((e as Error).message || '');
      Alert.alert('Could not sign in', m.startsWith('5')
        ? 'Server or database error — check the API and database, then retry.'
        : 'Invalid or expired code — request one code and enter it within 10 minutes.');
    }
  };

  const fresh = tab === 'signup';
  const dial = COUNTRIES.find(c => c.code === country)?.dial ?? '';
  // Full international format: +dial + number without trunk zero.
  const fullPhone = (raw: string) => `+${dial}${raw.trim().replace(/^0+/, '')}`;
  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.h1}>{sent ? 'Enter code' : fresh ? 'Create Account' : 'Welcome back'}</Text>
        <Text style={styles.sub}>
          {sent ? `We sent a 6-digit code to ${to.trim()}.`
            : fresh ? 'Join New Era to list your business and chat with customers.'
            : 'Sign in to your New Era account.'}
        </Text>

        {!sent ? (
          <>
            {mode === 'email' ? (
              <TextInput style={styles.field}
                placeholder="Email address"
                value={to} onChangeText={setTo} autoCapitalize="none"
                keyboardType="email-address" />
            ) : (
              <View style={styles.phoneBox}>
                <Text style={styles.prefix}>+{dial}</Text>
                <View style={styles.divider} />
                <TextInput style={[styles.field, { flex: 1, marginBottom: 0, backgroundColor: 'transparent' }]}
                  placeholder="Phone number"
                  value={to} onChangeText={setTo} keyboardType="phone-pad" />
              </View>
            )}
            <Text onPress={() => { setMode(mode === 'email' ? 'phone' : 'email'); setTo(''); }}
              style={styles.swap}>
              {mode === 'email' ? 'Use phone number instead' : 'Use email instead'}
            </Text>
            <Pressable onPress={() => setDrop(!drop)} style={styles.fieldRow}>
              <Text style={styles.fieldT}>{COUNTRIES.find(c => c.code === country)?.name}</Text>
              {drop
                ? <ChevronUp size={20} color={C.bodyText} />
                : <ChevronDown size={20} color={C.bodyText} />}
            </Pressable>
            {drop && (
              <ScrollView style={styles.menu} nestedScrollEnabled>
                {COUNTRIES.map(c => {
                  const on = country === c.code;
                  return (
                    <Pressable key={c.code}
                      onPress={() => { setCountry(c.code); setDrop(false); }}
                      style={({ pressed }) => [styles.optRow, pressed && styles.optPressed, on && styles.optSel]}>
                      <Text style={[styles.opt, on && styles.optOn]}>{c.name} · +{c.dial}</Text>
                      {on ? <Text style={styles.tick}>✓</Text> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
            <Button pill title={fresh ? 'Create Account' : 'Sign in'} onPress={request} />
            <Text style={styles.swapLine}>
              {fresh ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={styles.link} onPress={() => { setTab(fresh ? 'signin' : 'signup'); reset(); }}>
                {fresh ? 'Sign in here' : 'Sign up'}
              </Text>
            </Text>
          </>
        ) : (
          <>
            <TextInput style={styles.field} placeholder="6-digit code" value={code}
              onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
            <Button pill title="Continue" onPress={verify} />
            <Text style={styles.swapLine}>
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
    borderRadius: 28, padding: space.s6,
  },
  h1: { ...type.h1, fontSize: 26, color: C.ink, textAlign: 'center' },
  sub: { ...type.bodySm, color: C.bodyText, textAlign: 'center', marginTop: space.s2, marginBottom: space.s5 },
  field: {
    backgroundColor: FIELD_BG, borderRadius: 24, height: 52,
    paddingHorizontal: space.s5, fontSize: 16, marginBottom: space.s3,
  },
  fieldRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: FIELD_BG, borderRadius: 24, height: 52,
    paddingHorizontal: space.s5, marginBottom: space.s4,
  },
  fieldT: { ...type.body, color: C.ink },
  menu: { backgroundColor: FIELD_BG, borderRadius: 16, marginBottom: space.s3, maxHeight: 220, overflow: 'hidden' },
  opt: { ...type.body, color: C.ink, padding: space.s4, flex: 1 },
  optOn: { color: C.primary, fontWeight: '700' },
  optRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optPressed: { backgroundColor: 'rgba(44,62,122,.06)' },
  optSel: { backgroundColor: 'rgba(44,62,122,.06)' },
  tick: { ...type.body, color: C.primary, fontWeight: '700', paddingRight: space.s4 },
  swap: { ...type.bodySm, color: C.primary, marginBottom: space.s3 },
  phoneBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: FIELD_BG, borderRadius: 24, height: 52,
    paddingLeft: space.s5, marginBottom: space.s3,
  },
  prefix: { ...type.body, color: C.ink, fontWeight: '600' },
  divider: { width: 1, height: 24, backgroundColor: C.line, marginHorizontal: space.s2 },
  swapLine: { ...type.bodySm, color: C.bodyText, textAlign: 'center', marginTop: space.s4 },
  link: { color: C.primary, fontWeight: '600' },
});
