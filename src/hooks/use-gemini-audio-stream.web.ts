import { useCallback, useRef } from "react";

import type { GeminiErrorCode } from "@/services/gemini/types";

type Options = {
  onChunk: (base64Pcm16k: string) => void;
  onError: (code: GeminiErrorCode) => void;
};

export function useGeminiAudioStream({ onError }: Options) {
  const isRecordingRef = useRef(false);

  return {
    isRecordingRef,
    startRecording: useCallback(async () => {
      onError("microphone-start");
      return false;
    }, [onError]),
    stopRecording: useCallback(async () => {
      isRecordingRef.current = false;
    }, []),
  };
}
