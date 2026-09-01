import { AudioManager, AudioRecorder } from "react-native-audio-api";
import { useCallback, useRef } from "react";
import { Platform } from "react-native";

import {
  float32ToPcm16Base64,
  resampleFloat32,
} from "@/services/gemini/audio-codec";
import { GEMINI_LIVE_CONFIG } from "@/services/gemini/config";
import { configureGeminiAudioSession } from "@/services/gemini/audio-session";
import type { GeminiErrorCode } from "@/services/gemini/types";

type Options = {
  onChunk: (base64Pcm16k: string) => void;
  onError: (code: GeminiErrorCode) => void;
};

export function useGeminiAudioStream({ onChunk, onError }: Options) {
  const recorderRef = useRef<AudioRecorder | null>(null);
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
      const permission = await AudioManager.requestRecordingPermissions();
      if (permission !== "Granted") {
        onError("microphone-permission");
        return false;
      }

      await configureGeminiAudioSession();

      const recorder = new AudioRecorder();
      recorderRef.current = recorder;
      recorder.onError(() => onError("microphone-start"));

      const callbackResult = recorder.onAudioReady(
        {
          bufferLength: Math.round(
            (GEMINI_LIVE_CONFIG.inputSampleRate *
              GEMINI_LIVE_CONFIG.audioChunkIntervalMs) /
              1_000,
          ),
          channelCount: 1,
          sampleRate: GEMINI_LIVE_CONFIG.inputSampleRate,
        },
        ({ buffer }) => {
          const microphoneSamples = buffer.getChannelData(0);
          const samples = resampleFloat32(
            microphoneSamples,
            buffer.sampleRate,
            GEMINI_LIVE_CONFIG.inputSampleRate,
          );
          const chunk = float32ToPcm16Base64(samples);
          if (chunk) {
            onChunk(chunk);
          }
        },
      );

      if (callbackResult.status === "error") {
        throw new Error(callbackResult.message);
      }

      const result = await recorder.start();
      if (result.status === "error") {
        throw new Error(result.message);
      }

      if (recorderRef.current !== recorder) {
        recorder.clearOnAudioReady();
        recorder.clearOnError();
        await recorder.stop();
        return false;
      }

      isRecordingRef.current = true;
      return true;
    } catch {
      const recorder = recorderRef.current;
      recorderRef.current = null;
      recorder?.clearOnAudioReady();
      recorder?.clearOnError();
      if (recorder?.isRecording()) {
        try {
          await recorder.stop();
        } catch {
          // Preserve the original microphone-start error.
        }
      }
      onError("microphone-start");
      return false;
    }
  }, [onChunk, onError]);

  const stopRecording = useCallback(async (): Promise<void> => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    recorder?.clearOnAudioReady();
    recorder?.clearOnError();

    if (!recorder) {
      isRecordingRef.current = false;
      return;
    }

    isRecordingRef.current = false;
    try {
      await recorder.stop();
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
