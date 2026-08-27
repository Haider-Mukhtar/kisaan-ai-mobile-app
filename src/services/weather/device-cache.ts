import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  usableSnapshot,
  type WeatherLocation,
  type WeatherSnapshot,
} from "@/services/weather/types";

/**
 * Last snapshot per district, kept on the phone so the home screen paints
 * instantly on open and still shows something on a train ride with no signal.
 */
const KEY_PREFIX = "kisaan-ai-weather:";

function storageKey(districtId: string) {
  return `${KEY_PREFIX}${districtId}`;
}

function isSnapshotShaped(value: unknown): value is WeatherSnapshot {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<WeatherSnapshot>;

  return (
    typeof candidate.fetchedAt === "string" &&
    Array.isArray(candidate.days) &&
    candidate.days.length > 0 &&
    typeof candidate.location?.districtId === "string" &&
    typeof candidate.location?.latitude === "number" &&
    typeof candidate.location?.longitude === "number"
  );
}

export async function readCachedSnapshot(
  location: WeatherLocation,
): Promise<WeatherSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(location.districtId));

    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);

    if (!isSnapshotShaped(parsed)) {
      await AsyncStorage.removeItem(storageKey(location.districtId));
      return null;
    }

    return usableSnapshot({ ...parsed, source: "device-cache" });
  } catch {
    // A cache miss and a corrupt cache are the same thing to the caller.
    return null;
  }
}

export async function writeCachedSnapshot(snapshot: WeatherSnapshot) {
  try {
    await AsyncStorage.setItem(
      storageKey(snapshot.location.districtId),
      JSON.stringify(snapshot),
    );
  } catch {
    // Caching is an optimisation; failing to store must never surface.
  }
}
