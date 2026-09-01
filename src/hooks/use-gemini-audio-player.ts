import {
  AudioBufferQueueSourceNode,
  AudioContext,
} from "react-native-audio-api";
import { useCallback, useRef } from "react";
import { Platform } from "react-native";

import {
  pcm16Base64ToFloat32,
  resampleFloat32,
} from "@/services/gemini/audio-codec";
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

  const releaseSource = useCallback(() => {
    const source = sourceRef.current;
    sourceRef.current = null;
    if (!source) {
      return;
    }

    try {
      source.onBufferEnded = null;
      source.clearBuffers();
      source.stop();
      source.disconnect();
    } catch {
      // The native source may already have finished or never started.
    }
  }, []);

  const configure = useCallback(async () => {
    if (Platform.OS === "web") {
      return;
    }

    if (contextRef.current) {
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

  const playChunk = useCallback(
    (base64Pcm24k: string) => {
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
          if (!context) {
            return;
          }

          const decoded = pcm16Base64ToFloat32(base64Pcm24k);
          const samples = resampleFloat32(
            decoded,
            GEMINI_LIVE_CONFIG.modelOutputSampleRate,
            context.sampleRate,
          );
          if (samples.length === 0) {
            return;
          }

          const buffer = context.createBuffer(
            1,
            samples.length,
            context.sampleRate,
          );
          buffer.copyToChannel(samples, 0);

          let source = sourceRef.current;
          if (!source) {
            source = context.createBufferQueueSource();
            source.connect(context.destination);
            source.onBufferEnded = (event) => {
              if (event.isLastBufferInQueue && sourceRef.current === source) {
                releaseSource();
              }
            };
            source.enqueueBuffer(buffer);
            // 0.13.3 defaults offset to -1 (native "unspecified"), but JS
            // validation rejects negative offsets. Pass 0 so playback starts.
            source.start(0, 0);
            sourceRef.current = source;
          } else {
            source.enqueueBuffer(buffer);
          }
          playbackErrorReportedRef.current = false;
        })
        .catch(() => {
          releaseSource();
          if (!playbackErrorReportedRef.current) {
            playbackErrorReportedRef.current = true;
            onError("audio-playback");
          }
        });
    },
    [configure, onError, releaseSource],
  );

  const nextTurn = useCallback(() => {
    // A completed Gemini turn may still have audio in the native queue, so it
    // is intentionally allowed to finish. Only stopPlayback invalidates it.
  }, []);

  const stopPlayback = useCallback(async () => {
    if (Platform.OS === "web") {
      return;
    }

    generationRef.current += 1;
    releaseSource();
  }, [releaseSource]);

  const dispose = useCallback(async () => {
    if (Platform.OS === "web") {
      return;
    }

    generationRef.current += 1;
    const cleanup = queueRef.current
      .then(async () => {
        releaseSource();
        const context = contextRef.current;
        contextRef.current = null;
        initializationRef.current = null;
        await context?.close();
      })
      .catch(() => undefined);
    queueRef.current = cleanup;
    await cleanup;
  }, [releaseSource]);

  return {
    configure,
    dispose,
    nextTurn,
    playChunk,
    stopPlayback,
  };
}
