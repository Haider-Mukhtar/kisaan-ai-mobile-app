import { initExecutorch, isAvailable, models } from "react-native-executorch";
import { ExpoResourceFetcher } from "react-native-executorch-expo-resource-fetcher";
import { Platform } from "react-native";

import { filenameFromResourceUri } from "@/services/offline-llm/config";

let didInit = false;

export function initOfflineLlmRuntime(): void {
  if (didInit) {
    return;
  }

  didInit = true;
  initExecutorch({
    resourceFetcher: ExpoResourceFetcher,
  });
}

initOfflineLlmRuntime();

export function getOfflineModel() {
  return models.llm.qwen3_0_6b();
}

export function isOfflineLlmSupported(): boolean {
  return Platform.OS !== "web" && isAvailable;
}

function requiredFilenames(): string[] {
  const model = getOfflineModel();
  return [
    String(model.modelSource),
    String(model.tokenizerSource),
    String(model.tokenizerConfigSource),
  ].map(filenameFromResourceUri);
}

export async function isOfflineModelCached(): Promise<boolean> {
  if (!isOfflineLlmSupported()) {
    return false;
  }

  try {
    const files = await ExpoResourceFetcher.listDownloadedFiles();
    const needed = requiredFilenames();
    if (needed.length === 0) {
      return false;
    }

    return needed.every((name) =>
      files.some((path) => path.includes(name)),
    );
  } catch {
    return false;
  }
}

export async function getOfflineModelDownloadBytes(): Promise<number | null> {
  if (!isOfflineLlmSupported()) {
    return null;
  }

  try {
    const model = getOfflineModel();
    const bytes = await ExpoResourceFetcher.getFilesTotalSize(
      model.modelSource,
      model.tokenizerSource,
      model.tokenizerConfigSource,
    );
    return Number.isFinite(bytes) && bytes > 0 ? bytes : null;
  } catch {
    return null;
  }
}
