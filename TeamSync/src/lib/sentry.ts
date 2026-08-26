import * as Sentry from "@sentry/react-native";

// Same "gracefully do nothing if unconfigured" shape as isFirebaseConfigured
// / getFirebaseServices() in ./firebase.ts -- a missing DSN (e.g. local dev,
// or before the Sentry project exists yet) must never crash the app.
export const isSentryConfigured = Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN);

export function initSentry() {
  if (!isSentryConfigured) {
    return;
  }

  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    // Errors only for now -- performance tracing and session replay both
    // eat into Sentry's free-tier event quota and weren't asked for.
    tracesSampleRate: 0,
  });
}

export { Sentry };
