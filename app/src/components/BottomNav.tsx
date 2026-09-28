import { Compass, MessageCircle, Newspaper } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';

export type Tab = 'chats' | 'updates' | 'discover';
const TABS: { key: Tab; label: string; Icon: typeof Compass }[] = [
  { key: 'chats', label: 'Chats', Icon: MessageCircle },
  { key: 'updates', label: 'Updates', Icon: Newspaper },
  { key: 'discover', label: 'Discover', Icon: Compass },
];
// Customer bottom nav (§CUS-1): active tab in primary, unread dot in error.
export function BottomNav({ active, onTab }: { active: Tab; onTab: (t: Tab) => void }) {
  return (
    <View style={styles.bar}>
      {TABS.map(({ key, label, Icon }) => {
        const on = key === active;
        return (
          <Pressable key={key} onPress={() => onTab(key)} style={styles.tab}>
            <Icon size={24} color={on ? C.primary : C.bodyText} />
            <Text style={[styles.label, on && styles.on]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.line },
  tab: { flex: 1, alignItems: 'center', paddingTop: 10, paddingBottom: 18 },
  label: { fontSize: 12, color: C.bodyText },
  on: { color: C.primary, fontWeight: '600' },
});
