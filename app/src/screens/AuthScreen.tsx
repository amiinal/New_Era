import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../api';
import { useAuth } from '../auth';
import { C, radius, space, type } from '../theme';
import { Button } from '../components/Button';

// Step 2: email-first OTP (phone kept), explicit country, mode remembered.
const COUNTRIES = ['NG', 'GH', 'KE'];
export function AuthScreen() {
  const { signIn } = useAuth();
  const [to, setTo] = useState('');
  const [code, setCode] = useState('');
  const [country, setCountry] = useState('NG');
  const [sent, setSent] = useState(false);

  const request = async () => {
    try {
      const body = to.includes('@') ? { email: to } : { phone: to };
      const r = await api.requestCode(body);
      setSent(true);
      if (r.devCode) Alert.alert('Dev code', r.devCode);
    } catch { Alert.alert('Error', 'Rate-limited or invalid. Wait a minute.'); }
  };
  const verify = async () => {
    try { await signIn(to, code, country); }
    catch (e) {
      const m = String((e as Error).message || '');
      Alert.alert('Could not sign in', m.startsWith('5')
        ? 'Server or database error — check the API and database, then retry.'
        : 'Invalid or expired code — request one code and enter it within 10 minutes.');
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.h1}>Sign in</Text>
      <TextInput style={styles.input} placeholder="email or phone" value={to} onChangeText={setTo}
        autoCapitalize="none" keyboardType="email-address" />
      <Button title="Send code" onPress={request} />
      {sent && (
        <>
          <TextInput style={[styles.input, { marginTop: space.s4 }]} placeholder="6-digit code"
            value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
          <View style={styles.row}>
            {COUNTRIES.map(c => (
              <Text key={c} onPress={() => setCountry(c)}
                style={[styles.ctry, country === c && styles.ctryOn]}>{c}</Text>
            ))}
          </View>
          <Button title="Verify" onPress={verify} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background, padding: space.s5 },
  h1: { ...type.h1, color: C.ink, marginBottom: space.s5 },
  input: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.lineStrong,
    borderRadius: radius.md, height: 48, paddingHorizontal: space.s4, fontSize: 16, marginBottom: space.s3,
  },
  row: { flexDirection: 'row', gap: space.s3, marginVertical: space.s4 },
  ctry: { padding: space.s3, borderWidth: 1, borderColor: C.lineStrong, borderRadius: radius.md, color: C.bodyText },
  ctryOn: { borderColor: C.primary, color: C.primary, fontWeight: '600' },
});
