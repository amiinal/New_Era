// Sentry error monitoring (Issues only — no tracing/profiling).
// DSN comes from api/.env (never committed). No-op when unset.
import * as Sentry from '@sentry/node';

let ready = false;

export function initSentry() {
  if (ready || !process.env.SENTRY_DSN) return;
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0 });
  ready = true;
}

export function capture(e) {
  try {
    if (ready) Sentry.captureException(e);
  } catch { /* monitoring must never break the app */ }
}
