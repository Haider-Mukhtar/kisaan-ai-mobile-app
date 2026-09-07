import type { OfflineLlmErrorCode } from "@/services/offline-llm/types";

const MEMORY_CODES = new Set([33, 37, 49]);
const DOWNLOAD_CODES = new Set([103, 180]);
const UNSUPPORTED_CODES = new Set([16, 119, 187]);
const LOAD_CODES = new Set([32, 34, 35, 36, 102, 114, 120, 122]);

function readErrorCode(error: unknown): number | null {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }

  const code = (error as { code: unknown }).code;
  return typeof code === "number" ? code : null;
}

export function mapOfflineLlmError(error: unknown): OfflineLlmErrorCode {
  const code = readErrorCode(error);

  if (code === 118) {
    return "interrupted";
  }

  if (code !== null) {
    if (UNSUPPORTED_CODES.has(code)) return "unsupported";
    if (MEMORY_CODES.has(code)) return "memory";
    if (DOWNLOAD_CODES.has(code)) return "download";
    if (LOAD_CODES.has(code)) return "load";
  }

  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : typeof error === "string"
        ? error.toLowerCase()
        : "";

  if (message.includes("memory") || message.includes("out of")) {
    return "memory";
  }

  if (message.includes("download") || message.includes("network")) {
    return "download";
  }

  return "unknown";
}
