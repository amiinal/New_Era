import { Compass, MessageCircle, Newspaper, Package, Store } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { Palette, useTheme } from '../useTheme';

export type Tab = 'chats' | 'updates' | 'discover';
export type BizTab = 'mybiz' | 'blistings' | 'bchats' | 'bupdates' | 'bdiscover';
const BIZ_TABS: { key: BizTab; label: string; Icon: typeof Store }[] = [
  { key: 'mybiz', label: 'My Business', Icon: Store },
  { key: 'blistings', label: 'Listings', Icon: Package },
  { key: 'bchats', label: 'Chats', Icon: MessageCircle },
  { key: 'bupdates', label: 'Updates', Icon: Newspaper },
  { key: 'bdiscover', label: 'Discover', Icon: Compass },
];
// Business bottom nav: never the customer tabs (ACC-3 modes stay distinct).
export function BizNav({ active, onTab }: { active: BizTab; onTab: (t: BizTab) => void }) {
  const { p, dark } = useTheme();
  const s = themed(p);
  const activeColor = dark ? '#7B90D6' : C.primary;
  return (
    <View style={s.bar}>
      {BIZ_TABS.map(({ key, label, Icon }) => {
        const on = key === active;
        return (
          <Pressable key={key} onPress={() => onTab(key)} style={s.tab}>
            <Icon size={24} color={on ? active : p.bodyText} />
            <Text style={[s.label, on && { color: activeColor, fontWeight: '600' as const }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
const TABS: { key: Tab; label: string; Icon: typeof Compass }[] = [
  { key: 'chats', label: 'Chats', Icon: MessageCircle },
  { key: 'updates', label: 'Updates', Icon: Newspaper },
  { key: 'discover', label: 'Discover', Icon: Compass },
];
// Customer bottom nav (§CUS-1): active tab in primary, unread dot in error.
export function BottomNav({ active, onTab }: { active: Tab; onTab: (t: Tab) => void }) {
  const { p, dark } = useTheme();
  const s = themed(p);
  const activeColor = dark ? '#7B90D6' : C.primary;
  return (
    <View style={s.bar}>
      {TABS.map(({ key, label, Icon }) => {
        const on = key === active;
        return (
          <Pressable key={key} onPress={() => onTab(key)} style={s.tab}>
            <Icon size={24} color={on ? active : p.bodyText} />
            <Text style={[s.label, on && { color: activeColor, fontWeight: '600' as const }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: p.surface, borderTopWidth: 1, borderTopColor: p.line },
  tab: { flex: 1, alignItems: 'center', paddingTop: 10, paddingBottom: 18 },
  label: { fontSize: 12, color: p.bodyText },
});
