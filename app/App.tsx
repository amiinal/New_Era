import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth';
import { Hibernate } from './src/components/Hibernate';
import { ThemeProvider } from './src/useTheme';
import { getFlag, setFlag } from './src/store';
import { Intro } from './src/components/Intro';
import { RoleSelect } from './src/screens/RoleSelect';
import { BizNav, BizTab, BottomNav, Tab } from './src/components/BottomNav';
import { DrawerRoute } from './src/components/Drawer';
import { C } from './src/theme';
import { useTheme } from './src/useTheme';
import { AuthScreen } from './src/screens/AuthScreen';
import { BusinessHome } from './src/screens/BusinessHome';
import { ChatScreen } from './src/screens/ChatScreen';
import { DiscoverScreen } from './src/screens/DiscoverScreen';
import { ListingScreen } from './src/screens/ListingScreen';
import { StorefrontScreen } from './src/screens/StorefrontScreen';
import { ChatsScreen, UpdatesScreen } from './src/screens/TabsScreens';
import { BizInbox, BizUpdates } from './src/screens/BizTabs';
import { BizListings } from './src/screens/BizListings';
import { api } from './src/api';
import { initSentry } from './src/sentry';

initSentry();

// Evergreen update link: always resolves to the newest published release.
const RELEASES_URL = 'https://github.com/amiinal/New_Era/releases/latest';

// Numeric dot-version compare (-1/0/1). Empty minimum never gates.
function isOutdated(have: string, min: string): boolean {
  if (!min) return false;
  const pa = have.split('.').map(Number), pb = min.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d < 0;
  }
  return false;
}

type Route =
  | { name: 'discover' } | { name: 'updates' } | { name: 'chats' }
  | { name: 'bizhome' } | { name: 'bupdates' } | { name: 'bchats' } | { name: 'blistings' } | { name: 'bdiscover' }
  | { name: 'store'; slug: string }
  | { name: 'listing'; id: string; from?: Route }
  | { name: 'chat'; threadId: string; context: string; from?: Route };

