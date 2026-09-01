import {
  AudioBufferQueueSourceNode,
  AudioContext,
} from "react-native-audio-api";
import { useCallback, useRef } from "react";
import { Platform } from "react-native";

import { pcm16Base64ToFloat32 } from "@/services/gemini/audio-codec";
import { GEMINI_LIVE_CONFIG } from "@/services/gemini/config";
import { configureGeminiAudioSession } from "@/services/gemini/audio-session";
import type { GeminiErrorCode } from "@/services/gemini/types";

type Options = {
  onError: (code: GeminiErrorCode) => void;
};

export function useGeminiAudioPlayer({ onError }: Options) {
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferQueueSourceNode | null>(null);
  const initializationRef = useRef<Promise<void> | null>(null);
  const playbackErrorReportedRef = useRef(false);
  const generationRef = useRef(0);
  const queueRef = useRef(Promise.resolve());

  const configure = useCallback(async () => {
    if (Platform.OS === "web") {
      return;
    }

    if (contextRef.current && sourceRef.current) {
      await contextRef.current.resume();
      return;
    }

    if (!initializationRef.current) {
      initializationRef.current = (async () => {
        await configureGeminiAudioSession();
        if (!contextRef.current) {
          contextRef.current = new AudioContext({
            sampleRate: GEMINI_LIVE_CONFIG.modelOutputSampleRate,
          });
        }
        await contextRef.current.resume();
      })().catch((error) => {
        initializationRef.current = null;
        throw error;
      });
    }

    await initializationRef.current;
  }, []);

  const playChunk = useCallback((base64Pcm24k: string) => {
    if (Platform.OS === "web" || !base64Pcm24k) {
      return;
    }

    const generation = generationRef.current;
    queueRef.current = queueRef.current
      .then(async () => {
        await configure();
        if (generation !== generationRef.current) {
          return;
        }

        const context = contextRef.current;
        const samples = pcm16Base64ToFloat32(base64Pcm24k);
        if (!context || samples.length === 0) {
          return;
        }

        const buffer = context.createBuffer(
          1,
          samples.length,
          GEMINI_LIVE_CONFIG.modelOutputSampleRate,
        );
        buffer.copyToChannel(samples, 0);
        if (!sourceRef.current) {
          const source = context.createBufferQueueSource();
          source.enqueueBuffer(buffer);
          source.connect(context.destination);
          source.start(context.currentTime);
          sourceRef.current = source;
        } else {
          sourceRef.current.enqueueBuffer(buffer);
        }
        playbackErrorReportedRef.current = false;
      })
      .catch(() => {
        if (!playbackErrorReportedRef.current) {
          playbackErrorReportedRef.current = true;
          onError("audio-playback");
        }
      });
  }, [configure, onError]);

  const nextTurn = useCallback(() => {
    // A completed Gemini turn may still have audio in the native queue, so it
    // is intentionally allowed to finish. Only stopPlayback invalidates it.
  }, []);

  const stopPlayback = useCallback(async () => {
    if (Platform.OS === "web") {
      return;
    }

    generationRef.current += 1;
    try {
      sourceRef.current?.clearBuffers();
    } catch {
      // Playback may not have started yet, which is safe to ignore.
    }
  }, []);

  const dispose = useCallback(async () => {
    if (Platform.OS === "web") {
      return;
    }

    generationRef.current += 1;
    const cleanup = queueRef.current
      .then(async () => {
        const source = sourceRef.current;
        const context = contextRef.current;
        sourceRef.current = null;
        contextRef.current = null;
        initializationRef.current = null;

        try {
          source?.clearBuffers();
          source?.stop();
        } catch {
          // The source may already have been stopped by the native audio graph.
        }
        await context?.close();
      })
      .catch(() => undefined);
    queueRef.current = cleanup;
    await cleanup;
  }, []);

  return {
    configure,
    dispose,
    nextTurn,
    playChunk,
    stopPlayback,
  };
}
