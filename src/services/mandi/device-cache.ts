import AsyncStorage from "@react-native-async-storage/async-storage";

import type { MandiSnapshot } from "@/services/mandi/types";

const CACHE_KEY = "kisaan-ai-mandi-rates-v1";

function isSnapshot(value: unknown): value is MandiSnapshot {
  if (typeof value !== "object" || value === null) return false;

  const snapshot = value as Partial<MandiSnapshot>;
  return (
    Array.isArray(snapshot.rates) &&
    snapshot.rates.length > 0 &&
    typeof snapshot.fetchedAt === "string"
  );
}

export async function readCachedMandiRates(): Promise<MandiSnapshot | null> {
  try {
    const value = await AsyncStorage.getItem(CACHE_KEY);
    if (!value) return null;

    const parsed: unknown = JSON.parse(value);
    return isSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function writeCachedMandiRates(snapshot: MandiSnapshot) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // A cache failure should never hide successfully downloaded live rates.
  }
}
