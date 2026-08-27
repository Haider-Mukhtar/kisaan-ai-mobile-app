import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { AppState } from "react-native";

import { useLanguage } from "@/providers/language-provider";
import { useNetwork } from "@/providers/network-provider";
import { useProfile } from "@/providers/profile-provider";
import {
  cacheSharedForecast,
  readSharedForecast,
} from "@/services/supabase/weather";
import {
  readCachedSnapshot,
  writeCachedSnapshot,
} from "@/services/weather/device-cache";
import { fetchForecast } from "@/services/weather/open-meteo";
import {
  isSnapshotFresh,
  type WeatherError,
  type WeatherLocation,
  type WeatherSnapshot,
} from "@/services/weather/types";
import { showWarningToast } from "@/utils/toast";

type WeatherStatus =
  /** No location on the profile yet, so there is nothing to show. */
  | "idle"
  | "loading"
  | "ready"
  | "error";

type WeatherState = {
  status: WeatherStatus;
  snapshot: WeatherSnapshot | null;
  error: WeatherError | null;
};

/** A load result, tagged with the location it belongs to. */
type LoadedWeather = WeatherState & {
  locationKey: string;
};

type WeatherContextValue = WeatherState & {
  /** True while a farmer-initiated refresh runs behind an existing snapshot. */
  isRefreshing: boolean;
  refresh: () => Promise<void>;
};

const IDLE_STATE: WeatherState = {
  status: "idle",
  snapshot: null,
  error: null,
};

const LOADING_STATE: WeatherState = {
  status: "loading",
  snapshot: null,
  error: null,
};

const WeatherContext = createContext<WeatherContextValue | undefined>(undefined);

export function WeatherProvider({ children }: PropsWithChildren) {
  const { t } = useLanguage();
  const { isOnline } = useNetwork();
  const { profile } = useProfile();
  const [loaded, setLoaded] = useState<LoadedWeather | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const stateRef = useRef<WeatherState>(IDLE_STATE);
  const isOnlineRef = useRef(isOnline);
  const tRef = useRef(t);
  const isMountedRef = useRef(true);
  /** Guards against a slow earlier load overwriting a newer one. */
  const requestIdRef = useRef(0);

  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Derived from primitives so a profile reload that did not touch the
  // location does not look like a new location and trigger a refetch.
  const districtId = profile?.location?.districtId ?? null;
  const latitude = profile?.location?.latitude ?? null;
  const longitude = profile?.location?.longitude ?? null;
  const location = useMemo<WeatherLocation | null>(
    () =>
      districtId !== null && latitude !== null && longitude !== null
        ? { districtId, latitude, longitude }
        : null,
    [districtId, latitude, longitude],
  );
  const locationKey = location
    ? `${location.districtId}:${location.latitude}:${location.longitude}`
    : null;

  /**
   * Anything loaded for a different location is stale by definition, so the
   * loading state is derived rather than assigned. That keeps every state
   * update in the loader itself, after an await.
   */
  const state = useMemo<WeatherState>(() => {
    if (!locationKey) {
      return IDLE_STATE;
    }

    if (!loaded || loaded.locationKey !== locationKey) {
      return LOADING_STATE;
    }

    return { status: loaded.status, snapshot: loaded.snapshot, error: loaded.error };
  }, [loaded, locationKey]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const load = useCallback(
    async ({ force }: { force: boolean }) => {
      if (!location || !locationKey) {
        return;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      const commit = (next: WeatherState) => {
        if (isMountedRef.current && requestIdRef.current === requestId) {
          setLoaded({ ...next, locationKey });
        }
      };

      // The phone's own copy paints first: it is the only layer that works
      // with no signal, and the fastest one when it is still current.
      let best = await readCachedSnapshot(location);

      if (best) {
        commit({ status: "ready", snapshot: best, error: null });

        if (!force && isSnapshotFresh(best)) {
          return;
        }
      }

      if (!isOnlineRef.current) {
        if (!best) {
          commit({
            status: "error",
            snapshot: null,
            error: { kind: "offline", message: "Device is offline" },
          });
        }

        return;
      }

      if (!force) {
        // Shared district cache: another farmer nearby may have fetched
        // today's forecast already.
        const shared = await readSharedForecast(location);

        if (shared) {
          if (isSnapshotFresh(shared)) {
            commit({ status: "ready", snapshot: shared, error: null });
            void writeCachedSnapshot(shared);
            return;
          }

          if (!best || shared.fetchedAt > best.fetchedAt) {
            best = shared;
          }
        }
      }

      const { data, error } = await fetchForecast(location);

      if (data) {
        commit({ status: "ready", snapshot: data, error: null });
        void writeCachedSnapshot(data);
        void cacheSharedForecast(data);
        return;
      }

      const fallback = best ?? (force ? await readSharedForecast(location) : null);

      if (fallback) {
        // Something on screen beats an error, as long as its age is visible.
        commit({ status: "ready", snapshot: fallback, error: null });

        if (force) {
          showWarningToast(tRef.current("weatherRefreshFailedTitle"));
        }

        return;
      }

      commit({ status: "error", snapshot: null, error });
    },
    [location, locationKey],
  );

  useEffect(() => {
    void load({ force: false });
  }, [load]);

  // Farmers leave the app open for hours, so a forecast from this morning is
  // refreshed the next time they come back to it.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        return;
      }

      const { snapshot, status } = stateRef.current;

      if (status !== "idle" && (!snapshot || !isSnapshotFresh(snapshot))) {
        void load({ force: false });
      }
    });

    return () => subscription.remove();
  }, [load]);

  useEffect(() => {
    if (!isOnline) {
      return;
    }

    const { snapshot, status } = stateRef.current;

    if (status === "error" || (snapshot && !isSnapshotFresh(snapshot))) {
      void load({ force: false });
    }
  }, [isOnline, load]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      await load({ force: true });
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [load]);

  const value = useMemo(
    () => ({ ...state, isRefreshing, refresh }),
    [isRefreshing, refresh, state],
  );

  return (
    <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>
  );
}

export function useWeather() {
  const context = useContext(WeatherContext);

  if (!context) {
    throw new Error("useWeather must be used within a WeatherProvider");
  }

  return context;
}
