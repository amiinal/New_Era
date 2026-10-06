import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import { api } from '../api';
import { useAuth } from '../auth';
import { COUNTRIES } from '../countries';
import { getFlag, setFlag } from '../store';
import { radius, shadow, space, type } from '../theme';
import { Button } from '../components/Button';
import { Palette, useTheme } from '../useTheme';

const FIELD_BG = '#F2F3F5'; // soft pill fill (auth only)

// Sleek card auth, no logo. Fresh installs see Sign up first; returning
// users see Sign in (remembered on-device). Email-only OTP (phone sign-up
// removed for MVP — see PRD decision log); country stays for Discover scope.
// Accounts with a password ask for it after the code (2nd step).
export function AuthScreen() {
  const { signIn, completePassword, applySession, pendingTo } = useAuth();
  const [tab, setTab] = useState<'signup' | 'signin' | null>(null);
  const [to, setTo] = useState(pendingTo);
  const [code, setCode] = useState('');
  const [country, setCountry] = useState('NG');
  const [drop, setDrop] = useState(false);
  const [stage, setStage] = useState<'contact' | 'code' | 'password' | 'reset'>('contact');
  const [pendingId, setPendingId] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    getFlag('returning').then(v => setTab(v ? 'signin' : 'signup'));
  }, []);
  if (!tab) return <View />;
  const { p, dark } = useTheme();
  const s = themed(p);

  const reset = () => { setCode(''); setPassword(''); setResetCode(''); setNewPassword(''); setStage('contact'); };

  const request = async () => {
    if (!to.trim()) { Alert.alert('Enter email', 'We need somewhere to send the code.'); return; }
    try {
      const r = await api.requestCode({ email: to.trim() });
      setStage('code');
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
      const r = await signIn(to.trim(), code, country);
      await setFlag('returning', '1');
      if (r.needsPassword && r.accountId) {
        setPendingId(r.accountId);
        setPassword('');
        setStage('password');
      }
    } catch (e) {
      const m = String((e as Error).message || '');
      Alert.alert('Could not sign in', m.startsWith('5')
        ? 'Server or database error — check the API and database, then retry.'
        : 'Invalid or expired code — request one code and enter it within 10 minutes.');
    }
  };
  const submitPassword = async () => {
    if (!password) { Alert.alert('Enter password', 'Type the password you set for this account.'); return; }
    try {
      await completePassword(pendingId, password);
      await setFlag('returning', '1');
    } catch {
      Alert.alert('Wrong password', 'Try again, or tap Forgot password below to reset it.');
    }
  };
  const forgot = async () => {
    try {
      const r = await api.forgotPassword({ email: to.trim() });
      setResetCode('');
      setNewPassword('');
      setStage('reset');
      if (r.devCode) Alert.alert('Dev code', r.devCode);
      else Alert.alert('Code sent', 'Check your email for the reset code.');
    } catch {
      Alert.alert('Could not send', 'Check the API is running, then retry.');
    }
  };
  const submitReset = async () => {
    if (newPassword.length < 8) { Alert.alert('Password too short', 'Use 8 or more characters.'); return; }
    try {
      const r = await api.resetPassword({ email: to.trim(), code: resetCode, password: newPassword });
      await applySession(r.token, r.account);
      await setFlag('returning', '1');
    } catch (e) {
      const m = String((e as Error).message || '');
      Alert.alert('Could not reset', m.includes('8+')
        ? 'Use 8 or more characters.'
        : 'Invalid or expired code — request a fresh one.');
    }
  };

  const fresh = tab === 'signup';
  const fieldBg = dark ? p.surface : FIELD_BG;
  const title = stage === 'password' ? 'Enter password'
    : stage === 'reset' ? 'Reset password'
    : stage === 'code' ? 'Enter code'
    : fresh ? 'Create Account' : 'Welcome back';
  return (
    <View style={s.root}>
      <View style={s.card}>
        <Text style={s.h1}>{title}</Text>
        <Text style={s.sub}>
          {stage === 'code' ? `We sent a 6-digit code to ${to.trim()}.`
            : stage === 'password' ? 'This account has a password — enter it to finish signing in.'
            : stage === 'reset' ? `We sent a reset code to ${to.trim()}.`
            : fresh ? 'Join New Era to list your business and chat with customers.'
            : 'Sign in to your New Era account.'}
        </Text>

        {stage === 'contact' && (
          <>
            <TextInput style={[s.field, { backgroundColor: fieldBg }]} placeholder="Email address" placeholderTextColor={p.bodyText}
              value={to} onChangeText={setTo} autoCapitalize="none"
              keyboardType="email-address" />
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
                      {on ? <Check size={20} color={s.tick.color as string} /> : null}
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
        )}
        {stage === 'code' && (
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
        {stage === 'password' && (
          <>
            <TextInput style={[s.field, { backgroundColor: fieldBg }]} placeholder="Password" placeholderTextColor={p.bodyText}
              value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
            <Button pill title="Sign in" onPress={submitPassword} />
            <Text style={s.swapLine}>
              Forgot password? <Text style={s.link} onPress={forgot}>Reset with a code</Text>
            </Text>
            <Text style={s.swapLine}>
              Wrong address? <Text style={s.link} onPress={reset}>Start over</Text>
            </Text>
          </>
        )}
        {stage === 'reset' && (
          <>
            <TextInput style={[s.field, { backgroundColor: fieldBg }]} placeholder="Reset code" placeholderTextColor={p.bodyText}
              value={resetCode} onChangeText={setResetCode} keyboardType="number-pad" maxLength={6} />
            <TextInput style={[s.field, { backgroundColor: fieldBg }]} placeholder="New password (8+ characters)" placeholderTextColor={p.bodyText}
              value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" />
            <Button pill title="Reset & sign in" onPress={submitReset} />
            <Text style={s.swapLine}>
              No code yet? <Text style={s.link} onPress={forgot}>Resend code</Text>
            </Text>
            <Text style={s.swapLine}>
              <Text style={s.link} onPress={() => setStage('password')}>Back to password</Text>
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background, alignItems: 'center', justifyContent: 'center', padding: space.s5 },
  card: {
    width: '100%', maxWidth: 420, backgroundColor: p.surface,
    borderRadius: 28, padding: space.s6, ...shadow.md,
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
  menu: { borderRadius: 16, marginBottom: space.s3, maxHeight: 220, overflow: 'hidden' },
  opt: { ...type.body, color: p.ink, padding: space.s4, flex: 1 },
  optOn: { color: p.primary, fontWeight: '700' },
  optRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optPressed: { backgroundColor: 'rgba(44,62,122,.06)' },
  optSel: { backgroundColor: 'rgba(44,62,122,.06)' },
  tick: { ...type.body, color: p.primary, fontWeight: '700', paddingRight: space.s4 },
  swapLine: { ...type.bodySm, color: p.bodyText, textAlign: 'center', marginTop: space.s4 },
  link: { color: p.primary, fontWeight: '600' },
});
