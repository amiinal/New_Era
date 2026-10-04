import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Persistent flags that work everywhere: SecureStore on device,
// localStorage on web, memory fallback if either throws.
const mem = new Map<string, string>();

export async function getFlag(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return window.localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  } catch {
    return mem.get(key) ?? null;
  }
}

export async function setFlag(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') { window.localStorage.setItem(key, value); return; }
    await SecureStore.setItemAsync(key, value);
  } catch {
    mem.set(key, value);
  }
}
