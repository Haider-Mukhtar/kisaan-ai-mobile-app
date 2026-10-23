import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLLM } from "react-native-executorch";

import type { LanguageCode } from "@/providers/language-provider";
import {
  OFFLINE_HISTORY_LIMIT,
  OFFLINE_MAX_INPUT_LENGTH,
} from "@/services/offline-llm/config";
import { mapOfflineLlmError } from "@/services/offline-llm/errors";
import {
  findMandiCity,
  findMandiRatesInQuestion,
  formatOfflineMandiPrice,
  formatOfflineMandiSellingAdvice,
  isMandiPriceFollowUp,
  isMandiPriceQuestion,
  isMandiSellingQuestion,
  loadMandiSnapshotForOfflineHelper,
} from "@/services/offline-llm/mandi";
import {
  buildOfflineSystemPrompt,
  sanitizeOfflineReply,
} from "@/services/offline-llm/prompt";
import {
  getOfflineModel,
  isOfflineModelCached,
} from "@/services/offline-llm/runtime";
import type {
  OfflineChatMessage,
  OfflineLlmErrorCode,
  OfflineLlmPhase,
} from "@/services/offline-llm/types";

type Options = {
  farmerContext: string;
  isOffline: boolean;
  isModelCached?: boolean;
  language: LanguageCode;
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useOfflineLlm({
  farmerContext,
  isOffline,
  isModelCached = false,
  language,
}: Options) {
  const model = useMemo(() => getOfflineModel(), []);
  const llm = useLLM({ model });
  const {
    configure,
    downloadProgress,
    error,
    generate,
    interrupt: interruptGeneration,
    isGenerating,
    isReady,
    response,
  } = llm;
  const [messages, setMessages] = useState<OfflineChatMessage[]>([]);
  const [generateError, setGenerateError] =
    useState<OfflineLlmErrorCode | null>(null);
  const [isResolvingRate, setIsResolvingRate] = useState(false);
  const [filesCached, setFilesCached] = useState(isModelCached);
  const sendingRef = useRef(false);
  const interruptedRef = useRef(false);
  const messagesRef = useRef<OfflineChatMessage[]>([]);

  useEffect(() => {
    if (isModelCached) {
      return;
    }

    let active = true;
    void isOfflineModelCached().then((cached) => {
      if (active) {
        setFilesCached(cached);
      }
    });

    return () => {
      active = false;
    };
  }, [isModelCached]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const systemPrompt = useMemo(
    () => buildOfflineSystemPrompt(language, farmerContext),
    [farmerContext, language],
  );

  useEffect(() => {
    if (!isReady) {
      return;
    }

    configure({
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        minP: 0.05,
        repetitionPenalty: 1.05,
        outputTokenBatchSize: 8,
        batchTimeInterval: 80,
      },
    });
  }, [configure, isReady]);

  const streamingText = sanitizeOfflineReply(response);
  const visibleMessages = useMemo(() => {
    if (!isGenerating) {
      return messages;
    }

    const last = messages.at(-1);
    if (!last || last.role !== "model" || !last.isStreaming) {
      return messages;
    }

    if (last.text === streamingText) {
      return messages;
    }

    return messages.map((message) =>
      message.id === last.id ? { ...message, text: streamingText } : message,
    );
  }, [isGenerating, messages, streamingText]);

  const phase: OfflineLlmPhase = useMemo(() => {
    if (error) {
      return "error";
    }

    if (isGenerating) {
      return "generating";
    }

    if (isReady) {
      return "ready";
    }

    if (filesCached || isModelCached || downloadProgress >= 1) {
      return "loading";
    }

    return "downloading";
  }, [downloadProgress, error, filesCached, isGenerating, isModelCached, isReady]);

  const errorCode: OfflineLlmErrorCode | null = error
    ? mapOfflineLlmError(error)
    : generateError;

  const sendMessage = useCallback(
    async (raw: string): Promise<boolean> => {
      const text = raw.trim().slice(0, OFFLINE_MAX_INPUT_LENGTH);
      if (!text || !isReady || isGenerating || sendingRef.current) {
        return false;
      }

      sendingRef.current = true;
      interruptedRef.current = false;
      setGenerateError(null);

      const userMessage: OfflineChatMessage = {
        id: createId(),
        role: "user",
        text,
        timestamp: Date.now(),
      };
      const assistantMessage: OfflineChatMessage = {
        id: createId(),
        role: "model",
        text: "",
        isStreaming: true,
        timestamp: Date.now(),
      };

      const historyForModel = [...messagesRef.current, userMessage]
        .filter((message) => message.text.trim())
        .slice(-OFFLINE_HISTORY_LIMIT)
        .map((message) => ({
          role:
            message.role === "user"
              ? ("user" as const)
              : ("assistant" as const),
          content: message.text,
        }));

      setMessages((current) => [...current, userMessage, assistantMessage]);

      try {
        const previousUserMessages = messagesRef.current
          .filter((message) => message.role === "user")
          .slice(-2);
        const previousUserMessage = previousUserMessages.at(-1);
        const previousPriceQuestion = [...previousUserMessages]
          .reverse()
          .find((message) =>
            isMandiPriceQuestion(message.text) &&
            !isMandiSellingQuestion(message.text),
          );
        const sellingQuestion = isMandiSellingQuestion(text);
        const priceQuestion = !sellingQuestion && isMandiPriceQuestion(text)
          ? text
          : isMandiPriceFollowUp(text)
            ? previousUserMessage && isMandiPriceQuestion(previousUserMessage.text) && !isMandiSellingQuestion(previousUserMessage.text)
              ? previousUserMessage.text
              : null
            : null;
        const marketAdviceQuestion = sellingQuestion || /\b(market|harvest)\b|منڈی/iu.test(text);
        if (priceQuestion || marketAdviceQuestion) {
          setIsResolvingRate(true);
        }
        const snapshot = priceQuestion || marketAdviceQuestion
          ? await loadMandiSnapshotForOfflineHelper(isOffline)
          : null;
        const matchedRates = findMandiRatesInQuestion(
          priceQuestion ?? text,
          snapshot,
        );

        if (sellingQuestion) {
          const contextualRates = matchedRates.length === 0 && /\b(this|that|it)\b|اس|یہ/iu.test(text)
            ? findMandiRatesInQuestion(previousPriceQuestion?.text ?? "", snapshot)
            : [];
          const sellingRates = matchedRates.length ? matchedRates : contextualRates;
          const directAnswer = sellingRates.length > 1
            ? language === "ur"
              ? "آپ کس فصل کو بیچنے کے بارے میں پوچھ رہے ہیں؟"
              : "Which crop are you thinking of selling?"
            : formatOfflineMandiSellingAdvice(
                text,
                sellingRates[0] ?? null,
                snapshot,
                language,
              );

          setMessages((current) =>
            current.map((message) =>
              message.id === assistantMessage.id
                ? { ...message, text: directAnswer, isStreaming: false }
                : message,
            ),
          );
          return true;
        }

        if (priceQuestion) {
          const directAnswer = !snapshot
            ? language === "ur"
              ? "اس فون میں منڈی کی محفوظ شدہ قیمتیں نہیں ہیں۔ انٹرنیٹ پر منڈی صفحہ کھول کر قیمتیں محفوظ کریں، پھر یہاں پوچھیں۔"
              : "No mandi prices are saved on this phone yet. Open the Mandi page while online to save rates, then ask again."
            : matchedRates.length > 1
              ? language === "ur"
                ? "آپ کس فصل کی منڈی قیمت پوچھ رہے ہیں؟"
                : "Which crop's mandi price do you mean?"
              : matchedRates.length === 0
                ? language === "ur"
                  ? "اس فصل کی قیمت محفوظ شدہ منڈی فہرست میں نہیں ملی۔ فصل کا نام بتائیں یا منڈی صفحہ دیکھیں۔"
                  : "I couldn't find that crop in the saved mandi rates. Please name a listed crop or check the Mandi page."
                : formatOfflineMandiPrice(
                    matchedRates[0],
                    snapshot,
                    language,
                    findMandiCity(priceQuestion) ?? findMandiCity(farmerContext),
                  );

          setMessages((current) =>
            current.map((message) =>
              message.id === assistantMessage.id
                ? { ...message, text: directAnswer, isStreaming: false }
                : message,
            ),
          );
          return true;
        }

        const prompt = marketAdviceQuestion && matchedRates.length === 1
          ? buildOfflineSystemPrompt(
              language,
              farmerContext,
              matchedRates[0],
              snapshot,
            )
          : systemPrompt;
        const reply = await generate([
          { role: "system", content: prompt },
          ...historyForModel,
        ]);
        const cleaned = sanitizeOfflineReply(reply);
        const fallback =
          language === "ur"
            ? "میں اس سوال کا واضح جواب نہیں دے سکا۔ براہ کرم کھیتی کے بارے میں ایک مختصر سوال پوچھیں۔"
            : "I could not form a clear answer. Please ask a shorter farming question.";

        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessage.id
              ? {
                  ...message,
                  text: cleaned || fallback,
                  isStreaming: false,
                }
              : message,
          ),
        );
        return true;
      } catch (caught) {
        if (interruptedRef.current) {
          interruptedRef.current = false;
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantMessage.id
                ? {
                    ...message,
                    isStreaming: false,
                    text:
                      sanitizeOfflineReply(message.text) ||
                      (language === "ur"
                        ? "جواب روک دیا گیا۔"
                        : "The answer was stopped."),
                  }
                : message,
            ),
          );
          return true;
        }

        const mapped = mapOfflineLlmError(caught);
        setGenerateError(mapped === "unknown" ? "generate" : mapped);
        setMessages((current) =>
          current.filter((message) => message.id !== assistantMessage.id),
        );
        return false;
      } finally {
        setIsResolvingRate(false);
        sendingRef.current = false;
        interruptedRef.current = false;
      }
    },
    [farmerContext, generate, isGenerating, isOffline, isReady, language, systemPrompt],
  );

  const clearMessages = useCallback(() => {
    interruptedRef.current = true;
    if (isGenerating) {
      interruptGeneration();
    }
    setMessages([]);
    setGenerateError(null);
  }, [interruptGeneration, isGenerating]);

  const interrupt = useCallback(() => {
    if (!isGenerating) {
      return;
    }

    interruptedRef.current = true;
    interruptGeneration();
  }, [interruptGeneration, isGenerating]);

  const dismissError = useCallback(() => {
    setGenerateError(null);
  }, []);

  return {
    clearMessages,
    dismissError,
    downloadProgress,
    errorCode,
    interrupt,
    isGenerating,
    isResolvingRate,
    isReady,
    loadError: error ? mapOfflineLlmError(error) : null,
    messages: visibleMessages,
    phase,
    sendMessage,
  };
}
