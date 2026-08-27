import { useCallback, useState } from "react";

import { findNearestDistrict, type District } from "@/constants/districts";
import { useDeviceLocation } from "@/hooks/use-device-location";
import type { TranslationKey } from "@/providers/language-provider";
import { useProfile } from "@/providers/profile-provider";
import type { FarmLocation } from "@/services/supabase/profiles";

/**
 * Explains, in the farmer's language, why we are falling back to the district
 * list. Every failure path has one so the screen never just does nothing.
 */
export type LocationNotice = {
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  canOpenSettings: boolean;
};

/**
 * A fix this far from every district we know about is almost certainly not a
 * farm in Pakistan, so we ask instead of guessing.
 */
const MAX_DISTRICT_DISTANCE_KM = 250;

export type DetectedLocation = {
  location: FarmLocation;
  district: District;
};

export function useFarmLocation() {
  const { isRequesting, requestLocation } = useDeviceLocation();
  const { isSaving, saveLocation } = useProfile();
  const [notice, setNotice] = useState<LocationNotice | null>(null);

  const clearNotice = useCallback(() => setNotice(null), []);

  /**
   * Resolves the device position into a saveable location, or returns null
   * after setting a notice that tells the farmer what to do next.
   */
  const detect = useCallback(async (): Promise<DetectedLocation | null> => {
    setNotice(null);

    const outcome = await requestLocation();

    if (outcome.status === "granted") {
      const { district, distanceKm } = findNearestDistrict(
        outcome.latitude,
        outcome.longitude,
      );

      if (distanceKm > MAX_DISTRICT_DISTANCE_KM) {
        setNotice({
          titleKey: "locationUnavailableTitle",
          bodyKey: "locationUnavailableDescription",
          canOpenSettings: false,
        });

        return null;
      }

      return {
        district,
        // Exact coordinates give a better forecast; the district is the label
        // shown to the farmer and the key for the shared cache.
        location: {
          districtId: district.id,
          latitude: outcome.latitude,
          longitude: outcome.longitude,
          source: "gps",
        },
      };
    }

    if (outcome.status === "denied") {
      setNotice({
        titleKey: "locationDeniedTitle",
        bodyKey: outcome.canAskAgain
          ? "locationDeniedDescription"
          : "locationBlockedDescription",
        canOpenSettings: !outcome.canAskAgain,
      });

      return null;
    }

    if (outcome.status === "services-off") {
      setNotice({
        titleKey: "locationServicesOffTitle",
        bodyKey: "locationServicesOffDescription",
        canOpenSettings: true,
      });

      return null;
    }

    setNotice({
      titleKey: "locationUnavailableTitle",
      bodyKey: "locationUnavailableDescription",
      canOpenSettings: false,
    });

    return null;
  }, [requestLocation]);

  const saveDistrict = useCallback(
    (district: District, source: FarmLocation["source"]) =>
      saveLocation({
        districtId: district.id,
        latitude: district.latitude,
        longitude: district.longitude,
        source,
      }),
    [saveLocation],
  );

  return {
    isDetecting: isRequesting,
    isSaving,
    notice,
    clearNotice,
    detect,
    saveLocation,
    saveDistrict,
  };
}
