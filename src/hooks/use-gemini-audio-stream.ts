import { ExpoPlayAudioStream } from "@mykin-ai/expo-audio-stream";
import { useCallback, useRef } from "react";
import { Platform } from "react-native";

import { GEMINI_LIVE_CONFIG } from "@/services/gemini/config";
import type { GeminiErrorCode } from "@/services/gemini/types";

type Options = {
  onChunk: (base64Pcm16k: string) => void;
  onError: (code: GeminiErrorCode) => void;
};

export function useGeminiAudioStream({ onChunk, onError }: Options) {
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);
  const isRecordingRef = useRef(false);

  const startRecording = useCallback(async (): Promise<boolean> => {
    if (isRecordingRef.current) {
      return true;
    }
    if (Platform.OS === "web") {
      onError("microphone-start");
      return false;
    }

    try {
      const permission = await ExpoPlayAudioStream.requestPermissionsAsync();
      if (!permission.granted) {
        onError("microphone-permission");
        return false;
      }

      const result = await ExpoPlayAudioStream.startRecording({
        channels: 1,
        encoding: "pcm_16bit",
        interval: GEMINI_LIVE_CONFIG.audioChunkIntervalMs,
        sampleRate: GEMINI_LIVE_CONFIG.inputSampleRate,
        onAudioStream: async (event) => {
          if (typeof event.data === "string" && event.data.length > 0) {
            onChunk(event.data);
          }
        },
      });

      subscriptionRef.current = result.subscription ?? null;
      isRecordingRef.current = true;
      return true;
    } catch {
      onError("microphone-start");
      return false;
    }
  }, [onChunk, onError]);

  const stopRecording = useCallback(async (): Promise<void> => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;

    if (!isRecordingRef.current) {
      return;
    }

    isRecordingRef.current = false;
    try {
      await ExpoPlayAudioStream.stopRecording();
    } catch {
      // Native recording may already have stopped during an app-state change.
    }
  }, []);

  return {
    isRecordingRef,
    startRecording,
    stopRecording,
  };
}
