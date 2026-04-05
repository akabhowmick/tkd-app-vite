import posthog from "posthog-js";

export function initPostHog(): void {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST ?? "https://app.posthog.com";

  if (!key) {
    console.warn("VITE_POSTHOG_KEY not set — PostHog disabled");
    return;
  }

  posthog.init(key, {
    api_host: host,
    capture_pageview: false, // manual via useAnalyticsPageTracking
    disable_session_recording: false,
  });
}

export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  posthog.identify(userId, properties);
}

export function resetIdentity(): void {
  posthog.reset();
}

export function trackPageView(url: string): void {
  posthog.capture("$pageview", { $current_url: url });
}

// ─────────────────────────────────────────────
// Typed event catalogue
// ─────────────────────────────────────────────
type AnalyticsEvent =
  | { name: "user_logged_in"; props: { method: "email" | "google" } }
  | { name: "user_signed_up"; props: { role: string } }
  | { name: "user_logged_out"; props?: never }
  | { name: "attendance_saved"; props: { studentCount: number; date: string } }
  | { name: "attendance_mark_all"; props: { status: "present" | "absent" | "tardy" } }
  | { name: "renewal_created"; props: { durationMonths: number } }
  | { name: "renewal_payment_marked_paid"; props?: never }
  | { name: "renewal_payment_added"; props?: never }
  | { name: "renewal_student_quit"; props?: never }
  | { name: "renewal_renewed"; props: { durationMonths: number } }
  | { name: "renewal_deleted"; props?: never }
  | { name: "class_created"; props: { ageGroup: "Kids" | "Adults" | "All" } }
  | { name: "class_deleted"; props?: never }
  | { name: "class_session_added"; props: { sessionType: "recurring" | "one-off" } }
  | { name: "class_session_deleted"; props?: never }
  | { name: "belt_rank_created"; props?: never }
  | { name: "belt_rank_deleted"; props?: never }
  | { name: "student_promoted"; props: { promotionType: "manual" | "test" } }
  | { name: "promotion_deleted"; props?: never }
  | { name: "inventory_item_created"; props: { category: string } }
  | { name: "inventory_item_deleted"; props?: never }
  | { name: "inventory_sale_recorded"; props: { category: string } }
  | { name: "inventory_restock_recorded"; props?: never }
  | { name: "sidebar_view_changed"; props: { view: string } }
  | { name: "sidebar_collapsed"; props: { collapsed: boolean } };

type EventName = AnalyticsEvent["name"];
type EventProps<N extends EventName> = Extract<AnalyticsEvent, { name: N }>["props"];

export function track<N extends EventName>(
  name: N,
  ...args: EventProps<N> extends never | undefined ? [] : [EventProps<N>]
): void {
  posthog.capture(name, args[0] ?? {});
}
