// Minimal monitoring/analytics wrapper (safe no-ops until keys are provided)

export function initMonitoring() {
  const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  const mixpanelToken = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;

  // Sentry (no-op by default). If you add `sentry-expo`, replace this with real init.
  if (sentryDsn) {
    // Example (commented to avoid requiring sentry-expo):
    // import * as Sentry from 'sentry-expo';
    // Sentry.init({ dsn: sentryDsn, enableInExpoDevelopment: false });
    console.log('[monitoring] Sentry DSN detected (init placeholder)');
  }

  // Mixpanel (no-op). If you add real SDK, wire it here.
  if (mixpanelToken) {
    console.log('[monitoring] Mixpanel token detected (init placeholder)');
  }
}

export function track(event: string, props?: Record<string, any>) {
  // No-op until real analytics is added
  if (process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true') {
    console.log(`[analytics] ${event}`, props || {});
  }
}

export function captureError(error: unknown) {
  // No-op until Sentry wired
  console.warn('[monitoring] error', error);
}

