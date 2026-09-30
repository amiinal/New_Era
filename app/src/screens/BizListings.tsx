import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, Listing } from '../api';
import { C, space, type } from '../theme';
import { Button } from '../components/Button';
import { ListingCard } from '../components/ListingCard';
import { ListingForm } from '../components/ListingForm';

// B2: own listings with one-tap availability (LST-5), edit, delete, add.
export function BizListings() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [items, setItems] = useState<Listing[] | null>(null);
  const [form, setForm] = useState<'add' | Listing | null>(null);
  const [avFor, setAvFor] = useState<Listing | null>(null);

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
    <View style={styles.root}>
      <View style={styles.head}>
        <Text style={styles.h1}>Listings</Text>
        <Button title="+ Add" onPress={() => setForm('add')} />
      </View>
      {items.length === 0 && <Text style={styles.micro}>No listings yet — add the first one.</Text>}
      {items.map(l => (
        <View key={l.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <ListingCard item={l} onPress={() => setForm(l)} />
          </View>
          <View style={styles.side}>
            <Pressable onPress={() => setAvFor(l)} style={styles.av}>
              <Text style={styles.avT}>{
                { in_stock: 'In stock', limited: 'Limited', sold_out: 'Sold out', made_to_order: 'Made to order' }[l.availability]
              } ›</Text>
            </Pressable>
            <Text onPress={() => remove(l)} style={styles.del}>Delete</Text>
          </View>
        </View>
      ))}
      {!!form && !!businessId && (
        <ListingForm businessId={businessId}
          initial={form === 'add' ? null : form}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); load(); }} />
      )}
      {!!avFor && (
        <Modal transparent animationType="fade" onRequestClose={() => setAvFor(null)}>
          <View style={styles.sheetWrap}>
            <View style={styles.sheet}>
              <Text style={styles.t}>Availability</Text>
              {(['in_stock', 'limited', 'sold_out', 'made_to_order'] as const).map(a => (
                <Text key={a} onPress={() => avFor && setAv(avFor, a)}
                  style={[styles.opt, avFor.availability === a && styles.optOn]}>
                  {{ in_stock: 'In stock', limited: 'Limited', sold_out: 'Sold out', made_to_order: 'Made to order' }[a]}
                  {avFor.availability === a ? ' ✓' : ''}
                </Text>
              ))}
              <Text onPress={() => setAvFor(null)} style={[styles.opt, { textAlign: 'center' }]}>Cancel</Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background, padding: space.s4 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.s4 },
  h1: { ...type.h1, color: C.ink },
  micro: { ...type.micro, color: C.bodyText },
  row: { flexDirection: 'row', gap: space.s3, marginBottom: space.s3 },
  side: { width: 110, gap: space.s2 },
  av: { backgroundColor: C.surface, borderRadius: 8, padding: space.s3 },
  avT: { ...type.bodySm, color: C.primary, fontWeight: '600' },
  del: { ...type.bodySm, color: C.error, padding: space.s2 },
  sheetWrap: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,.4)', justifyContent: 'flex-end',
  },
  sheet: { backgroundColor: C.surface, borderRadius: 16, padding: space.s4 },
  t: { ...type.h3, color: C.ink },
  opt: { ...type.body, color: C.ink, paddingVertical: space.s3 },
  optOn: { color: C.primary, fontWeight: '700' },
});
