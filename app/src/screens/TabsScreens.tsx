import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C, space, type } from '../theme';
import { Button } from '../components/Button';

// Step 7/8 shell: one card per business (tap plays its statuses in build
// step 2) + add-status tile. Chats tab shows threads in step 2.
export function UpdatesScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.h1}>Updates</Text>
      <View style={styles.card}>
        <Text style={styles.t}>Mama's Kitchen</Text>
        <Text style={styles.micro}>2 updates · latest 5h ago</Text>
        <View style={{ marginTop: space.s3 }}><Button title="Message" onPress={() => {}} /></View>
      </View>
    </View>
  );
}

export function ChatsScreen({ onOpen }: { onOpen: () => void }) {
  return (
    <View style={styles.root}>
      <Text style={styles.h1}>Chats</Text>
      <Text style={styles.micro}>Threads from the storefront appear here.</Text>
      <View style={{ marginTop: space.s4 }}><Button title="Open demo thread" variant="secondary" onPress={onOpen} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background, padding: space.s4 },
  h1: { ...type.h1, color: C.ink, marginBottom: space.s4 },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: space.s4 },
  t: { ...type.h3, color: C.ink },
  micro: { ...type.micro, color: C.bodyText, marginTop: 4 },
});
