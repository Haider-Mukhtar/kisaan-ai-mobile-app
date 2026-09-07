/** Quantized Qwen3 0.6B plus tokenizer, used when HEAD size is unknown. */
export const OFFLINE_MODEL_SIZE_FALLBACK_BYTES = 400 * 1024 * 1024;

export const OFFLINE_MAX_INPUT_LENGTH = 4_000;
export const OFFLINE_HISTORY_LIMIT = 8;

export function formatOfflineSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 10) {
    return `~${Math.round(mb)} MB`;
  }

  if (mb >= 1) {
    return `~${mb.toFixed(1)} MB`;
  }

  return `~${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function filenameFromResourceUri(uri: string): string {
  const withoutProtocol = uri.replace(/^https?:\/\//, "");
  const withoutHash = withoutProtocol.split("#")[0] ?? withoutProtocol;
  return withoutHash.replace(/[^a-zA-Z0-9._-]/g, "_");
}
