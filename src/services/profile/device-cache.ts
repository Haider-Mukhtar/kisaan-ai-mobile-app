import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  FarmLocation,
  FarmerProfile,
  LocationSource,
} from "@/services/supabase/profiles";

/**
 * Last known farm profile per signed-in user, kept on the phone so the rest
 * of the app — including Gemini — still has crops and location with no signal.
 */
const KEY_PREFIX = "kisaan-ai-profile:";
const LOCATION_SOURCES: LocationSource[] = ["gps", "manual", "default"];

function storageKey(userId: string) {
  return `${KEY_PREFIX}${userId}`;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isFarmLocation(value: unknown): value is FarmLocation {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<FarmLocation>;

  return (
    typeof candidate.districtId === "string" &&
    typeof candidate.latitude === "number" &&
    Number.isFinite(candidate.latitude) &&
    typeof candidate.longitude === "number" &&
    Number.isFinite(candidate.longitude) &&
    LOCATION_SOURCES.includes(candidate.source as LocationSource)
  );
}

function isFarmerProfile(value: unknown): value is FarmerProfile {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<FarmerProfile>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.phone === "string" &&
    isNullableString(candidate.fullName) &&
    isNullableString(candidate.village) &&
    isNullableString(candidate.city) &&
    (candidate.farmSizeAcres === null ||
      (typeof candidate.farmSizeAcres === "number" &&
        Number.isFinite(candidate.farmSizeAcres))) &&
    Array.isArray(candidate.crops) &&
    candidate.crops.every((crop) => typeof crop === "string") &&
    (candidate.location === null || isFarmLocation(candidate.location)) &&
    isNullableString(candidate.locationUpdatedAt) &&
    typeof candidate.isComplete === "boolean"
  );
}

export async function readCachedProfile(
  userId: string,
): Promise<FarmerProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));

    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);

    if (!isFarmerProfile(parsed) || parsed.id !== userId) {
      await AsyncStorage.removeItem(storageKey(userId));
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function writeCachedProfile(profile: FarmerProfile) {
  try {
    await AsyncStorage.setItem(
      storageKey(profile.id),
      JSON.stringify(profile),
    );
  } catch {
    // Caching is an optimisation; failing to store must never surface.
  }
}
