import { ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../api';
import { useAuth } from '../auth';
import { COUNTRIES } from '../countries';
import { C, radius, shadow, space, type } from '../theme';
import { Palette, useTheme } from '../useTheme';
import { Button } from '../components/Button';
import { SupportChat } from '../components/SupportChat';
import { Prohibited } from '../components/Prohibited';

// Settings (HLP-2 support scope: self-serve first). Account (email, phone,
// password), appearance, help, support contact for bugs/important issues,
// sign out, version.
export function Settings({ onClose, onHelp }: { onClose: () => void; onHelp: () => void }) {
  const { account, refresh, signOut } = useAuth();
  const { p, mode, setMode } = useTheme();
  const [chat, setChat] = useState(false);
  const [panel, setPanel] = useState<'password' | 'email' | 'phone' | null>(null);
  // password form
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  // change-contact forms: code goes to the NEW address, then confirm.
  const [newEmail, setNewEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneSent, setPhoneSent] = useState(false);
  const s = themed(p);
  const dial = COUNTRIES.find(c => c.code === (account?.country ?? 'NG'))?.dial ?? '';
  const toggle = (k: 'password' | 'email' | 'phone') => {
    setPanel(panel === k ? null : k);
  };

  const submitPassword = async () => {
    if (next.length < 8) { Alert.alert('Password too short', 'Use 8 or more characters.'); return; }
    setBusy(true);
    try {
      const r = await api.setPassword({ password: next, ...(account?.hasPassword ? { current } : {}) });
      await refresh();
      setCurrent('');
      setNext('');
      setPanel(null);
      Alert.alert('Saved', r.account.hasPassword ? 'Password is on — sign-in will ask for it after the code.' : 'Password saved.');
    } catch (e) {
      const m = String((e as Error).message || '');
      Alert.alert('Could not save', m.includes('current') ? 'Current password is wrong.' : 'Check the API is running, then retry.');
    } finally { setBusy(false); }
  };
  const sendEmailCode = async () => {
    if (!newEmail.trim()) { Alert.alert('Enter email', 'Type the new email address first.'); return; }
    setBusy(true);
    try {
      const r = await api.requestEmailChange(newEmail.trim());
      setEmailSent(true);
      if (r.devCode) Alert.alert('Dev code', r.devCode);
      else Alert.alert('Code sent', 'Enter the code sent to the new address.');
    } catch (e) {
      const m = String((e as Error).message || '');
      Alert.alert('Could not send', m.includes('409') ? 'That email is already in use.' : 'Check the address and retry.');
    } finally { setBusy(false); }
  };
  const confirmEmail = async () => {
    setBusy(true);
    try {
      await api.confirmEmailChange({ email: newEmail.trim(), code: emailCode });
      await refresh();
      setNewEmail('');
      setEmailCode('');
      setEmailSent(false);
      setPanel(null);
    } catch {
      Alert.alert('Could not change', 'Invalid or expired code — send a fresh one.');
    } finally { setBusy(false); }
  };
  const fullPhone = (raw: string) => `+${dial}${raw.trim().replace(/^0+/, '')}`;
  const sendPhoneCode = async () => {
    if (!newPhone.trim()) { Alert.alert('Enter phone', 'Type the new phone number first.'); return; }
    setBusy(true);
    try {
      const r = await api.requestPhoneChange(fullPhone(newPhone));
      setPhoneSent(true);
      if (r.devCode) Alert.alert('Dev code', r.devCode);
      else Alert.alert('Code sent', 'Enter the code sent to the new number.');
    } catch (e) {
      const m = String((e as Error).message || '');
      Alert.alert('Could not send', m.includes('409') ? 'That number is already in use.' : 'Check the number and retry.');
    } finally { setBusy(false); }
  };
  const confirmPhone = async () => {
    setBusy(true);
    try {
      await api.confirmPhoneChange({ phone: fullPhone(newPhone), code: phoneCode });
      await refresh();
      setNewPhone('');
      setPhoneCode('');
      setPhoneSent(false);
      setPanel(null);
    } catch {
      Alert.alert('Could not change', 'Invalid or expired code — send a fresh one.');
    } finally { setBusy(false); }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <ScrollView style={s.root} contentContainerStyle={s.inner}>
        <Text style={s.h1}>Settings</Text>

        <Text style={s.sec}>Account</Text>
        <View style={s.card}>
          <Text style={s.micro}>Signed in as</Text>
          <Text style={s.itemT}>{account?.email ?? 'No email set'}</Text>
          {account?.phone ? <Text style={[s.itemT, { marginTop: 2 }]}>{account.phone}</Text> : null}
          <Text style={[s.micro, { marginTop: space.s2 }]}>
            Password: {account?.hasPassword ? 'on — sign-in asks for it after the code' : 'off — code only'}
          </Text>
        </View>
        <Pressable onPress={() => toggle('password')} style={s.item}>
          <Text style={s.itemT}>{account?.hasPassword ? 'Change password' : 'Add a password (2nd step)'}</Text>
          <Text style={s.chev}>›</Text>
        </Pressable>
        {panel === 'password' && (
          <View style={s.card}>
            {account?.hasPassword ? (
              <TextInput style={s.field} placeholder="Current password" placeholderTextColor={p.bodyText}
                value={current} onChangeText={setCurrent} secureTextEntry autoCapitalize="none" />
            ) : null}
            <TextInput style={s.field} placeholder="New password (8+ characters)" placeholderTextColor={p.bodyText}
              value={next} onChangeText={setNext} secureTextEntry autoCapitalize="none" />
            <Button title={busy ? 'Saving…' : 'Save password'} onPress={submitPassword} disabled={busy} />
          </View>
        )}
        <Pressable onPress={() => toggle('email')} style={s.item}>
          <Text style={s.itemT}>Change email</Text>
          <Text style={s.chev}>›</Text>
        </Pressable>
        {panel === 'email' && (
          <View style={s.card}>
            {!emailSent ? (
              <>
                <TextInput style={s.field} placeholder="New email address" placeholderTextColor={p.bodyText}
                  value={newEmail} onChangeText={setNewEmail} autoCapitalize="none" keyboardType="email-address" />
                <Button title={busy ? 'Sending…' : 'Send code'} onPress={sendEmailCode} disabled={busy} />
              </>
            ) : (
              <>
                <Text style={s.micro}>Code sent to {newEmail.trim()}.</Text>
                <TextInput style={[s.field, { marginTop: space.s2 }]} placeholder="6-digit code" placeholderTextColor={p.bodyText}
                  value={emailCode} onChangeText={setEmailCode} keyboardType="number-pad" maxLength={6} />
                <Button title={busy ? 'Saving…' : 'Confirm new email'} onPress={confirmEmail} disabled={busy} />
              </>
            )}
          </View>
        )}
        <Pressable onPress={() => toggle('phone')} style={s.item}>
          <Text style={s.itemT}>Change phone number</Text>
          <Text style={s.chev}>›</Text>
        </Pressable>
        {panel === 'phone' && (
          <View style={s.card}>
            {!phoneSent ? (
              <>
                <View style={s.phoneBox}>
                  <Text style={s.prefix}>+{dial}</Text>
                  <View style={s.divider} />
                  <TextInput style={[s.field, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
                    placeholder="New phone number" placeholderTextColor={p.bodyText}
                    value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" />
                </View>
                <Button title={busy ? 'Sending…' : 'Send code'} onPress={sendPhoneCode} disabled={busy} />
              </>
            ) : (
              <>
                <Text style={s.micro}>Code sent to {fullPhone(newPhone)}.</Text>
                <TextInput style={[s.field, { marginTop: space.s2 }]} placeholder="6-digit code" placeholderTextColor={p.bodyText}
                  value={phoneCode} onChangeText={setPhoneCode} keyboardType="number-pad" maxLength={6} />
                <Button title={busy ? 'Saving…' : 'Confirm new number'} onPress={confirmPhone} disabled={busy} />
              </>
            )}
          </View>
        )}

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
        <Pressable onPress={() => setChat(true)} style={s.item}>
          <Text style={s.itemT}>Contact support</Text>
          <Text style={s.chev}>›</Text>
        </Pressable>

        <View style={{ height: space.s5 }} />
        <Button title="Sign out" variant="secondary" onPress={() => { signOut(); onClose(); }} />
        <View style={{ height: space.s2 }} />
        <Button title="Close" variant="tertiary" onPress={onClose} />
        <Text style={[s.micro, { textAlign: 'center', marginTop: space.s4 }]}>New Era · MVP beta · v1.0.0</Text>
      </ScrollView>
      {chat && <SupportChat onClose={() => setChat(false)} />}
    </Modal>
  );
}

// Help center & FAQ (HLP-1): guides first, humans only for bugs.
// Same questions as the website FAQ so both speak one language.
const FAQ: [string, string][] = [
  ['What is New Era?', 'New Era helps you discover businesses, products, and services and talk to businesses directly.'],
  ['Do I need the app to browse?', 'No. You can browse businesses and storefronts on the web. You only need an account when you want to start a chat.'],
  ['Can I create a store for my business?', 'Yes. You can create your storefront, add your products or services, and share your store with customers.'],
  ['Can customers contact me without installing New Era?', 'Yes. Customers who visit your shared storefront can start a chat on the web.'],
  ['Do I need a business registration document?', 'No. A business does not need business documents to go live.'],
  ['Is New Era only for products?', 'No. Businesses can list both products and services.'],
  ['Can I share my store?', 'Yes. Every business gets a shareable storefront link.'],
  ['How does New Era choose which businesses appear in Discover?', 'New Era focuses on relevance, location, freshness, availability, completeness, and responsiveness. Popularity metrics such as followers and likes are not used.'],
];

export function Help({ onClose }: { onClose: () => void }) {
  const { p } = useTheme();
  const [open, setOpen] = useState<number | null>(null);
  const [rules, setRules] = useState(false);
  const s = themed(p);
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <ScrollView style={s.root} contentContainerStyle={s.colWrap}>
      <View style={s.col}>
        <Text style={s.h1}>Help center</Text>
        {FAQ.map(([q, a], j) => (
          <View key={j} style={s.itemWrap}>
            <Pressable onPress={() => setOpen(open === j ? null : j)} style={s.itemRow}>
              <Text style={s.itemT}>{q}</Text>
              {open === j
                ? <ChevronUp size={20} color={p.bodyText} />
                : <ChevronDown size={20} color={p.bodyText} />}
            </Pressable>
            {open === j && <Text style={s.answer}>{a}</Text>}
          </View>
        ))}
        <View style={{ height: space.s2 }} />
        <Button title="Prohibited items & conduct" variant="secondary" onPress={() => setRules(true)} />
        <View style={{ height: space.s4 }} />
        <Button title="Close" variant="secondary" onPress={onClose} />
      </View>
      </ScrollView>
      {rules && <Prohibited onClose={() => setRules(false)} />}
    </Modal>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background },
  inner: { padding: space.s5 },
  colWrap: { flexGrow: 1, alignItems: 'center' },
  col: { width: '100%', maxWidth: 720, padding: space.s5 },
  h1: { ...type.h1, color: p.ink, marginBottom: space.s4 },
  sec: { ...type.h3, color: p.ink, marginTop: space.s4, marginBottom: space.s2 },
  micro: { ...type.micro, color: p.bodyText, marginTop: space.s2 },
  row: { flexDirection: 'row', gap: space.s2 },
  opt: {
    paddingVertical: space.s2, paddingHorizontal: space.s4, borderWidth: 1,
    borderColor: p.lineStrong, borderRadius: radius.md, color: p.bodyText, overflow: 'hidden',
  },
  optOn: { borderColor: p.primary, color: p.primary, fontWeight: '700' },
  card: {
    backgroundColor: p.surface, borderRadius: radius.lg, padding: space.s4,
    marginBottom: space.s2, ...shadow.md,
  },
  field: {
    backgroundColor: p.background, borderWidth: 1, borderColor: p.lineStrong, color: p.ink,
    borderRadius: radius.md, height: 48, paddingHorizontal: space.s4, fontSize: 16, marginBottom: space.s3,
  },
  phoneBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: p.background,
    borderWidth: 1, borderColor: p.lineStrong, borderRadius: radius.md, height: 48,
    paddingLeft: space.s4, marginBottom: space.s3,
  },
  prefix: { ...type.body, color: p.ink, fontWeight: '600' },
  divider: { width: 1, height: 24, backgroundColor: p.line, marginHorizontal: space.s2 },
  itemWrap: {
    backgroundColor: p.surface, borderRadius: radius.lg, padding: space.s4,
    marginBottom: space.s2, ...shadow.md,
  },
  item: {
    backgroundColor: p.surface, borderRadius: radius.lg, padding: space.s4,
    marginBottom: space.s2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    ...shadow.sm,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  answer: { ...type.bodySm, color: p.bodyText, marginTop: space.s2 },
  itemT: { ...type.body, color: p.ink, flex: 1 },
  chev: { fontSize: 20, color: p.bodyText },
});
