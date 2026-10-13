import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { MoreVertical } from 'lucide-react-native';
import { api, img, SITE_URL, Storefront } from '../api';
import { useAuth } from '../auth';
import { C, radius, shadow, space, type } from '../theme';
import { Palette, useTheme } from '../useTheme';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { FullImage } from '../components/FullImage';
import { ReportDialog } from '../components/ReportDialog';
import { ListingCard } from '../components/ListingCard';
import { Skeleton } from '../components/Skeleton';
import { StatusViewer, statusLabel } from '../components/StatusViewer';

// Step 3/4/9: header + listings grid + certificates + report. No login needed.
export function StorefrontScreen({
  slug, onListing, onChat, onBack, onSignIn,
}: {
  slug: string; onListing: (id: string) => void;
  onChat: (businessId: string, listingId?: string, label?: string) => void; onBack: () => void;
  onSignIn?: () => void;
}) {
  const [sf, setSf] = useState<Storefront | null | undefined>(undefined);
  const [menu, setMenu] = useState(false);
  const [sent, setSent] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [view, setView] = useState(false);
  const [full, setFull] = useState<{ uris: string[]; at: number } | null>(null);
  // Dead photo keys (wiped uploads) must fall back to the brand fill,
  // never a blank hole. Reset per storefront.
  const [coverOk, setCoverOk] = useState(true);
  useEffect(() => { setCoverOk(true); }, [slug]);
  const { width } = useWindowDimensions();
  // Uniform grid rule: 2 columns on phones, 3 once the column is wide.
  // Cells stay equal — no stretched orphans.
  const wide = width > 700;
  const { account } = useAuth();
  const { p } = useTheme();
  const s = themed(p);

  // Share the business: system sheet on device, clipboard fallback on web.
  // The link points at the marketing site — it works without the app.
  // Share the business: system sheet on device, clipboard fallback on web.
  // The link points at the marketing site — it works without the app.
  const shareStore = async () => {
    const url = `${SITE_URL}/s/${slug}`;
    const copyFallback = async () => {
      try {
        await Clipboard.setStringAsync(url);
        Alert.alert('Link copied', 'Paste it anywhere — it works without the app.');
      } catch {
        Alert.alert('Could not share', url);
      }
    };
    try {
      const r = await Share.share({ message: url });
      if (r.action === Share.dismissedAction) await copyFallback();
    } catch {
      await copyFallback();
    }
  };

  const report = (id: string) => {
    setMenu(false);
    setMenu(false);
    if (!account) {
      Alert.alert('Sign in to report', 'We need your account so the team can follow up.');
      onSignIn?.();
      return;
    }
    setReporting(true);
  };

  useEffect(() => { api.storefront(slug).then(setSf).catch(() => setSf(null)); }, [slug]);
  if (sf === undefined) return <View style={{ padding: space.s4 }}><Skeleton kind="card" /><Skeleton kind="card" /></View>;
  if (sf === null) return <Text style={s.center}>Couldn't load this shop.</Text>;
  const { business: b, listings } = sf;
  // ACC-7: owners get a customer preview — messaging their own store is off.
  const preview = !!account && account.id === b.ownerId;

  const changeImage = (kind: 'coverKey' | 'logoKey') => async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (r.canceled || !r.assets[0]) return;
    try {
      const key = await api.uploadPhoto(
        r.assets[0].uri, `business/${b.id}/${kind === 'coverKey' ? 'cover' : 'logo'}-${Date.now()}.jpg`);
      await api.patchBusiness(b.id, { [kind]: key });
      api.storefront(slug).then(setSf).catch(() => {});
    } catch (e) {
      Alert.alert('Could not save', String((e as Error).message || 'Check connection.'));
    }
  };

  return (
    <ScrollView style={s.root}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={8} style={s.backRow}>
          <Text style={s.backT}>‹</Text>
        </Pressable>
      ) : null}
      {(b.coverKey || listings[0]?.photos[0]) ? (
        preview ? (
          <Pressable onPress={changeImage('coverKey')} style={s.coverWrap}>
            {coverOk ? (
              <Image source={{ uri: img(b.coverKey || listings[0].photos[0]) }} style={s.coverImg} onError={() => setCoverOk(false)} />
            ) : null}
          </Pressable>
        ) : coverOk ? (
          <View style={s.coverWrap}>
            <Image source={{ uri: img(b.coverKey || listings[0].photos[0]) }} style={s.coverImg} onError={() => setCoverOk(false)} />
          </View>
        ) : (
          <View style={s.coverWrap} />
        )
      ) : preview ? (
        <Pressable onPress={changeImage('coverKey')} style={s.coverWrap} />
      ) : (
        <View style={s.coverWrap} />
      )}
      <View style={s.card}>
        <View style={s.row}>
          {preview ? (
            <Pressable onPress={changeImage('logoKey')}><Avatar name={b.name} ring={sf.statuses.length > 0} uri={b.logoKey ? img(b.logoKey) : null} /></Pressable>
          ) : (
            <Pressable onPress={() => setView(true)}><Avatar name={b.name} ring={sf.statuses.length > 0} uri={b.logoKey ? img(b.logoKey) : null} /></Pressable>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.h1}>{b.name}</Text>
            <Text style={s.meta}>{b.category} · {b.area ? `${b.area}, ` : ''}{b.city}</Text>
            {!!b.bio && <Text style={s.micro}>{b.bio}</Text>}
          </View>
          <Pressable onPress={() => setMenu(m => !m)} style={s.kebab}>
            <MoreVertical size={20} color={p.bodyText} />
          </Pressable>
        </View>
        {menu && (
          <View style={s.menu}>
            <Text onPress={() => report(b.id)} style={s.menuItem}>Report storefront</Text>
          </View>
        )}
        {sent && <Text style={s.note}>Thanks — our team will review this storefront.</Text>}
        {reporting && (
          <ReportDialog targetType="profile" targetId={b.id} title="this storefront"
            onClose={() => setReporting(false)}
            onSent={() => { setReporting(false); setSent(true); }} />
        )}
      <View style={s.actions}>
        <View style={{ flex: 2 }}>
          <Button title="Message" disabled={preview}
            onPress={() => onChat(b.id, undefined, `Say hello to ${b.name}`)} />
        </View>
        <View style={{ flex: 1 }}><Button title="Share" variant="secondary" onPress={shareStore} /></View>
      </View>
      {preview && (
        <Text style={s.previewNote}>Customer preview — messaging is off. Tap the header or avatar to change them.</Text>
      )}
      </View>

      <Text style={s.sec}>Listings</Text>
      <View style={s.grid}>
        {listings.map(item => {
          const label = `About: ${item.title} · ${item.price ?? 'Price on request'}`;
          const viewAll = () => item.photos[0] && setFull({ uris: item.photos.map(u => img(u)), at: 0 });
          return (
            <View key={item.id} style={[s.cell, wide && s.cellWide]}>
              <ListingCard item={item} onPress={() => onListing(item.id)} onPhoto={viewAll}
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
      {full && <FullImage uris={full.uris} index={full.at} onClose={() => setFull(null)} />}
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
  backRow: {
    position: 'absolute', top: space.s3, left: space.s4, zIndex: 10,
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    backgroundColor: p.surface, ...shadow.sm,
  },
  backT: {
    fontSize: 24, color: p.primary, fontWeight: '600',
    lineHeight: 34, textAlign: 'center', textAlignVertical: 'center',
    includeFontPadding: false, marginTop: -2, marginLeft: -1,
  },
  center: { flex: 1, textAlign: 'center', marginTop: space.s8 },
  coverWrap: {
    height: 220, marginHorizontal: space.s4, borderRadius: radius.lg,
    overflow: 'hidden', backgroundColor: p.coverTint,
  },
  coverImg: { flex: 1 },
  card: { backgroundColor: p.surface, borderRadius: radius.lg, margin: space.s4, padding: space.s4, ...shadow.md },
  row: { flexDirection: 'row', gap: space.s3, alignItems: 'center' },
  h1: { ...type.h1, fontSize: 22, color: p.ink },
  meta: { ...type.micro, color: p.bodyText, marginTop: 4 },
  kebab: { padding: space.s2 },
  menu: {
    position: 'absolute', top: 44, right: 12, backgroundColor: p.surface,
    borderRadius: 8, elevation: 4, zIndex: 10, minWidth: 180,
  },
  menuItem: { padding: space.s4, fontSize: 14, color: C.error },
  note: { ...type.micro, color: C.success, marginTop: space.s2 },
  previewNote: { ...type.micro, color: p.bodyText, marginTop: space.s2, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: space.s2, marginTop: space.s4 },
  sec: { ...type.h3, color: p.ink, margin: space.s5, marginBottom: space.s2, marginHorizontal: space.s4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s3, paddingHorizontal: space.s4, alignItems: 'stretch' },
  cell: { flexBasis: '47%', alignSelf: 'stretch' },
  cellWide: { flexBasis: '31%', alignSelf: 'stretch' },
  cert: { flexDirection: 'row', gap: space.s3, backgroundColor: p.surface, borderRadius: radius.lg, padding: space.s4, marginHorizontal: space.s4, marginBottom: space.s3, alignItems: 'center', ...shadow.md },
  certImg: { width: 44, height: 44, borderRadius: radius.md },
  certT: { ...type.bodySm, fontWeight: '600', color: p.ink },
  micro: { ...type.micro, color: p.bodyText },
  link: { ...type.body, color: p.primary, textAlign: 'center', marginVertical: space.s6 },
});
