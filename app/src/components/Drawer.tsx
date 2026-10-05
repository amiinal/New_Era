import {
  Compass, CircleHelp, MessageCircle, Newspaper, Package, Settings as SettingsIcon,
  Store, UserRound, X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, Business } from '../api';
import { radius, space, type } from '../theme';
import { Avatar } from './Avatar';
import { BizProfile } from './BizProfile';
import { Help, Settings } from '../screens/Settings';
import { ProfileSheet } from './ProfileSheet';
import { Palette, useTheme } from '../useTheme';

export type DrawerRoute =
  | 'mybiz' | 'blistings' | 'bchats' | 'bupdates' | 'bdiscover'
  | 'chats' | 'updates' | 'discover';

const ICONS = {
  mybiz: Store, blistings: Package, bchats: MessageCircle, bupdates: Newspaper,
  bdiscover: Compass, chats: MessageCircle, updates: Newspaper, discover: Compass,
};
const LABELS: Record<DrawerRoute, string> = {
  mybiz: 'My Business', blistings: 'Listings', bchats: 'Chats', bupdates: 'Updates',
  bdiscover: 'Discover', chats: 'Chats', updates: 'Updates', discover: 'Discover',
};

// Left slide-in panel: brand, business card (biz mode), icon nav rows
// with active pill, Settings + Help pinned at the bottom.
export function Drawer({ mode, routes, active, onNav, onClose }: {
  mode: 'business' | 'customer';
  routes: DrawerRoute[];
  active: DrawerRoute;
  onNav: (r: DrawerRoute) => void;
  onClose: () => void;
}) {
  const { p, dark } = useTheme();
  const s = themed(p, dark);
  const activeC = dark ? '#7B90D6' : '#2C3E7A';
  const [page, setPage] = useState<'menu' | 'profile' | 'cprofile' | 'settings' | 'help'>('menu');
  const [biz, setBiz] = useState<Business | null>(null);
  useEffect(() => {
    if (mode === 'business') api.myBusinesses().then(l => setBiz(l[0] ?? null)).catch(() => {});
  }, [mode]);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.scrim} onPress={onClose}>
        <Pressable style={s.panel} onPress={() => {}}>
          <Text style={s.brand}>New Era</Text>
          {mode === 'business' && biz && (
            <View style={s.bizcard}>
              <Avatar name={biz.name} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={s.bizN} numberOfLines={1}>{biz.name}</Text>
                <Text style={s.micro}>{biz.category}</Text>
              </View>
            </View>
          )}
          {routes.map(r => {
            const Icon = ICONS[r];
            const on = r === active;
            return (
              <Pressable key={r} onPress={() => { onClose(); onNav(r); }}
                style={[s.row, on && s.rowOn]}>
                <Icon size={20} color={on ? activeC : p.bodyText} />
                <Text style={[s.label, on && { color: activeC, fontWeight: '700' as const }]}>{LABELS[r]}</Text>
              </Pressable>
            );
          })}
          <View style={{ flex: 1 }} />
          {mode === 'business' ? (
            <Pressable onPress={() => setPage('profile')} style={s.row}>
              <Store size={20} color={p.bodyText} />
              <Text style={s.label}>Business profile</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => setPage('cprofile')} style={s.row}>
              <UserRound size={20} color={p.bodyText} />
              <Text style={s.label}>Profile</Text>
            </Pressable>
          )}
          <Pressable onPress={() => setPage('settings')} style={s.row}>
            <SettingsIcon size={20} color={p.bodyText} />
            <Text style={s.label}>Settings</Text>
          </Pressable>
          <Pressable onPress={() => setPage('help')} style={s.row}>
            <CircleHelp size={20} color={p.bodyText} />
            <Text style={s.label}>Help & FAQ</Text>
          </Pressable>
          <Pressable onPress={onClose} style={s.row}>
            <X size={20} color={p.bodyText} />
            <Text style={s.label}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
      {page === 'profile' && <BizProfile onClose={() => setPage('menu')} onSaved={() => setPage('menu')} />}
      {page === 'cprofile' && <ProfileSheet onClose={() => setPage('menu')} onSaved={() => setPage('menu')} />}
      {page === 'settings' && <Settings onClose={() => setPage('menu')} onHelp={() => setPage('help')} />}
      {page === 'help' && <Help onClose={() => setPage('menu')} />}
    </Modal>
  );
}

const themed = (p: Palette, dark: boolean) => StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,.4)', alignItems: 'flex-start' },
  panel: {
    width: '82%', maxWidth: 340, height: '100%', backgroundColor: p.surface,
    padding: space.s5, borderTopRightRadius: radius.lg, borderBottomRightRadius: radius.lg,
  },
  brand: { ...type.h1, fontSize: 22, color: dark ? '#7B90D6' : '#2C3E7A', marginBottom: space.s4 },
  bizcard: {
    flexDirection: 'row', gap: space.s3, alignItems: 'center',
    backgroundColor: p.background, borderRadius: radius.md, padding: space.s3, marginBottom: space.s3,
  },
  bizN: { ...type.body, color: p.ink, fontWeight: '600' },
  micro: { ...type.micro, color: p.bodyText },
  row: { flexDirection: 'row', gap: space.s3, alignItems: 'center', paddingVertical: space.s3, paddingHorizontal: space.s3, borderRadius: radius.md },
  rowOn: { backgroundColor: dark ? 'rgba(123,144,214,.14)' : 'rgba(44,62,122,.07)' },
  label: { ...type.body, color: p.bodyText },
  item: { ...type.body, color: p.ink, paddingVertical: space.s3 },
});
