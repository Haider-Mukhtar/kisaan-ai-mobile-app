import { getDistrict, type ProvinceId } from "@/constants/districts";
import type { FarmerProfile } from "@/services/supabase/profiles";

const CROP_EN: Record<string, string> = {
  potato: "potato",
  tomato: "tomato",
  wheat: "wheat",
};

const PROVINCE_EN: Record<ProvinceId, string> = {
  punjab: "Punjab",
  sindh: "Sindh",
  kp: "Khyber Pakhtunkhwa",
  balochistan: "Balochistan",
  ict: "Islamabad Capital Territory",
  ajk: "Azad Jammu and Kashmir",
  gb: "Gilgit-Baltistan",
};

function cropLabel(cropId: string) {
  return CROP_EN[cropId] ?? cropId.replace(/-/g, " ");
}

/**
 * Turns the saved farm profile into a compact English block for Gemini.
 * Phone number is intentionally omitted.
 */
export function describeFarmerForGemini(
  profile: FarmerProfile | null,
): string {
  if (!profile) {
    return "";
  }

  const lines: string[] = [];

  if (profile.fullName?.trim()) {
    lines.push(`Name: ${profile.fullName.trim()}`);
  }
  if (profile.village?.trim()) {
    lines.push(`Village: ${profile.village.trim()}`);
  }
  if (profile.city?.trim()) {
    lines.push(`City: ${profile.city.trim()}`);
  }

  const district = getDistrict(profile.location?.districtId);
  if (district) {
    lines.push(
      `District: ${district.en}, ${PROVINCE_EN[district.province]}, Pakistan`,
    );
  }

  if (profile.farmSizeAcres !== null) {
    const acres =
      profile.farmSizeAcres === 1
        ? "1 acre"
        : `${profile.farmSizeAcres} acres`;
    lines.push(`Farm size: ${acres}`);
  }

  if (profile.crops.length > 0) {
    lines.push(`Crops grown: ${profile.crops.map(cropLabel).join(", ")}`);
  }

  if (profile.location) {
    lines.push(
      `Coordinates: ${profile.location.latitude.toFixed(4)}, ${profile.location.longitude.toFixed(4)}`,
    );
  }

  return lines.join("\n");
}
