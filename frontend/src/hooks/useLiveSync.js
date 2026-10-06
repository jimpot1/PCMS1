import { useEffect, useRef } from "react";

const DEFAULT_SYNC_INTERVAL_MS = 20000;

export default function useLiveSync(
  refresh,
  { intervalMs = DEFAULT_SYNC_INTERVAL_MS, enabled = true } = {},
) {
  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;

    let disposed = false;
    let lastRefreshAt = 0;
    let refreshInFlight = false;

    const runRefresh = async () => {
      if (
        disposed ||
        document.visibilityState !== "visible" ||
        !navigator.onLine ||
        refreshInFlight ||
        Date.now() - lastRefreshAt < 2000
      ) {
        return;
      }

      refreshInFlight = true;
      lastRefreshAt = Date.now();
      try {
        await refreshRef.current?.();
      } catch {
        // Keep the last successful data visible during transient network errors.
      } finally {
        refreshInFlight = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") runRefresh();
    };

    const interval = window.setInterval(runRefresh, intervalMs);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      disposed = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [enabled, intervalMs]);
}