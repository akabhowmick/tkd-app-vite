import * as Sentry from "@sentry/react";

export { Sentry };

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.warn("VITE_SENTRY_DSN not set — Sentry disabled");
    return;
  }

  Sentry.init({
    dsn,
    release: import.meta.env.VITE_APP_VERSION ?? "0.0.0",
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

export function setSentryUser(user: { id: string; email?: string; username?: string }): void {
  Sentry.setUser(user);
}

export function clearSentryUser(): void {
  Sentry.setUser(null);
}

export function captureException(
  err: unknown,
  context?: {
    feature?: string;
    action?: string;
    extra?: Record<string, unknown>;
  },
): void {
  Sentry.withScope((scope) => {
    if (context?.feature) scope.setTag("feature", context.feature);
    if (context?.action) scope.setTag("action", context.action);
    if (context?.extra) scope.setExtras(context.extra);
    Sentry.captureException(err);
  });
}

export function addBreadcrumb(message: string, data?: Record<string, unknown>): void {
  Sentry.addBreadcrumb({ message, data, level: "info" });
}
