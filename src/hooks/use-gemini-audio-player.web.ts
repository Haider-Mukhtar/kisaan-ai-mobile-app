import { useCallback } from "react";

import type { GeminiErrorCode } from "@/services/gemini/types";

type Options = {
  onError: (code: GeminiErrorCode) => void;
};

export function useGeminiAudioPlayer(_options: Options) {
  return {
    configure: useCallback(async () => undefined, []),
    dispose: useCallback(async () => undefined, []),
    nextTurn: useCallback(() => undefined, []),
    playChunk: useCallback(() => undefined, []),
    stopPlayback: useCallback(async () => undefined, []),
  };
}
