export function initOfflineLlmRuntime(): void {}

export function getOfflineModel(): never {
  throw new Error("The offline farm helper is not available on web.");
}

export function isOfflineLlmSupported(): boolean {
  return false;
}

export async function isOfflineModelCached(): Promise<boolean> {
  return false;
}

export async function getOfflineModelDownloadBytes(): Promise<number | null> {
  return null;
}
