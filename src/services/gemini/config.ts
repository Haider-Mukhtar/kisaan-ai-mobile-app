export const GEMINI_LIVE_CONFIG = {
  model: "gemini-3.1-flash-live-preview",
  websocketUrl:
    "wss://generativelanguage.googleapis.com/ws/" +
    "google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent",
  inputSampleRate: 16_000,
  modelOutputSampleRate: 24_000,
  audioChunkIntervalMs: 100,
  maxImageBytes: 8 * 1024 * 1024,
  maxReconnectAttempts: 3,
  reconnectBaseDelayMs: 1_000,
} as const;

export function getGeminiApiKey(): string | null {
  const value = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
  return value || null;
}

export function buildGeminiLiveUrl(apiKey: string): string {
  return `${GEMINI_LIVE_CONFIG.websocketUrl}?key=${encodeURIComponent(apiKey)}`;
}

export function buildSystemInstruction(language: "en" | "ur"): string {
  const responseLanguage =
    language === "ur"
      ? "Reply in clear, natural Urdu unless the farmer asks for another language."
      : "Reply in clear, simple English unless the farmer asks for another language.";

  return [
    "You are Kisaan AI, a concise and practical farming assistant for Pakistani farmers.",
    responseLanguage,
    "Use plain language and short actionable steps.",
    "When an image is provided, describe only what is visible and clearly state uncertainty.",
    "Do not claim a definite crop disease diagnosis from an image alone.",
    "For pesticides, fertilizers, animal health, dangerous weather, or urgent crop loss, recommend checking product labels and consulting a qualified local agriculture professional.",
    "Ask one focused follow-up question when essential information is missing.",
  ].join(" ");
}
