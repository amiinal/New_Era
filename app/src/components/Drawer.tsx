import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, space, type } from '../theme';
import { useTheme } from '../useTheme';
import { BizProfile } from './BizProfile';
import { Help, Settings } from '../screens/Settings';

// Side drawer (hamburger): business gets Business profile + Settings +
// Help; customers get Settings + Help. Slides in from the right.
export function Drawer({ mode, onClose }: { mode: 'business' | 'customer'; onClose: () => void }) {
  const { p } = useTheme();
  const s = themed(p);
  const [page, setPage] = useState<'menu' | 'profile' | 'settings' | 'help'>('menu');

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.scrim} onPress={onClose}>
        <Pressable style={s.panel} onPress={() => {}}>
          <Text style={s.h1}>Menu</Text>
          {mode === 'business' && (
            <Text style={s.item} onPress={() => setPage('profile')}>Business profile ›</Text>
          )}
          <Text style={s.item} onPress={() => setPage('settings')}>Settings ›</Text>
          <Text style={s.item} onPress={() => setPage('help')}>Help & FAQ ›</Text>
          <Text style={[s.item, s.close]} onPress={onClose}>Close</Text>
        </Pressable>
      </Pressable>
      {page === 'profile' && <BizProfile onClose={() => setPage('menu')} onSaved={() => setPage('menu')} />}
      {page === 'settings' && <Settings onClose={() => setPage('menu')} onHelp={() => setPage('help')} />}
      {page === 'help' && <Help onClose={() => setPage('menu')} />}
    </Modal>
  );
}

const themed = (p: import('../useTheme').Palette) => StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,.4)', alignItems: 'flex-end' },
  panel: {
    width: '82%', maxWidth: 340, height: '100%', backgroundColor: p.surface,
    padding: space.s5, borderTopLeftRadius: radius.lg, borderBottomLeftRadius: radius.lg,
  },
  h1: { ...type.h1, color: p.ink, marginBottom: space.s4 },
  item: { ...type.body, color: p.ink, paddingVertical: space.s4 },
  close: { color: p.bodyText, marginTop: space.s4 },
});
