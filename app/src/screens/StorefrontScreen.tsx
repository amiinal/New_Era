import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api, img, Storefront } from '../api';
import { C, radius, space, type } from '../theme';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { ListingCard } from '../components/ListingCard';
import { StatusViewer, statusLabel } from '../components/StatusViewer';

// Step 3/4/9: header + listings grid + certificates + report. No login needed.
export function StorefrontScreen({
  slug, onListing, onChat, onBack,
}: {
  slug: string; onListing: (id: string) => void;
  onChat: (businessId: string, listingId?: string, label?: string) => void; onBack: () => void;
}) {
  const [sf, setSf] = useState<Storefront | null | undefined>(undefined);
  const [menu, setMenu] = useState(false);
  const [sent, setSent] = useState(false);
  const [view, setView] = useState(false);

  const report = async (id: string) => {
    setMenu(false);
    try {
      await api.report({ targetType: 'profile', targetId: id, reason: 'Reported from storefront' });
      setSent(true);
    } catch { setSent(false); }
  };

  useEffect(() => { api.storefront(slug).then(setSf).catch(() => setSf(null)); }, [slug]);
  if (sf === undefined) return <ActivityIndicator style={styles.center} />;
  if (sf === null) return <Text style={styles.center}>Couldn't load this shop.</Text>;
  const { business: b, listings } = sf;

  return (
    <ScrollView style={styles.root}>
      {listings[0]?.photos[0] && <Image source={{ uri: img(listings[0].photos[0]) }} style={styles.cover} />}
      <View style={styles.card}>
        <View style={styles.row}>
          <Pressable onPress={() => setView(true)}><Avatar name={b.name} ring={sf.statuses.length > 0} /></Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>{b.name}</Text>
            <Text style={styles.meta}>{b.category} · {b.area ? `${b.area}, ` : ''}{b.city}</Text>
          </View>
          <Text onPress={() => setMenu(m => !m)} style={styles.kebab}>···</Text>
        </View>
        {menu && (
          <View style={styles.menu}>
            <Text onPress={() => report(b.id)} style={styles.menuItem}>Report storefront</Text>
          </View>
        )}
        {sent && <Text style={styles.note}>Thanks — our team will review this storefront.</Text>}
        <View style={styles.actions}>
          <View style={{ flex: 2 }}><Button title="Message" onPress={() => onChat(b.id, undefined, `Say hello to ${b.name}`)} /></View>
          <View style={{ flex: 1 }}><Button title="Share" variant="secondary" onPress={() => {}} /></View>
        </View>
      </View>

      <Text style={styles.sec}>Listings</Text>
      <View style={styles.grid}>
        {listings.map(item => (
          <View key={item.id} style={styles.cell}>
            <ListingCard item={item} onPress={() => onListing(item.id)} />
          </View>
        ))}
      </View>

      {sf.certificates.length > 0 && (
        <>
          <Text style={styles.sec}>Certificates</Text>
          {sf.certificates.map(c => (
            <View key={c.id} style={styles.cert}>
              <Image source={{ uri: img(c.photo) }} style={styles.certImg} />
              <View style={{ flex: 1 }}>
                <Text style={styles.certT}>{c.title}</Text>
                <Text style={styles.micro}>
                  {[c.issuer, c.year].filter(Boolean).join(' · ')}
                  {' · '}Self-reported — not verified by New Era
                </Text>
              </View>
            </View>
          ))}
        </>
      )}
      <Pressable onPress={onBack}><Text style={styles.link}>Discover more businesses</Text></Pressable>
      {view && (
        <StatusViewer
          items={sf.statuses.map(s => ({ ...s, label: statusLabel(s, b.name) }))}
          businessName={b.name} businessId={b.id}
          onClose={() => setView(false)}
          onMessage={(bid, label) => onChat(bid, undefined, label)} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, textAlign: 'center', marginTop: space.s8 },
  cover: { width: '100%', height: 220 },
  card: { backgroundColor: C.surface, borderRadius: radius.lg, margin: space.s4, padding: space.s4 },
  row: { flexDirection: 'row', gap: space.s3, alignItems: 'center' },
  h1: { ...type.h1, fontSize: 22, color: C.ink },
  meta: { ...type.micro, color: C.bodyText, marginTop: 4 },
  kebab: { fontSize: 20, color: C.bodyText, padding: space.s2, letterSpacing: 2 },
  menu: {
    position: 'absolute', top: 44, right: 12, backgroundColor: C.surface,
    borderRadius: 8, elevation: 4, zIndex: 10, minWidth: 180,
  },
  menuItem: { padding: space.s4, fontSize: 14, color: C.error },
  note: { ...type.micro, color: C.success, marginTop: space.s2 },
  actions: { flexDirection: 'row', gap: space.s2, marginTop: space.s4 },
  sec: { ...type.h3, color: C.ink, margin: space.s5, marginBottom: space.s2, marginHorizontal: space.s4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s3, paddingHorizontal: space.s4 },
  cell: { flexBasis: '47%', flexGrow: 1 },
  cert: { flexDirection: 'row', gap: space.s3, backgroundColor: C.surface, borderRadius: radius.lg, padding: space.s4, marginHorizontal: space.s4, marginBottom: space.s3, alignItems: 'center' },
  certImg: { width: 44, height: 44, borderRadius: radius.md },
  certT: { ...type.bodySm, fontWeight: '600', color: C.ink },
  micro: { ...type.micro, color: C.bodyText },
  link: { ...type.body, color: C.primary, textAlign: 'center', marginVertical: space.s6 },
});
