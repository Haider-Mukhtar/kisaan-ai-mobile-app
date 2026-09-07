import { useCallback } from "react";

import type { LanguageCode } from "@/providers/language-provider";
import type {
  OfflineChatMessage,
  OfflineLlmErrorCode,
  OfflineLlmPhase,
} from "@/services/offline-llm/types";

type Options = {
  farmerContext: string;
  isModelCached?: boolean;
  language: LanguageCode;
};

export function useOfflineLlm(_options: Options) {
  const sendMessage = useCallback(async () => false, []);
  const clearMessages = useCallback(() => undefined, []);
  const interrupt = useCallback(() => undefined, []);
  const dismissError = useCallback(() => undefined, []);

  return {
    clearMessages,
    dismissError,
    downloadProgress: 0,
    errorCode: "unsupported" as OfflineLlmErrorCode,
    interrupt,
    isGenerating: false,
    isReady: false,
    loadError: "unsupported" as OfflineLlmErrorCode,
    messages: [] as OfflineChatMessage[],
    phase: "error" as OfflineLlmPhase,
    sendMessage,
  };
}
