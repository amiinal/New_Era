import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth';
import { ThemeProvider } from './src/useTheme';
import { getFlag, setFlag } from './src/store';
import { Intro } from './src/components/Intro';
import { BizNav, BizTab, BottomNav, Tab } from './src/components/BottomNav';
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

type Route =
  | { name: 'discover' } | { name: 'updates' } | { name: 'chats' }
  | { name: 'bizhome' } | { name: 'bupdates' } | { name: 'bchats' } | { name: 'blistings' } | { name: 'bdiscover' }
  | { name: 'store'; slug: string }
  | { name: 'listing'; id: string }
  | { name: 'chat'; threadId: string; context: string };

// State-based navigator (no router dep): customer tabs + drill-in stack.
function Shell() {
  const { account, mode } = useAuth();
  const { p } = useTheme();
  const bg = { backgroundColor: p.background };
  const [route, setRoute] = useState<Route>({ name: 'discover' });

  const openChat = async (businessId: string, listingId?: string, label?: string) => {
    try {
      const t = await api.openThread(businessId, listingId);
      setRoute({ name: 'chat', threadId: t.id, context: label ?? 'New conversation' });
    } catch (e) {
      Alert.alert('Could not open chat', 'Check the API is running, then retry.');
    }
  };
  if (!account) return <AuthScreen />;

  const openStore = (slug: string) => {
    api.storefront(slug).then(sf =>
      api.recordEvent('storefront_view', { businessId: sf.business.id }).catch(() => {}),
    ).catch(() => {});
    setRoute({ name: 'store', slug });
  };

  if (mode === 'business') {
    const bizTab: BizTab =
      route.name === 'bchats' || (route.name === 'chat') ? 'bchats'
      : route.name === 'bupdates' ? 'bupdates'
      : route.name === 'blistings' ? 'blistings'
      : route.name === 'bdiscover' ? 'bdiscover' : 'mybiz';
    return (
      <SafeAreaView style={[styles.root, bg]}>
        {route.name === 'store'
          ? <StorefrontScreen slug={route.slug}
              onListing={id => setRoute({ name: 'listing', id })}
              onChat={(bid, lid, label) => openChat(bid, lid, label)}
              onBack={() => setRoute({ name: 'bdiscover' })} />
          : route.name === 'listing'
          ? <ListingScreen id={route.id} onChat={(bid, lid, label) => openChat(bid, lid, label)} />
          : route.name === 'chat'
          ? <ChatScreen threadId={route.threadId} context={route.context} />
          : route.name === 'bupdates'
          ? <BizUpdates onStore={openStore} />
          : route.name === 'bchats'
          ? <BizInbox onThread={(tid, label) => setRoute({ name: 'chat', threadId: tid, context: label })} />
          : route.name === 'blistings'
          ? <BizListings />
          : route.name === 'bdiscover'
          ? <DiscoverScreen onOpen={openStore} />
          : <BusinessHome onOpenStore={openStore} onManage={() => setRoute({ name: 'blistings' })} />}
        <BizNav active={bizTab}
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
      {route.name === 'discover' && (
        <DiscoverScreen onOpen={openStore} />
      )}
      {route.name === 'updates' && (
        <UpdatesScreen
          onMessage={(bid, label) => openChat(bid, undefined, label)}
          onOpen={slug => setRoute({ name: 'store', slug })} />
      )}
      {route.name === 'chats' && (
        <ChatsScreen onOpenThread={(bid, label) => openChat(bid, undefined, label)} />
      )}
      {route.name === 'store' && (
        <StorefrontScreen slug={route.slug}
          onListing={id => setRoute({ name: 'listing', id })}
          onChat={(bid, lid, label) => openChat(bid, lid, label)}
          onBack={() => setRoute({ name: 'discover' })} />
      )}
      {route.name === 'listing' && (
        <ListingScreen id={route.id} onChat={(bid, lid, label) => openChat(bid, lid, label)} />
      )}
      {route.name === 'chat' && <ChatScreen threadId={route.threadId} context={route.context} />}
      <BottomNav active={tab} onTab={t => setRoute({ name: t } as Route)} />
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
  root: {
    flex: 1,
    backgroundColor: C.background,
    ...(Platform.OS === 'web'
      ? { maxWidth: 900, width: '100%', alignSelf: 'center', height: '100vh' as unknown as number }
      : null),
  },
});
