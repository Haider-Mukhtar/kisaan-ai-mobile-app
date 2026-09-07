import AsyncStorage from "@react-native-async-storage/async-storage";

import type { BlogSnapshot } from "@/services/blogs/types";

const CACHE_KEY = "kisaan-ai-ir-farm-blogs-v1";

let memorySnapshot: BlogSnapshot | null = null;

function isBlogSnapshot(value: unknown): value is BlogSnapshot {
  if (typeof value !== "object" || value === null) return false;

  const snapshot = value as Partial<BlogSnapshot>;
  return (
    typeof snapshot.fetchedAt === "string" &&
    Array.isArray(snapshot.articles) &&
    snapshot.articles.length > 0
  );
}

export function getRememberedBlogs() {
  return memorySnapshot;
}

export async function readCachedBlogs(): Promise<BlogSnapshot | null> {
  if (memorySnapshot) return memorySnapshot;

  try {
    const stored = await AsyncStorage.getItem(CACHE_KEY);
    if (!stored) return null;

    const parsed: unknown = JSON.parse(stored);
    if (!isBlogSnapshot(parsed)) return null;

    memorySnapshot = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeCachedBlogs(snapshot: BlogSnapshot) {
  memorySnapshot = snapshot;

  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Live articles should remain visible even if the device cache is full.
  }
}
