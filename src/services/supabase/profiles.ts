import type { PostgrestError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import type { ProfileRow, ProfileUpdate } from "@/types/database";

export type FarmerProfile = {
  id: string;
  phone: string;
  fullName: string | null;
  village: string | null;
  farmSizeAcres: number | null;
  crops: string[];
  isComplete: boolean;
};

export type FarmProfileDraft = {
  fullName: string;
  village: string;
  farmSizeAcres: number | null;
  crops: string[];
};

export type ProfileResult<T> =
  | { data: T; error: null }
  | { data: null; error: PostgrestError };

function toFarmerProfile(row: ProfileRow): FarmerProfile {
  return {
    id: row.id,
    phone: row.phone,
    fullName: row.full_name,
    village: row.village,
    farmSizeAcres: row.farm_size_acres,
    crops: row.crops ?? [],
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

export async function saveFarmProfile(
  userId: string,
  draft: FarmProfileDraft,
): Promise<ProfileResult<FarmerProfile>> {
  const patch: ProfileUpdate = {
    full_name: draft.fullName.trim() || null,
    village: draft.village.trim() || null,
    farm_size_acres: draft.farmSizeAcres,
    crops: draft.crops,
    profile_completed_at: new Date().toISOString(),
  };

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
