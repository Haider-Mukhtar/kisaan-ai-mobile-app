import { useCallback } from "react";

export function useGeminiAudioPlayer() {
  return {
    configure: useCallback(async () => undefined, []),
    nextTurn: useCallback(() => undefined, []),
    playChunk: useCallback(() => undefined, []),
    stopPlayback: useCallback(async () => undefined, []),
  };
}
