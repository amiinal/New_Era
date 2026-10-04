import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { api } from '../api';
import { useAuth } from '../auth';
import { COUNTRIES } from '../countries';
import { getFlag, setFlag } from '../store';
import { radius, space, type } from '../theme';
import { Button } from '../components/Button';
import { Palette, useTheme } from '../useTheme';

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
  if (!tab) return <View />;
  const { p, dark } = useTheme();
  const s = themed(p, dark);

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
  const fieldBg = dark ? p.surface : FIELD_BG;
  return (
    <View style={s.root}>
      <View style={s.card}>
        <Text style={s.h1}>{sent ? 'Enter code' : fresh ? 'Create Account' : 'Welcome back'}</Text>
        <Text style={s.sub}>
          {sent ? `We sent a 6-digit code to ${to.trim()}.`
            : fresh ? 'Join New Era to list your business and chat with customers.'
            : 'Sign in to your New Era account.'}
        </Text>

        {!sent ? (
          <>
            {mode === 'email' ? (
              <TextInput style={[s.field, { backgroundColor: fieldBg }]} placeholder="Email address" placeholderTextColor={p.bodyText}
                value={to} onChangeText={setTo} autoCapitalize="none"
                keyboardType="email-address" />
            ) : (
              <View style={[s.phoneBox, { backgroundColor: fieldBg }]}>
                <Text style={s.prefix}>+{dial}</Text>
                <View style={s.divider} />
                <TextInput style={[s.field, { flex: 1, marginBottom: 0, backgroundColor: 'transparent' }]}
                  placeholder="Phone number" placeholderTextColor={p.bodyText}
                  value={to} onChangeText={setTo} keyboardType="phone-pad" />
              </View>
            )}
            <Text onPress={() => { setMode(mode === 'email' ? 'phone' : 'email'); setTo(''); }}
              style={s.swap}>
              {mode === 'email' ? 'Use phone number instead' : 'Use email instead'}
            </Text>
            <Pressable onPress={() => setDrop(!drop)} style={[s.fieldRow, { backgroundColor: fieldBg }]}>
              <Text style={s.fieldT}>{COUNTRIES.find(c => c.code === country)?.name}</Text>
              {drop
                ? <ChevronUp size={20} color={p.bodyText} />
                : <ChevronDown size={20} color={p.bodyText} />}
            </Pressable>
            {drop && (
              <ScrollView style={[s.menu, { backgroundColor: fieldBg }]} nestedScrollEnabled>
                {COUNTRIES.map(c => {
                  const on = country === c.code;
                  return (
                    <Pressable key={c.code}
                      onPress={() => { setCountry(c.code); setDrop(false); }}
                      style={({ pressed }) => [s.optRow, pressed && s.optPressed, on && s.optSel]}>
                      <Text style={[s.opt, on && s.optOn]}>{c.name} · +{c.dial}</Text>
                      {on ? <Text style={s.tick}>✓</Text> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
            <Button pill title="Send code" onPress={request} />
            <Text style={s.swapLine}>
              {fresh ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={s.link} onPress={() => { setTab(fresh ? 'signin' : 'signup'); reset(); }}>
                {fresh ? 'Sign in here' : 'Sign up'}
              </Text>
            </Text>
          </>
        ) : (
          <>
            <TextInput style={[s.field, { backgroundColor: fieldBg }]} placeholder="6-digit code" placeholderTextColor={p.bodyText} value={code}
              onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
            <Button pill title="Verify" onPress={verify} />
            <Text style={s.swapLine}>
              No code yet? <Text style={s.link} onPress={request}>Resend code</Text>
            </Text>
            <Text style={s.swapLine}>
              Wrong address? <Text style={s.link} onPress={reset}>Start over</Text>
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const themed = (p: Palette, dark: boolean) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background, alignItems: 'center', justifyContent: 'center', padding: space.s5 },
  card: {
    width: '100%', maxWidth: 420, backgroundColor: p.surface,
    borderRadius: 28, padding: space.s6,
  },
  h1: { ...type.h1, fontSize: 26, color: p.ink, textAlign: 'center' },
  sub: { ...type.bodySm, color: p.bodyText, textAlign: 'center', marginTop: space.s2, marginBottom: space.s5 },
  field: {
    borderRadius: 24, height: 52, color: p.ink,
    paddingHorizontal: space.s5, fontSize: 16, marginBottom: space.s3,
  },
  fieldRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 24, height: 52,
    paddingHorizontal: space.s5, marginBottom: space.s4,
  },
  fieldT: { ...type.body, color: p.ink },
  phoneBox: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 24, height: 52,
    paddingLeft: space.s5, marginBottom: space.s3,
  },
  prefix: { ...type.body, color: p.ink, fontWeight: '600' },
  divider: { width: 1, height: 24, backgroundColor: p.line, marginHorizontal: space.s2 },
  menu: { borderRadius: 16, marginBottom: space.s3, maxHeight: 220, overflow: 'hidden' },
  opt: { ...type.body, color: p.ink, padding: space.s4, flex: 1 },
  optOn: { color: dark ? '#7B90D6' : '#2C3E7A', fontWeight: '700' },
  optRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optPressed: { backgroundColor: 'rgba(44,62,122,.06)' },
  optSel: { backgroundColor: 'rgba(44,62,122,.06)' },
  tick: { ...type.body, color: dark ? '#7B90D6' : '#2C3E7A', fontWeight: '700', paddingRight: space.s4 },
  swap: { ...type.bodySm, color: dark ? '#7B90D6' : '#2C3E7A', marginBottom: space.s3 },
  swapLine: { ...type.bodySm, color: p.bodyText, textAlign: 'center', marginTop: space.s4 },
  link: { color: dark ? '#7B90D6' : '#2C3E7A', fontWeight: '600' },
});
