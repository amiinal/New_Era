import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

import App from './App';

// Production web only: register the app-shell service worker.
// Never in dev (Metro) and never on native.
const g = globalThis as unknown as {
  navigator?: { serviceWorker?: { register(s: string): Promise<unknown> } };
  addEventListener?: (t: string, f: () => void) => void;
};
if (Platform.OS === 'web' && g.navigator?.serviceWorker && process.env.NODE_ENV === 'production') {
  g.addEventListener?.('load', () => {
    g.navigator!.serviceWorker!.register('/sw.js').catch(() => {});
  });
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
