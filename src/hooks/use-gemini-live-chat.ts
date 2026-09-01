import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import { useGeminiAudioPlayer } from "@/hooks/use-gemini-audio-player";
import { useGeminiAudioStream } from "@/hooks/use-gemini-audio-stream";
import { useGeminiImage } from "@/hooks/use-gemini-image";
import { useLanguage } from "@/providers/language-provider";
import { useNetwork } from "@/providers/network-provider";
import { useProfile } from "@/providers/profile-provider";
import { describeFarmerForGemini } from "@/services/gemini/farmer-context";
import { GeminiLiveService } from "@/services/gemini/live-service";
import type {
  ChatRole,
  GeminiChatMessage,
  GeminiConnectionStatus,
  GeminiErrorCode,
} from "@/services/gemini/types";

export function useGeminiLiveChat() {
  const { language } = useLanguage();
  const { isOnline } = useNetwork();
  const { profile } = useProfile();
  const farmerContext = useMemo(
    () => describeFarmerForGemini(profile),
    [profile],
  );
  const [messages, setMessages] = useState<GeminiChatMessage[]>([]);
  const [status, setStatus] =
    useState<GeminiConnectionStatus>("idle");
  const [errorCode, setErrorCode] = useState<GeminiErrorCode | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);

  const serviceRef = useRef<GeminiLiveService | null>(null);
  const focusedRef = useRef(false);
  const isOnlineRef = useRef(isOnline);
  const idCounterRef = useRef(0);
  const activeBubbleRef = useRef<Record<ChatRole, string | null>>({
    model: null,
    user: null,
  });
  const transcriptRef = useRef<Record<ChatRole, string>>({
    model: "",
    user: "",
  });
  isOnlineRef.current = isOnline;

  const handleError = useCallback((code: GeminiErrorCode) => {
    setErrorCode(code);
  }, []);

  const { configure, dispose, nextTurn, playChunk, stopPlayback } =
    useGeminiAudioPlayer({ onError: handleError });

  const sendAudioChunk = useCallback((base64: string) => {
    serviceRef.current?.sendAudioChunk(base64);
  }, []);

  const { isRecordingRef, startRecording, stopRecording } =
    useGeminiAudioStream({
      onChunk: sendAudioChunk,
      onError: handleError,
    });

  const {
    chooseFromLibrary,
    clearImage,
    image,
    takePhoto,
  } = useGeminiImage({ onError: handleError });

  const createId = useCallback(() => {
    idCounterRef.current += 1;
    return `${Date.now()}-${idCounterRef.current}`;
  }, []);

  const appendMessage = useCallback((message: GeminiChatMessage) => {
    setMessages((current) => [...current, message]);
  }, []);

  const updateMessage = useCallback(
    (id: string, updates: Partial<GeminiChatMessage>) => {
      setMessages((current) =>
        current.map((message) =>
          message.id === id ? { ...message, ...updates } : message,
        ),
      );
    },
    [],
  );

  const appendTranscript = useCallback(
    (text: string, role: ChatRole) => {
      if (!text) {
        return;
      }

      let bubbleId = activeBubbleRef.current[role];
      if (!bubbleId) {
        bubbleId = createId();
        activeBubbleRef.current[role] = bubbleId;
        transcriptRef.current[role] = "";
        appendMessage({
          id: bubbleId,
          isStreaming: true,
          role,
          text: "",
          timestamp: Date.now(),
        });
      }

      transcriptRef.current[role] += text;
      updateMessage(bubbleId, {
        isStreaming: true,
        text: transcriptRef.current[role],
      });
    },
    [appendMessage, createId, updateMessage],
  );

  const finalizeTurn = useCallback(() => {
    const activeIds = Object.values(activeBubbleRef.current).filter(
      (id): id is string => Boolean(id),
    );
    if (activeIds.length > 0) {
      setMessages((current) =>
        current.map((message) =>
          activeIds.includes(message.id)
            ? { ...message, isStreaming: false }
            : message,
        ),
      );
    }

    activeBubbleRef.current = { model: null, user: null };
    transcriptRef.current = { model: "", user: "" };
    setIsModelSpeaking(false);
    nextTurn();
  }, [nextTurn]);

  const handleAudioChunk = useCallback(
    (base64: string) => {
      setIsModelSpeaking(true);
      playChunk(base64);
    },
    [playChunk],
  );

  const handleInterrupted = useCallback(() => {
    setIsModelSpeaking(false);
    void stopPlayback();
    finalizeTurn();
  }, [finalizeTurn, stopPlayback]);

  const stopMic = useCallback(
    async (notifyGemini: boolean) => {
      const wasRecording = isRecordingRef.current;
      await stopRecording();
      setIsRecording(false);
      if (wasRecording && notifyGemini) {
        serviceRef.current?.sendAudioStreamEnd();
      }
    },
    [isRecordingRef, stopRecording],
  );

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      void configure().catch(() => undefined);

      const service = new GeminiLiveService({
        callbacks: {
          onAudioChunk: handleAudioChunk,
          onError: handleError,
          onInterrupted: handleInterrupted,
          onSessionRestarted: () => handleError("session-restarted"),
          onStatusChange: setStatus,
          onTranscript: appendTranscript,
          onTurnComplete: finalizeTurn,
        },
        farmerContext,
        language,
      });
      serviceRef.current = service;
      if (isOnlineRef.current) {
        service.connect();
      }

      const appStateSubscription = AppState.addEventListener(
        "change",
        (nextState) => {
          if (nextState !== "active") {
            void stopMic(true).finally(() => service.disconnect());
            void stopPlayback();
          } else if (focusedRef.current && isOnlineRef.current) {
            service.connect();
          }
        },
      );

      return () => {
        focusedRef.current = false;
        appStateSubscription.remove();
        void stopMic(false);
        void dispose();
        service.disconnect();
        if (serviceRef.current === service) {
          serviceRef.current = null;
        }
      };
    }, [
      appendTranscript,
      configure,
      dispose,
      farmerContext,
      finalizeTurn,
      handleAudioChunk,
      handleError,
      handleInterrupted,
      language,
      stopMic,
      stopPlayback,
    ]),
  );

  useEffect(() => {
    if (!focusedRef.current) {
      return;
    }

    if (!isOnline) {
      void stopMic(false);
      void stopPlayback();
      serviceRef.current?.disconnect();
      return;
    }

    serviceRef.current?.connect();
  }, [isOnline, stopMic, stopPlayback]);

  const stopModelAudio = useCallback(() => {
    setIsModelSpeaking(false);
    void stopPlayback();
  }, [stopPlayback]);

  const sendMessage = useCallback(
    (text: string): boolean => {
      const trimmed = text.trim();
      const service = serviceRef.current;
      if (!service?.isConnected || (!trimmed && !image)) {
        if (!service?.isConnected) {
          handleError("send");
        }
        return false;
      }

      stopModelAudio();
      const prompt =
        trimmed ||
        (language === "ur"
          ? "اس تصویر کو دیکھ کر واضح کریں کہ فصل میں کیا مسئلہ نظر آ رہا ہے اور اگلا محفوظ قدم کیا ہونا چاہیے۔"
          : "Examine this crop image, explain what may be visible, and suggest the next safe step.");
      const sent = service.sendTurn({
        image: image
          ? { base64: image.base64, mimeType: image.mimeType }
          : undefined,
        text: prompt,
      });
      if (!sent) {
        return false;
      }

      appendMessage({
        id: createId(),
        imageUri: image?.uri,
        role: "user",
        text: trimmed,
        timestamp: Date.now(),
      });
      clearImage();
      return true;
    },
    [
      appendMessage,
      clearImage,
      createId,
      handleError,
      image,
      language,
      stopModelAudio,
    ],
  );

  const startVoice = useCallback(
    async (contextText: string): Promise<boolean> => {
      const service = serviceRef.current;
      if (!service?.isConnected) {
        handleError("send");
        return false;
      }

      stopModelAudio();
      const started = await startRecording();
      if (!started) {
        return false;
      }

      setIsRecording(true);
      const trimmed = contextText.trim();
      if (trimmed || image) {
        const contextPrompt = image
          ? `${trimmed ? `${trimmed}\n` : ""}${
              language === "ur"
                ? "اس تصویر کو میری اگلی آواز کے ساتھ سیاق کے طور پر استعمال کریں۔"
                : "Use this image as context for the voice message that follows."
            }`
          : `${trimmed}\n${
              language === "ur"
                ? "اس نوٹ کو میری اگلی آواز کے ساتھ سیاق کے طور پر استعمال کریں۔"
                : "Use this note as context for the voice message that follows."
            }`;

        service.sendTurn({
          image: image
            ? { base64: image.base64, mimeType: image.mimeType }
            : undefined,
          text: contextPrompt,
        });

        const bubbleId = createId();
        activeBubbleRef.current.user = bubbleId;
        transcriptRef.current.user = trimmed
          ? `${trimmed}${trimmed.endsWith(" ") ? "" : " "}`
          : "";
        appendMessage({
          id: bubbleId,
          imageUri: image?.uri,
          isStreaming: true,
          role: "user",
          text: trimmed,
          timestamp: Date.now(),
        });
        clearImage();
      }

      return true;
    },
    [
      appendMessage,
      clearImage,
      createId,
      handleError,
      image,
      language,
      startRecording,
      stopModelAudio,
    ],
  );

  const toggleMic = useCallback(
    async (contextText: string): Promise<boolean> => {
      if (isRecordingRef.current) {
        await stopMic(true);
        return false;
      }
      return startVoice(contextText);
    },
    [isRecordingRef, startVoice, stopMic],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    activeBubbleRef.current = { model: null, user: null };
    transcriptRef.current = { model: "", user: "" };
    void stopMic(false);
    stopModelAudio();
    serviceRef.current?.reconnect(true);
  }, [stopMic, stopModelAudio]);

  return {
    chooseFromLibrary,
    clearImage,
    clearMessages,
    dismissError: useCallback(() => setErrorCode(null), []),
    errorCode,
    image,
    isModelSpeaking,
    isRecording,
    messages,
    reconnect: useCallback(() => serviceRef.current?.reconnect(), []),
    sendMessage,
    status,
    stopModelAudio,
    takePhoto,
    toggleMic,
  };
}
