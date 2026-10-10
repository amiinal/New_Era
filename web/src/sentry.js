// Sentry error monitoring (Issues only). The DSN is a public client key
// by design — it ships in the bundle, which is exactly how Sentry intends it.
import * as Sentry from '@sentry/react';

export function initSentry() {
  try {
    Sentry.init({
      dsn: 'https://39b7d271c7d79c64d7d67dfd1e97ad62@o4512230555910144.ingest.de.sentry.io/4512230650675280',
      tracesSampleRate: 0,
    });
  } catch { /* monitoring must never break the app */ }
}

export const Boundary = Sentry.ErrorBoundary;
