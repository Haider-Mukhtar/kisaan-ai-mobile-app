import { createContext, useContext, useMemo, type PropsWithChildren } from "react";

import { useProfile } from "@/providers/profile-provider";
import { useWeather } from "@/providers/weather-provider";
import { buildWeatherAlerts } from "@/services/alerts/build-weather-alerts";
import {
  ALERT_SEVERITY_RANK,
  type FarmAlert,
} from "@/services/alerts/types";
import { isSnapshotFresh } from "@/services/weather/types";

type AlertsStatus = "idle" | "loading" | "ready" | "error";

type AlertsContextValue = {
  alerts: FarmAlert[];
  status: AlertsStatus;
  isRefreshing: boolean;
  isStale: boolean;
  refresh: () => Promise<void>;
};

const AlertsContext = createContext<AlertsContextValue | undefined>(undefined);

export function AlertsProvider({ children }: PropsWithChildren) {
  const { profile } = useProfile();
  const weather = useWeather();

  const alerts = useMemo(() => {
    if (!weather.snapshot) return [];

    return buildWeatherAlerts(weather.snapshot, profile?.crops ?? []).sort(
      (left, right) =>
        ALERT_SEVERITY_RANK[right.severity] -
          ALERT_SEVERITY_RANK[left.severity] ||
        right.updatedAt.localeCompare(left.updatedAt),
    );
  }, [profile?.crops, weather.snapshot]);

  const status: AlertsStatus = weather.snapshot
    ? "ready"
    : weather.status;

  const value = useMemo<AlertsContextValue>(
    () => ({
      alerts,
      status,
      isRefreshing: weather.isRefreshing,
      isStale: Boolean(
        weather.snapshot && !isSnapshotFresh(weather.snapshot),
      ),
      refresh: weather.refresh,
    }),
    [alerts, status, weather.isRefreshing, weather.refresh, weather.snapshot],
  );

  return (
    <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertsContext);

  if (!context) {
    throw new Error("useAlerts must be used within an AlertsProvider");
  }

  return context;
}
