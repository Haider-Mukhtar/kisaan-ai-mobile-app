import type { PostgrestError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import type { ProfileRow, ProfileUpdate } from "@/types/database";

/** How the farmer's coordinates were obtained. */
export type LocationSource = "gps" | "manual" | "default";

const LOCATION_SOURCES: LocationSource[] = ["gps", "manual", "default"];

export type FarmLocation = {
  /** District id from `@/constants/districts`. */
  districtId: string;
  latitude: number;
  longitude: number;
  source: LocationSource;
};

export type FarmerProfile = {
  id: string;
  phone: string;
  fullName: string | null;
  village: string | null;
  city: string | null;
  farmSizeAcres: number | null;
  crops: string[];
  /** Null until the farmer finishes the location step. */
  location: FarmLocation | null;
  locationUpdatedAt: string | null;
  isComplete: boolean;
};

export type FarmProfileDraft = {
  fullName: string;
  village: string;
  city: string;
  farmSizeAcres: number | null;
  crops: string[];
};

export type ProfileResult<T> =
  | { data: T; error: null }
  | { data: null; error: PostgrestError };

function toLocationSource(value: string | null): LocationSource {
  return LOCATION_SOURCES.find((source) => source === value) ?? "manual";
}

function toFarmLocation(row: ProfileRow): FarmLocation | null {
  const latitude = Number(row.latitude ?? NaN);
  const longitude = Number(row.longitude ?? NaN);

  // Coordinates arrive as Postgres numerics and are absent on profiles created
  // before the location step existed, so both are checked before use.
  if (!row.district || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    districtId: row.district,
    latitude,
    longitude,
    source: toLocationSource(row.location_source),
  };
}

function toFarmerProfile(row: ProfileRow): FarmerProfile {
  return {
    id: row.id,
    phone: row.phone,
    fullName: row.full_name,
    village: row.village,
    city: row.city,
    farmSizeAcres: row.farm_size_acres,
    crops: row.crops ?? [],
    location: toFarmLocation(row),
    locationUpdatedAt: row.location_updated_at,
    isComplete: row.profile_completed_at !== null,
  };
}

export async function fetchProfile(
  userId: string,
): Promise<ProfileResult<FarmerProfile | null>> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  return { data: data ? toFarmerProfile(data) : null, error: null };
}

/**
 * Safety net for the `on_auth_user_created` trigger. The trigger is the primary
 * path, but an upsert here guarantees a row exists before onboarding writes to
 * it — for instance if the auth user predates this migration.
 */
export async function ensureProfile(
  userId: string,
  phoneE164: string,
): Promise<ProfileResult<FarmerProfile>> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, phone: phoneE164 }, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    return { data: null, error };
  }

  return { data: toFarmerProfile(data), error: null };
}

/**
 * Loads the profile, creating it from `fallbackPhone` when the row is missing.
 * A restored session can outlive its profile row — for instance an auth user
 * created before this table existed — and without seeding, onboarding would
 * have nothing to update.
 */
export async function loadOrSeedProfile(
  userId: string,
  fallbackPhone: string | null,
): Promise<ProfileResult<FarmerProfile | null>> {
  const existing = await fetchProfile(userId);

  if (existing.error || existing.data || !fallbackPhone) {
    return existing;
  }

  return ensureProfile(userId, fallbackPhone);
}

async function patchProfile(
  userId: string,
  patch: ProfileUpdate,
): Promise<ProfileResult<FarmerProfile>> {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error };
  }

  return { data: toFarmerProfile(data), error: null };
}

/**
 * Saves the farm details step. Setup is not finished here — the location step
 * that follows is what marks the profile complete — so a farmer who closes the
 * app midway comes back to a prefilled form instead of losing their answers.
 */
export async function saveFarmProfile(
  userId: string,
  draft: FarmProfileDraft,
): Promise<ProfileResult<FarmerProfile>> {
  return patchProfile(userId, {
    full_name: draft.fullName.trim() || null,
    village: draft.village.trim() || null,
    city: draft.city.trim() || null,
    farm_size_acres: draft.farmSizeAcres,
    crops: draft.crops,
  });
}

export async function saveFarmLocation(
  userId: string,
  location: FarmLocation,
  { completeSetup }: { completeSetup: boolean },
): Promise<ProfileResult<FarmerProfile>> {
  const now = new Date().toISOString();

  return patchProfile(userId, {
    district: location.districtId,
    latitude: location.latitude,
    longitude: location.longitude,
    location_source: location.source,
    location_updated_at: now,
    // Only stamped the first time, so it keeps meaning "when setup finished".
    ...(completeSetup ? { profile_completed_at: now } : {}),
  });
}
