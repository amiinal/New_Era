import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { img } from '../api';
import { useAuth } from '../auth';
import { C, space, type } from '../theme';
import { Palette, useTheme } from '../useTheme';
import { Avatar } from './Avatar';
import { ProfileSheet } from './ProfileSheet';

// Static top-bar title with the profile at top-right on every tab.
export function TabHead({ title, right }: { title: string; right?: React.ReactNode }) {
  const { account, refresh } = useAuth();
  const [prof, setProf] = useState(false);
  const { p } = useTheme();
  const s = themed(p);
  return (
    <>
      <View style={s.row}>
        <Text style={s.h1}>{title}</Text>
        <View style={s.right}>
          {right}
          <Pressable onPress={() => setProf(true)}>
            {account?.avatarKey
              ? <Image source={{ uri: img(account.avatarKey) }} style={s.me} />
              : <Avatar name={account?.email ?? account?.phone ?? '?'} size={36} />}
          </Pressable>
        </View>
      </View>
      {prof && <ProfileSheet onClose={() => setProf(false)} onSaved={() => { setProf(false); refresh(); }} />}
    </>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.s4 },
  h1: { ...type.h1, color: p.ink },
  right: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  me: { width: 36, height: 36, borderRadius: 18 },
});
