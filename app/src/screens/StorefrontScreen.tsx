import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { api, img, Storefront } from '../api';
import { useAuth } from '../auth';
import { C, radius, space, type } from '../theme';
import { Palette, useTheme } from '../useTheme';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { FullImage } from '../components/FullImage';
import { ListingCard } from '../components/ListingCard';
import { Skeleton } from '../components/Skeleton';
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
  const [full, setFull] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  // Uniform grid rule: 2 columns on phones, 3 once the column is wide.
  // Cells stay equal — no stretched orphans.
  const wide = width > 700;
  const { account } = useAuth();
  const { p } = useTheme();
  const s = themed(p);

  const report = async (id: string) => {
    setMenu(false);
    try {
      await api.report({ targetType: 'profile', targetId: id, reason: 'Reported from storefront' });
      setSent(true);
    } catch { setSent(false); }
  };

  useEffect(() => { api.storefront(slug).then(setSf).catch(() => setSf(null)); }, [slug]);
  if (sf === undefined) return <View style={{ padding: space.s4 }}><Skeleton kind="card" /><Skeleton kind="card" /></View>;
  if (sf === null) return <Text style={s.center}>Couldn't load this shop.</Text>;
  const { business: b, listings } = sf;
  // ACC-7: owners get a customer preview — messaging their own store is off.
  const preview = !!account && account.id === b.ownerId;

  return (
    <ScrollView style={s.root}>
      {(b.coverKey || listings[0]?.photos[0]) && (
        <Image source={{ uri: img(b.coverKey || listings[0].photos[0]) }} style={s.cover} />
      )}
      <View style={s.card}>
        <View style={s.row}>
          <Pressable onPress={() => setView(true)}><Avatar name={b.name} ring={sf.statuses.length > 0} /></Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.h1}>{b.name}</Text>
            <Text style={s.meta}>{b.category} · {b.area ? `${b.area}, ` : ''}{b.city}</Text>
          </View>
          <Text onPress={() => setMenu(m => !m)} style={s.kebab}>···</Text>
        </View>
        {menu && (
          <View style={s.menu}>
            <Text onPress={() => report(b.id)} style={s.menuItem}>Report storefront</Text>
          </View>
        )}
        {sent && <Text style={s.note}>Thanks — our team will review this storefront.</Text>}
      <View style={s.actions}>
        <View style={{ flex: 2 }}>
          <Button title="Message" disabled={preview}
            onPress={() => onChat(b.id, undefined, `Say hello to ${b.name}`)} />
        </View>
        <View style={{ flex: 1 }}><Button title="Share" variant="secondary" onPress={() => {}} /></View>
      </View>
      {preview && (
        <Text style={s.previewNote}>Customer preview — this is how others see your shop. Messaging is off here.</Text>
      )}
      </View>

      <Text style={s.sec}>Listings</Text>
      <View style={s.grid}>
        {listings.map(item => {
          const label = `About: ${item.title} · ${item.price ?? 'Price on request'}`;
          const full = () => item.photos[0] && setFull(img(item.photos[0]));
          return (
            <View key={item.id} style={[s.cell, wide && s.cellWide]}>
              <ListingCard item={item} onPress={full} onPhoto={full}
                onMessage={() => onChat(b.id, item.id, label)} />
            </View>
          );
        })}
      </View>

      {sf.certificates.length > 0 && (
        <>
          <Text style={s.sec}>Certificates</Text>
          {sf.certificates.map(c => (
            <View key={c.id} style={s.cert}>
              <Image source={{ uri: img(c.photo) }} style={s.certImg} />
              <View style={{ flex: 1 }}>
                <Text style={s.certT}>{c.title}</Text>
                <Text style={s.micro}>
                  {[c.issuer, c.year].filter(Boolean).join(' · ')}
                  {' · '}Self-reported — not verified by New Era
                </Text>
              </View>
            </View>
          ))}
        </>
      )}
      <Pressable onPress={onBack}><Text style={s.link}>Discover more businesses</Text></Pressable>
      <FullImage uri={full} onClose={() => setFull(null)} />
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

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background },
  center: { flex: 1, textAlign: 'center', marginTop: space.s8 },
  cover: { width: '100%', height: 220 },
  card: { backgroundColor: p.surface, borderRadius: radius.lg, margin: space.s4, padding: space.s4 },
  row: { flexDirection: 'row', gap: space.s3, alignItems: 'center' },
  h1: { ...type.h1, fontSize: 22, color: p.ink },
  meta: { ...type.micro, color: p.bodyText, marginTop: 4 },
  kebab: { fontSize: 20, color: p.bodyText, padding: space.s2, letterSpacing: 2 },
  menu: {
    position: 'absolute', top: 44, right: 12, backgroundColor: p.surface,
    borderRadius: 8, elevation: 4, zIndex: 10, minWidth: 180,
  },
  menuItem: { padding: space.s4, fontSize: 14, color: C.error },
  note: { ...type.micro, color: C.success, marginTop: space.s2 },
  previewNote: { ...type.micro, color: p.bodyText, marginTop: space.s2, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: space.s2, marginTop: space.s4 },
  sec: { ...type.h3, color: p.ink, margin: space.s5, marginBottom: space.s2, marginHorizontal: space.s4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s3, paddingHorizontal: space.s4 },
  cell: { flexBasis: '47%' },
  cellWide: { flexBasis: '31%' },
  cert: { flexDirection: 'row', gap: space.s3, backgroundColor: p.surface, borderRadius: radius.lg, padding: space.s4, marginHorizontal: space.s4, marginBottom: space.s3, alignItems: 'center' },
  certImg: { width: 44, height: 44, borderRadius: radius.md },
  certT: { ...type.bodySm, fontWeight: '600', color: p.ink },
  micro: { ...type.micro, color: p.bodyText },
  link: { ...type.body, color: C.primary, textAlign: 'center', marginVertical: space.s6 },
});
