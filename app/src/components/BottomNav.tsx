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
export function BizNav({ active, onTab, chatsDot }: { active: BizTab; onTab: (t: BizTab) => void; chatsDot?: boolean }) {
  const { p } = useTheme();
  const s = themed(p);
  const activeColor = p.primary;
  return (
    <View style={s.bar}>
      {BIZ_TABS.map(({ key, label, Icon }) => {
        const on = key === active;
        return (
          <Pressable key={key} onPress={() => onTab(key)} style={s.tab}>
            <View>
              <Icon size={24} color={on ? active : p.bodyText} />
              {chatsDot && key === 'bchats' ? <View style={s.dot} /> : null}
            </View>
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
export function BottomNav({ active, onTab, chatsDot }: { active: Tab; onTab: (t: Tab) => void; chatsDot?: boolean }) {
  const { p } = useTheme();
  const s = themed(p);
  const activeColor = p.primary;
  return (
    <View style={s.bar}>
      {TABS.map(({ key, label, Icon }) => {
        const on = key === active;
        return (
          <Pressable key={key} onPress={() => onTab(key)} style={s.tab}>
            <View>
              <Icon size={24} color={on ? active : p.bodyText} />
              {chatsDot && key === 'chats' ? <View style={s.dot} /> : null}
            </View>
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
  dot: {
    position: 'absolute', top: 0, right: -2, width: 10, height: 10,
    borderRadius: 5, backgroundColor: C.error,
  },
});