// State-based navigator (no router dep): customer tabs + drill-in stack.
function Shell() {
  const { account, mode, setAppMode, restoring, restored, refresh, signOut } = useAuth();
  const { p } = useTheme();
  const bg = { backgroundColor: p.background };
  const [route, setRoute] = useState<Route>({ name: 'discover' });
  const [roleChecked, setRoleChecked] = useState(false);
  const [needRole, setNeedRole] = useState(false);
  const [bizAuto, setBizAuto] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pausedMessage, setPausedMessage] = useState('');
  const [hasUnread, setHasUnread] = useState(false);
  // Role-first entry: guests browse as customers; auth happens at chat
  // (customer, resumed after) or immediately (business → onboarding).
  const [guestRole, setGuestRole] = useState<'customer' | null>(null);
  const [guestChecked, setGuestChecked] = useState(false);
  const [authIntent, setAuthIntent] = useState<{ mode: 'customer' | 'business' } | null>(null);
  const [pendingChat, setPendingChat] = useState<{ businessId: string; listingId?: string; label: string; from: Route } | null>(null);
  const [pendingRoute, setPendingRoute] = useState<Route | null>(null);
  const [restoreDone, setRestoreDone] = useState(false);

  useEffect(() => {
    getFlag('role:guest').then(v => {
      setGuestRole(v === 'customer' ? 'customer' : null);
      setGuestChecked(true);
    });
  }, []);

  // Kill switch: paused app shows the notice (reads stay, writes 503).
  // Update gate: builds older than the admin-set minimum get nudged to the
  // evergreen release page (sideloaded APKs have no store to do it).
  const [minVersion, setMinVersion] = useState('');
  const [updateLater, setUpdateLater] = useState(false);
  useEffect(() => {
    api.status()
      .then(s => { setPaused(s.maintenance); setPausedMessage(s.message); setMinVersion(s.minAppVersion || ''); })
      .catch(() => {});
  }, []);
  // Chat badge: dot the Chats tab while any thread has unread mail.
  useEffect(() => {
    if (!account) { setHasUnread(false); return; }
    let live = true;
    const check = async () => {
      try {
        const rows = await api.myThreads();
        if (live) setHasUnread(rows.some(t => t.unread > 0));
      } catch { /* keep stale */ }
    };
    check();
    const t = setInterval(check, 15000);
    return () => { live = false; clearInterval(t); };
  }, [account?.id]);

  // Post-auth landing: restored sessions resume the last screen;
  // fresh intents from the role-first flow win; legacy accounts without
  // a role flag fall back to the one-time picker.
  useEffect(() => {
    if (!account) return;
    (async () => {
      if (restored && !restoreDone) {
        setRestoreDone(true);
        setRoleChecked(true);
        if (!(await getFlag(`role:${account.id}`))) {
          await setFlag(`role:${account.id}`, account.lastMode);
        }
        const saved = await getFlag('lastRoute');
        if (saved) {
          try {
            const r = JSON.parse(saved) as Route;
            if (r && typeof r.name === 'string') {
              // Relaunch lands on tabs, never inside someone else's
              // store/chat — drill routes lose their context overnight.
              if (r.name === 'store' || r.name === 'listing' || r.name === 'chat') {
                setRoute({ name: account.lastMode === 'business' ? 'bizhome' : 'discover' } as Route);
              } else {
                setRoute(r);
              }
            }
          } catch { /* start fresh */ }
        }
        return;
      }
      if (authIntent) {
        const it = authIntent;
        setAuthIntent(null);
        await setFlag(`role:${account.id}`, it.mode);
        if (it.mode === 'business') {
          await setAppMode('business');
          setBizAuto(true);
          setRoute({ name: 'bizhome' });
        } else {
          setRoute({ name: 'discover' });
        }
      } else if (!(await getFlag(`role:${account.id}`))) {
        if (account.lastMode === 'business') {
          await setFlag(`role:${account.id}`, 'business');
        } else {
          setNeedRole(true);
        }
      }
      setRoleChecked(true);
      if (pendingChat) {
        const pc = pendingChat;
        setPendingChat(null);
        try {
          const t = await api.openThread(pc.businessId, pc.listingId);
          api.recordEvent('chat_started', { businessId: pc.businessId, ...(pc.listingId ? { listingId: pc.listingId } : {}) }).catch(() => {});
          setRoute({ name: 'chat', threadId: t.id, context: pc.label, from: pc.from });
        } catch {
          Alert.alert('Could not open chat', 'Check the API is running, then retry.');
        }
      } else if (pendingRoute) {
        const pr = pendingRoute;
        setPendingRoute(null);
        setRoute(pr);
      }
    })();
  }, [account?.id]);

  useEffect(() => {
    if (!account) { setRoleChecked(false); setNeedRole(false); setRestoreDone(false); }
  }, [account]);

  // Remember where you left off (restored on next launch).
  useEffect(() => {
    if (account) setFlag('lastRoute', JSON.stringify(route)).catch(() => {});
  }, [route]);
  // Loop health: one app_open per launch (guests included).
  useEffect(() => {
    api.recordEvent('app_open', {}).catch(() => {});
  }, []);
  // PWA installs: the browser fires appinstalled once per install.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const g = globalThis as { addEventListener?: (t: string, f: () => void) => void; removeEventListener?: (t: string, f: () => void) => void };
    const onInstalled = () => { api.recordEvent('pwa_install', {}).catch(() => {}); };
    g.addEventListener?.('appinstalled', onInstalled);
    return () => { g.removeEventListener?.('appinstalled', onInstalled); };
  }, []);

  // In-app back: drill screens return to where they came from, other tabs
  // return home. Only at home do we let the OS/browser exit the app.
  const goBack = () => {
    if (route.name === 'store') {
      setRoute(mode === 'business' ? { name: 'bizhome' } : { name: 'discover' });
      return true;
    }
    if (route.name === 'chat' || route.name === 'listing') {
      setRoute(route.from ?? (mode === 'business' ? { name: 'bizhome' } : { name: 'discover' }));
      return true;
    }
    const home: Route = mode === 'business' ? { name: 'bizhome' } : { name: 'discover' };
    if (route.name !== home.name) {
      setRoute(home);
      return true;
    }
    return false;
  };
  const backRef = useRef(goBack);
  backRef.current = goBack;
  // Native hardware back (S22 gesture/button).
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => backRef.current());
    return () => sub.remove();
  }, []);
  // Web: mirror the route into browser history so Back walks screens.
  // First paint replaces (no duplicate entry); later moves push.
  // A pop sets the route — suppress the push that would re-add it.
  const firstRoute = useRef(true);
  const suppressPush = useRef(false);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (firstRoute.current) {
      firstRoute.current = false;
      window.history.replaceState({ route }, '');
      return;
    }
    if (suppressPush.current) {
      suppressPush.current = false;
      return;
    }
    window.history.pushState({ route }, '');
  }, [route]);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onPop = (e: PopStateEvent) => {
      const r = (e.state as { route?: Route } | null)?.route;
      if (r && typeof r.name === 'string') {
        suppressPush.current = true;
        setRoute(r);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const openChat = async (businessId: string, listingId?: string, label?: string) => {
    // Guests verify first, then land straight in the conversation.
    if (!account) {
      setPendingChat({ businessId, listingId, label: label ?? 'New conversation', from: route });
      setAuthIntent({ mode: 'customer' });
      return;
    }
    try {
      const t = await api.openThread(businessId, listingId);
      api.recordEvent('chat_started', { businessId, ...(listingId ? { listingId } : {}) }).catch(() => {});
      setRoute({ name: 'chat', threadId: t.id, context: label ?? 'New conversation', from: route });
    } catch (e) {
      Alert.alert('Could not open chat', 'Check the API is running, then retry.');
    }
  };
  const pickGuest = async (m: 'customer' | 'business') => {
    await setFlag('role:guest', m);
    if (m === 'business') {
      setAuthIntent({ mode: 'business' });
    } else {
      setGuestRole('customer');
      setRoute({ name: 'discover' });
    }
  };
  // No account: welcome role pick → guest browsing, or pending auth.
  if (restoring || (!guestChecked && !account)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!account) {
    if (!guestChecked || authIntent) {
      if (!guestChecked) {
        return (
          <View style={styles.loading}>
            <ActivityIndicator />
          </View>
        );
      }
      return <AuthScreen onBack={() => setAuthIntent(null)} />;
    }
    if (!guestRole) {
      return <RoleSelect onPick={pickGuest} />;
    }
  }
  if (account && !roleChecked) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }
  // Hibernating accounts stop here: reopen, delete (when due), or sign out.
  if (account?.deactivatedAt) {
    return <Hibernate since={account.deactivatedAt} onReopened={refresh} onGone={signOut} />;
  }
  if (account && needRole) {    return (
      <RoleSelect onPick={async m => {
        if (m === 'business') {
          setBizAuto(true);
          setRoute({ name: 'bizhome' });
        } else {
          setRoute({ name: 'discover' });
        }
        await setAppMode(m);
        if (account) await setFlag(`role:${account.id}`, m);
        setNeedRole(false);
      }} />
    );
  }
  if (paused) {
    return (
      <SafeAreaView style={[styles.root, bg]}>
        <View style={styles.paused}>
          <Text style={styles.pausedH}>Paused for maintenance</Text>
          <Text style={styles.pausedT}>{pausedMessage || 'Back soon — thanks for waiting.'}</Text>
        </View>
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }
  if (!updateLater && isOutdated((Constants.expoConfig?.version as string | undefined) ?? '1.0.0', minVersion)) {
    return (
      <SafeAreaView style={[styles.root, bg]}>
        <View style={styles.paused}>
          <Text style={styles.pausedH}>A newer New Era is ready</Text>
          <Text style={styles.pausedT}>Update for the latest fixes and features — it takes a minute.</Text>
          <View style={{ height: 16 }} />
          <Text onPress={() => Linking.openURL(RELEASES_URL)}
            style={{ backgroundColor: C.cta, color: '#fff', fontWeight: '700', fontSize: 16, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12, overflow: 'hidden', textAlign: 'center' }}>
            Update New Era
          </Text>
          <View style={{ height: 12 }} />
          <Text onPress={() => setUpdateLater(true)} style={{ color: p.primary, fontWeight: '600', fontSize: 14 }}>Later</Text>
        </View>
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  const openStore = (slug: string) => {
    if (account) {
      api.storefront(slug).then(sf =>
        api.recordEvent('storefront_view', { businessId: sf.business.id }).catch(() => {}),
      ).catch(() => {});
    }
    setRoute({ name: 'store', slug });
  };
  const CUST: DrawerRoute[] = ['chats', 'updates', 'discover'];
  const BIZ: DrawerRoute[] = ['mybiz', 'blistings', 'bchats', 'bupdates', 'bdiscover'];
  const goDrawer = (r: DrawerRoute) => {
    // Cross-mode escape: business drawer offers Customer view, which flips
    // the mode and lands on customer Discover (no dead-end modes).
    if (r === 'discover' && mode === 'business') {
      setAppMode('customer');
      setRoute({ name: 'discover' } as Route);
      return;
    }
    setRoute(
    r === 'mybiz' ? { name: 'bizhome' }
    : r === 'blistings' ? { name: 'blistings' }
    : r === 'bdiscover' ? { name: 'bdiscover' }
    : r === 'bupdates' ? { name: 'bupdates' }
    : r === 'bchats' ? { name: 'bchats' }
    : { name: r } as Route);
  };

  if (mode === 'business') {
    const bizTab: BizTab =
      route.name === 'bchats' || (route.name === 'chat') ? 'bchats'
      : route.name === 'bupdates' ? 'bupdates'
      : route.name === 'blistings' ? 'blistings'
      : route.name === 'bdiscover' ? 'bdiscover' : 'mybiz';
    return (
      <SafeAreaView style={[styles.root, bg]}>
        <View style={{ flex: 1 }}>
        {route.name === 'store'
          ? <StorefrontScreen slug={route.slug}
          onListing={id => setRoute({ name: 'listing', id, from: route })}
              onChat={(bid, lid, label) => openChat(bid, lid, label)}
              onBack={() => setRoute({ name: 'bdiscover' })} />
          : route.name === 'listing'
          ? <ListingScreen id={route.id} onChat={(bid, lid, label) => openChat(bid, lid, label)} onBack={() => setRoute(route.from ?? { name: 'bizhome' })} />
          : route.name === 'chat'
          ? <ChatScreen threadId={route.threadId} context={route.context} onExit={() => setRoute({ name: 'bchats' })} onOpenStore={openStore} onBack={() => setRoute(route.from ?? { name: 'bchats' })} />
          : route.name === 'bupdates'
          ? <BizUpdates onStore={openStore} dRoutes={BIZ} dActive="bupdates" onDNav={goDrawer} />
          : route.name === 'bchats'
          ? <BizInbox onThread={(tid, label) => setRoute({ name: 'chat', threadId: tid, context: label, from: route })}
              dRoutes={BIZ} dActive="bchats" onDNav={goDrawer} />
          : route.name === 'blistings'
          ? <BizListings dRoutes={BIZ} dActive="blistings" onDNav={goDrawer} />
          : route.name === 'bdiscover'
          ? <DiscoverScreen onOpen={openStore} dRoutes={BIZ} dActive="bdiscover" onDNav={goDrawer} />
          : <BusinessHome onOpenStore={openStore} onManage={() => setRoute({ name: 'blistings' })}
              onCustomerView={() => { setAppMode('customer'); setRoute({ name: 'discover' }); }}
              dRoutes={BIZ} dActive="mybiz" onDNav={goDrawer}
              autoStart={bizAuto} onAutoDone={() => setBizAuto(false)} />}
        </View>
        <BizNav active={bizTab}
          chatsDot={hasUnread}
          onTab={t => setRoute(
            t === 'mybiz' ? { name: 'bizhome' }
            : t === 'blistings' ? { name: 'blistings' }
            : t === 'bdiscover' ? { name: 'bdiscover' }
            : { name: t } as Route)} />
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }
  const tab: Tab = route.name === 'chats' || route.name === 'chat' ? 'chats'
    : route.name === 'updates' ? 'updates' : 'discover';

  return (
    <SafeAreaView style={styles.root}>
      <View style={{ flex: 1 }}>
      {route.name === 'discover' && (
        <DiscoverScreen onOpen={openStore} dRoutes={CUST} dActive="discover" onDNav={goDrawer}
          onStartSelling={() => setAuthIntent({ mode: 'business' })}
          onSignIn={() => setAuthIntent({ mode: 'customer' })} />
      )}
      {route.name === 'updates' && (
        <UpdatesScreen
          onMessage={(bid, label) => openChat(bid, undefined, label)}
          onOpen={slug => setRoute({ name: 'store', slug })}
          dRoutes={CUST} dActive="updates" onDNav={goDrawer}
          onSignIn={() => setAuthIntent({ mode: 'customer' })} />
      )}
      {route.name === 'chats' && (
        <ChatsScreen onOpenThread={(bid, label) => openChat(bid, undefined, label)}
          dRoutes={CUST} dActive="chats" onDNav={goDrawer}
          onSignIn={() => setAuthIntent({ mode: 'customer' })} />
      )}
      {route.name === 'store' && (
        <StorefrontScreen slug={route.slug}
          onListing={id => setRoute({ name: 'listing', id })}
          onChat={(bid, lid, label) => openChat(bid, lid, label)}
          onBack={() => setRoute({ name: 'discover' })}
          onSignIn={() => { setPendingRoute({ name: 'store', slug: route.slug }); setAuthIntent({ mode: 'customer' }); }} />
      )}
      {route.name === 'listing' && (
        <ListingScreen id={route.id} onChat={(bid, lid, label) => openChat(bid, lid, label)} onBack={() => setRoute(route.from ?? { name: 'discover' })} />
      )}
      {route.name === 'chat' && <ChatScreen threadId={route.threadId} context={route.context} onExit={() => setRoute({ name: 'chats' })} onOpenStore={openStore} onBack={() => setRoute(route.from ?? { name: 'chats' })} />}
      </View>
      <BottomNav active={tab} chatsDot={hasUnread} onTab={t => setRoute({ name: t } as Route)} />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

export default function App() {
  // First-run brand moment (§1.7): plays once, then never again.
  const [intro, setIntro] = useState<boolean | null>(null);
  useEffect(() => {
    getFlag('seenIntro').then(v => setIntro(v ? false : true));
  }, []);
  if (intro === null) return null;
  if (intro) {
    return <Intro onDone={() => {
      setFlag('seenIntro', '1');
      setIntro(false);
    }} />;
  }
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <Shell />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background },
  root: {
    flex: 1,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web'
      ? { maxWidth: 900, width: '100%', alignSelf: 'center', height: '100dvh' as unknown as number }
      : null),
  },
  paused: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  pausedH: { fontSize: 22, fontWeight: '700', color: C.ink, textAlign: 'center' },
  pausedT: { fontSize: 14, color: C.bodyText, textAlign: 'center', marginTop: 8 },
});
