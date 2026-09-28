import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/auth';
import { BottomNav, Tab } from './src/components/BottomNav';
import { C } from './src/theme';
import { AuthScreen } from './src/screens/AuthScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { DiscoverScreen } from './src/screens/DiscoverScreen';
import { ListingScreen } from './src/screens/ListingScreen';
import { StorefrontScreen } from './src/screens/StorefrontScreen';
import { ChatsScreen, UpdatesScreen } from './src/screens/TabsScreens';
import { api } from './src/api';

type Route =
  | { name: 'discover' } | { name: 'updates' } | { name: 'chats' }
  | { name: 'store'; slug: string }
  | { name: 'listing'; id: string }
  | { name: 'chat'; threadId: string };

// State-based navigator (no router dep): customer tabs + drill-in stack.
function Shell() {
  const { account } = useAuth();
  const [route, setRoute] = useState<Route>({ name: 'discover' });

  const openChat = async (businessId: string, listingId?: string) => {
    const t = await api.openThread(businessId, listingId);
    setRoute({ name: 'chat', threadId: t.id });
  };
  if (!account) return <AuthScreen />;
  const tab: Tab = route.name === 'chats' || route.name === 'chat' ? 'chats'
    : route.name === 'updates' ? 'updates' : 'discover';

  return (
    <SafeAreaView style={styles.root}>
      {route.name === 'discover' && (
        <DiscoverScreen onOpen={slug => setRoute({ name: 'store', slug })} />
      )}
      {route.name === 'updates' && <UpdatesScreen />}
      {route.name === 'chats' && <ChatsScreen onOpen={() => {}} />}
      {route.name === 'store' && (
        <StorefrontScreen slug={route.slug}
          onListing={id => setRoute({ name: 'listing', id })}
          onChat={(bid, lid) => openChat(bid, lid)}
          onBack={() => setRoute({ name: 'discover' })} />
      )}
      {route.name === 'listing' && (
        <ListingScreen id={route.id} onChat={(bid, lid) => openChat(bid, lid)} />
      )}
      {route.name === 'chat' && <ChatScreen threadId={route.threadId} />}
      <BottomNav active={tab} onTab={t => setRoute({ name: t })} />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

export default function App() {
  return <AuthProvider><Shell /></AuthProvider>;
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: C.background } });
