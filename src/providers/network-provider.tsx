import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
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
import { showSuccessToast, showWarningToast } from "@/utils/toast";

type NetworkContextValue = {
  /** True once NetInfo has delivered at least one reading. */
  isReady: boolean;
  isOnline: boolean;
  isOffline: boolean;
  refresh: () => Promise<void>;
  /** Warns and returns false when offline; otherwise true. */
  ensureOnline: () => boolean;
};

const NetworkContext = createContext<NetworkContextValue | undefined>(
  undefined,
);

function isStateOffline(state: NetInfoState | null): boolean {
  if (!state) {
    return false;
  }

  return state.isConnected === false || state.isInternetReachable === false;
}

export function NetworkProvider({ children }: PropsWithChildren) {
  const { t } = useLanguage();
  const [state, setState] = useState<NetInfoState | null>(null);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(setState);

    const appState = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void NetInfo.refresh();
      }
    });

    return () => {
      unsubscribe();
      appState.remove();
    };
  }, []);

  const isOffline = isStateOffline(state);
  const isOnline = !isOffline;

  useEffect(() => {
    if (!state) {
      return;
    }

    if (isOffline) {
      wasOfflineRef.current = true;
      return;
    }

    if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      showSuccessToast(
        t("networkOnlineTitle"),
        t("networkOnlineDescription"),
      );
    }
  }, [isOffline, state, t]);

  const refresh = useCallback(async () => {
    const next = await NetInfo.refresh();
    setState(next);
  }, []);

  const ensureOnline = useCallback(() => {
    if (!isOffline) {
      return true;
    }

    showWarningToast(
      t("networkOfflineTitle"),
      t("networkOfflineDescription"),
    );
    return false;
  }, [isOffline, t]);

  const value = useMemo(
    () => ({
      isReady: state !== null,
      isOnline,
      isOffline,
      refresh,
      ensureOnline,
    }),
    [ensureOnline, isOffline, isOnline, refresh, state],
  );

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);

  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }

  return context;
}
