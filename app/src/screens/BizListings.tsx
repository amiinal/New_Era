import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api, img, Listing } from '../api';
import { C, radius, space, type } from '../theme';
import { Button } from '../components/Button';
import { ListingForm } from '../components/ListingForm';
import { TabHead } from '../components/TabHead';
import { DrawerRoute } from '../components/Drawer';
import { Palette, useTheme } from '../useTheme';

// B2: own listings with one-tap availability (LST-5), edit, delete, add.
export function BizListings({ dRoutes, dActive, onDNav }: {
  dRoutes: DrawerRoute[]; dActive: DrawerRoute; onDNav: (r: DrawerRoute) => void;
}) {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [items, setItems] = useState<Listing[] | null>(null);
  const [form, setForm] = useState<'add' | Listing | null>(null);
  const [avFor, setAvFor] = useState<Listing | null>(null);
  const { p, dark } = useTheme();
  const s = themed(p, dark);
  const link = dark ? '#7B90D6' : '#2C3E7A';

  const load = async () => {
    try {
      const list = await api.myBusinesses();
      if (!list[0]) { setBusinessId(null); setItems([]); return; }
      setBusinessId(list[0].id);
      setItems(await api.bizListings(list[0].id));
    } catch { setItems([]); }
  };
  useEffect(() => { load(); }, [businessId]);
  if (items === null) return <ActivityIndicator style={{ marginTop: space.s8 }} />;

  const setAv = async (l: Listing, next: Listing['availability']) => {
    setAvFor(null);
    try {
      await api.patchListing(l.id, { availability: next });
      setItems((items ?? []).map(x => (x.id === l.id ? { ...x, availability: next } : x)));
    } catch { Alert.alert('Could not update', 'Check connection, then retry.'); }
  };
  const remove = (l: Listing) => {
    Alert.alert('Delete listing?', `"${l.title}" will be removed.`, [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.deleteListing(l.id); setItems(items.filter(x => x.id !== l.id)); }
        catch { Alert.alert('Could not delete', 'Check connection, then retry.'); }
      } },
    ]);
  };

  return (
    <ScrollView style={s.root}>
      <TabHead title="Listings" drawer="business" routes={dRoutes} active={dActive} onNav={onDNav} right={<Button title="+ Add" onPress={() => setForm('add')} />} />
      {items.length === 0 && <Text style={s.micro}>No listings yet — add the first one.</Text>}
      {items.map(l => (
        <Pressable key={l.id} onPress={() => setForm(l)} style={s.rowCard}>
          {l.photos[0] ? (
            <Image source={{ uri: img(l.photos[0]) }} style={s.thumb} />
          ) : (
            <View style={[s.thumb, { backgroundColor: p.line }]} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.t} numberOfLines={1}>{l.title}</Text>
            <Text style={s.micro}>{l.price ?? 'On request'} · {{
              in_stock: 'In stock', limited: 'Limited',
              sold_out: 'Sold out', made_to_order: 'Made to order',
            }[l.availability]}</Text>
          </View>
          <View style={s.side}>
            <Pressable onPress={() => setAvFor(l)} style={s.av}>
              <Text style={[s.avT, { color: link }]}>Set ›</Text>
            </Pressable>
            <Text onPress={() => remove(l)} style={s.del}>Delete</Text>
          </View>
        </Pressable>
      ))}
      {!!form && !!businessId && (
        <ListingForm businessId={businessId}
          initial={form === 'add' ? null : form}
          onClose={() => setForm(null)}
          onSaved={(saved, isNew) => {
            setForm(null); load();
            // STA-5: product-linked status with update text — no caption
            // screen needed; customers see what it is immediately.
            const sym = ({ NGN: '₦', GHS: 'GH₵', KES: 'KSh' } as Record<string, string>)[saved.currency] ?? '';
            const update = `${isNew ? 'New arrival' : 'Back in stock'}: ${saved.title}${
              saved.price ? ` · ${sym}${saved.price}` : ''}`;
            Alert.alert('Share as status?', `"${update}" as a 24h update?`, [
              { text: 'Skip' },
              { text: 'Share', onPress: async () => {
                try {
                  await api.postStatus(businessId, {
                    kind: 'photo', imageKey: saved.photos[0], caption: update,
                  });
                  Alert.alert('Posted', 'Status live for 24 hours.');
                } catch (e) { Alert.alert('Could not post', String((e as Error).message || 'Check connection.')); }
              } },
            ]);
          }} />
      )}
      {!!avFor && (
        <Modal transparent animationType="fade" onRequestClose={() => setAvFor(null)}>
          <View style={s.sheetWrap}>
            <View style={s.sheet}>
              <Text style={s.t}>Availability</Text>
              {(['in_stock', 'limited', 'sold_out', 'made_to_order'] as const).map(a => (
                <Text key={a} onPress={() => avFor && setAv(avFor, a)}
                  style={[s.opt, avFor.availability === a && s.optOn]}>
                  {{ in_stock: 'In stock', limited: 'Limited', sold_out: 'Sold out', made_to_order: 'Made to order' }[a]}
                  {avFor.availability === a ? ' ✓' : ''}
                </Text>
              ))}
              <Text onPress={() => setAvFor(null)} style={[s.opt, { textAlign: 'center' }]}>Cancel</Text>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const themed = (p: Palette, dark: boolean) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background, padding: space.s4 },
  micro: { ...type.micro, color: p.bodyText },
  rowCard: {
    flexDirection: 'row', gap: space.s3, alignItems: 'center',
    backgroundColor: p.surface, borderRadius: radius.lg, padding: space.s3, marginBottom: space.s3,
  },
  thumb: { width: 64, height: 64, borderRadius: radius.md },
  side: { width: 110, gap: space.s2 },
  av: { backgroundColor: p.surface, borderRadius: 8, padding: space.s3 },
  avT: { ...type.bodySm, fontWeight: '600' },
  del: { ...type.bodySm, color: C.error, padding: space.s2 },
  sheetWrap: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,.4)', justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: p.surface, borderRadius: 16, padding: space.s4,
    width: '100%', maxWidth: 420, alignSelf: 'center',
  },
  t: { ...type.h3, color: p.ink },
  opt: { ...type.body, color: p.ink, paddingVertical: space.s3 },
  optOn: { color: dark ? '#7B90D6' : '#2C3E7A', fontWeight: '700' },
});
