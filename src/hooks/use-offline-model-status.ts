import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import {
  isOfflineLlmSupported,
  isOfflineModelCached,
} from "@/services/offline-llm/runtime";
import type { OfflineModelCacheStatus } from "@/services/offline-llm/types";

export function useOfflineModelStatus() {
  const [status, setStatus] = useState<OfflineModelCacheStatus>(
    isOfflineLlmSupported() ? "checking" : "unsupported",
  );

  const refresh = useCallback(async () => {
    if (!isOfflineLlmSupported()) {
      setStatus("unsupported");
      return;
    }

    const cached = await isOfflineModelCached();
    setStatus(cached ? "downloaded" : "missing");
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        void refresh();
      }
    });

    return () => subscription.remove();
  }, [refresh]);

  return {
    refresh,
    status,
    supported: isOfflineLlmSupported(),
  };
}
