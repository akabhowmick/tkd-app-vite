import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "./posthog";
import { addBreadcrumb } from "./sentry";

export function useAnalyticsPageTracking(): void {
  const location = useLocation();

  useEffect(() => {
    trackPageView(window.location.href);
    addBreadcrumb(`Navigated to ${location.pathname}`, { pathname: location.pathname });
  }, [location.pathname]);
}
