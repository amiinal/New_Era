import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth';
import { BizNav, BizTab, BottomNav, Tab } from './src/components/BottomNav';
import { C } from './src/theme';
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
  | { name: 'bizhome' } | { name: 'bupdates' } | { name: 'bchats' } | { name: 'blistings' }
  | { name: 'store'; slug: string }
  | { name: 'listing'; id: string }
  | { name: 'chat'; threadId: string; context: string };

// State-based navigator (no router dep): customer tabs + drill-in stack.
function Shell() {
  const { account, mode } = useAuth();
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
      : route.name === 'blistings' ? 'blistings' : 'mybiz';
    return (
      <SafeAreaView style={styles.root}>
        {route.name === 'store'
          ? <StorefrontScreen slug={route.slug}
              onListing={id => setRoute({ name: 'listing', id })}
              onChat={(bid, lid, label) => openChat(bid, lid, label)}
              onBack={() => setRoute({ name: 'bizhome' })} />
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
          : <BusinessHome onOpenStore={openStore} onManage={() => setRoute({ name: 'blistings' })} />}
        <BizNav active={bizTab}
          onTab={t => setRoute(t === 'mybiz' ? { name: 'bizhome' } : t === 'blistings' ? { name: 'blistings' } : { name: t } as Route)} />
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
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: C.background } });
