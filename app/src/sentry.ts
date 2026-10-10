// Sentry error monitoring (Issues only). DSN ships in app.json extra —
// DSNs are public client keys by design, not secrets. Inside Expo Go this
// runs JS-only; full native capture arrives with the real APK build.
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

export function initSentry() {
  const dsn = (Constants.expoConfig?.extra as { sentryDsn?: string } | undefined)?.sentryDsn;
  if (!dsn) return;
  try {
    Sentry.init({ dsn });
  } catch { /* monitoring must never break the app */ }
}

export function capture(e: unknown) {
  try {
    Sentry.captureException(e);
  } catch { /* ignore */ }
}
