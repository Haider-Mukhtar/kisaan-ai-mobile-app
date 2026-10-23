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

import { useNetwork } from "@/providers/network-provider";
import { useProfile } from "@/providers/profile-provider";
import {
  getSatelliteHealth,
  type SatelliteHealthSnapshot,
} from "@/services/satelliteService";

type SatelliteStatus = "idle" | "loading" | "ready" | "error";

type SatelliteState = {
  status: SatelliteStatus;
  snapshot: SatelliteHealthSnapshot | null;
  error: string | null;
};

type SatelliteContextValue = SatelliteState & {
  isRefreshing: boolean;
  refresh: () => Promise<void>;
};

const IDLE_STATE: SatelliteState = {
  status: "idle",
  snapshot: null,
  error: null,
};

const SatelliteContext = createContext<SatelliteContextValue | undefined>(
  undefined,
);

export function SatelliteProvider({ children }: PropsWithChildren) {
  const { isOffline } = useNetwork();
  const { profile } = useProfile();
  const [state, setState] = useState<SatelliteState>(IDLE_STATE);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMountedRef = useRef(true);
  const farmLocation = profile?.location ?? null;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadData = useCallback(
    async (refreshing = false) => {
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setState((prev) => ({ ...prev, status: "loading", error: null }));
      }

      try {
        const snapshot = await getSatelliteHealth(farmLocation, isOffline);
        if (isMountedRef.current) {
          setState({
            status: "ready",
            snapshot,
            error: null,
          });
        }
      } catch (err) {
        if (isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            status: prev.snapshot ? "ready" : "error",
            error: err instanceof Error ? err.message : "Failed to load satellite telemetry",
          }));
        }
      } finally {
        if (isMountedRef.current) {
          setIsRefreshing(false);
        }
      }
    },
    [farmLocation, isOffline],
  );

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  const value = useMemo<SatelliteContextValue>(
    () => ({
      ...state,
      isRefreshing,
      refresh,
    }),
    [state, isRefreshing, refresh],
  );

  return (
    <SatelliteContext.Provider value={value}>
      {children}
    </SatelliteContext.Provider>
  );
}

export function useSatelliteHealth(): SatelliteContextValue {
  const context = useContext(SatelliteContext);
  if (!context) {
    throw new Error(
      "useSatelliteHealth must be used within a SatelliteProvider",
    );
  }
  return context;
}
