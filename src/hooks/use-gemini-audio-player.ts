import {
  EncodingTypes,
  ExpoPlayAudioStream,
  PlaybackModes,
} from "@mykin-ai/expo-audio-stream";
import { useCallback, useRef } from "react";
import { Platform } from "react-native";

import { resamplePcm16Base64From24kTo48k } from "@/services/gemini/audio-codec";
import { GEMINI_LIVE_CONFIG } from "@/services/gemini/config";

export function useGeminiAudioPlayer() {
  const turnCounterRef = useRef(0);
  const turnIdRef = useRef("gemini-turn-0");
  const queueRef = useRef(Promise.resolve());

  const configure = useCallback(async () => {
    if (Platform.OS === "web") {
      return;
    }

    await ExpoPlayAudioStream.setSoundConfig({
      playbackMode: PlaybackModes.CONVERSATION,
      sampleRate: GEMINI_LIVE_CONFIG.playbackSampleRate,
    });
  }, []);

  const playChunk = useCallback((base64Pcm24k: string) => {
    if (Platform.OS === "web" || !base64Pcm24k) {
      return;
    }

    const turnId = turnIdRef.current;
    queueRef.current = queueRef.current
      .then(async () => {
        const pcm48k = resamplePcm16Base64From24kTo48k(base64Pcm24k);
        if (pcm48k) {
          await ExpoPlayAudioStream.playAudio(
            pcm48k,
            turnId,
            EncodingTypes.PCM_S16LE,
          );
        }
      })
      .catch(() => undefined);
  }, []);

  const nextTurn = useCallback(() => {
    turnCounterRef.current += 1;
    turnIdRef.current = `gemini-turn-${turnCounterRef.current}`;
    queueRef.current = Promise.resolve();
  }, []);

  const stopPlayback = useCallback(async () => {
    if (Platform.OS === "web") {
      return;
    }

    const staleTurnId = turnIdRef.current;
    nextTurn();
    try {
      await ExpoPlayAudioStream.clearPlaybackQueueByTurnId(staleTurnId);
      await ExpoPlayAudioStream.stopAudio();
    } catch {
      // Playback may not have started yet, which is safe to ignore.
    }
  }, [nextTurn]);

  return {
    configure,
    nextTurn,
    playChunk,
    stopPlayback,
  };
}
