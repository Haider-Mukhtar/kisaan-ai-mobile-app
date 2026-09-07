import type { GeminiChatMessage } from "@/services/gemini/types";

export type OfflineLlmErrorCode =
  | "unsupported"
  | "download"
  | "interrupted"
  | "memory"
  | "load"
  | "generate"
  | "unknown";

export type OfflineLlmPhase =
  | "downloading"
  | "loading"
  | "ready"
  | "generating"
  | "error";

export type OfflineChatMessage = GeminiChatMessage;

export type OfflineModelCacheStatus =
  | "checking"
  | "missing"
  | "downloaded"
  | "unsupported";
