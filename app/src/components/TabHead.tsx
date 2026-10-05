import { Menu } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { img } from '../api';
import { useAuth } from '../auth';
import { C, space, type } from '../theme';
import { Avatar } from './Avatar';
import { Drawer } from './Drawer';
import { ProfileSheet } from './ProfileSheet';
import { Palette, useTheme } from '../useTheme';

// Static top-bar title. `drawer` adds the hamburger (sidebar) — business
// tabs show hamburger only, customer tabs show hamburger + profile.
export function TabHead({ title, right, drawer, avatar = true }: {
  title: string; right?: React.ReactNode; drawer?: 'business' | 'customer'; avatar?: boolean;
}) {
  const { account, refresh } = useAuth();
  const [prof, setProf] = useState(false);
  const { p } = useTheme();
  const s = themed(p);
  const [menu, setMenu] = useState(false);
  return (
    <>
      <View style={s.row}>
        <View style={s.left}>
          {!!drawer && (
            <Pressable onPress={() => setMenu(true)}>
              <Menu size={24} color={p.ink} />
            </Pressable>
          )}
          <Text style={s.h1}>{title}</Text>
        </View>
        <View style={s.right}>
          {right}
          {avatar && drawer !== 'business' && (
            <Pressable onPress={() => setProf(true)}>
              {account?.avatarKey
                ? <Image source={{ uri: img(account.avatarKey) }} style={s.me} />
                : <Avatar name={account?.email ?? account?.phone ?? '?'} size={36} />}
            </Pressable>
          )}
        </View>
      </View>
      {prof && <ProfileSheet onClose={() => setProf(false)} onSaved={() => { setProf(false); refresh(); }} />}
      {menu && !!drawer && <Drawer mode={drawer} onClose={() => setMenu(false)} />}
    </>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.s4 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  h1: { ...type.h1, color: p.ink },
  right: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  me: { width: 36, height: 36, borderRadius: 18 },
});
