import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

export type DeviceLocationOutcome =
  | { status: "granted"; latitude: number; longitude: number }
  | { status: "denied"; canAskAgain: boolean }
  | { status: "services-off" }
  /** Permission was granted but no fix arrived, e.g. indoors or in a shed. */
  | { status: "unavailable" };

/**
 * A rough fix is plenty for a district-level forecast, and asking for less
 * accuracy means the GPS chip is often skipped entirely — faster, and easier on
 * the battery of the cheap phones this app targets.
 */
const FIX_TIMEOUT_MS = 15000;
const LAST_KNOWN_MAX_AGE_MS = 10 * 60 * 1000;
const LAST_KNOWN_REQUIRED_ACCURACY_M = 5000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);

    promise
      .then((value) => resolve(value))
      .catch(() => resolve(null))
      .finally(() => clearTimeout(timer));
  });
}

export function useDeviceLocation() {
  const [isRequesting, setIsRequesting] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const requestLocation =
    useCallback(async (): Promise<DeviceLocationOutcome> => {
      setIsRequesting(true);

      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!permission.granted) {
          return { status: "denied", canAskAgain: permission.canAskAgain };
        }

        if (!(await Location.hasServicesEnabledAsync())) {
          return { status: "services-off" };
        }

        const lastKnown = await withTimeout(
          Location.getLastKnownPositionAsync({
            maxAge: LAST_KNOWN_MAX_AGE_MS,
            requiredAccuracy: LAST_KNOWN_REQUIRED_ACCURACY_M,
          }),
          FIX_TIMEOUT_MS,
        );

        const position =
          lastKnown ??
          (await withTimeout(
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Low,
            }),
            FIX_TIMEOUT_MS,
          ));

        if (!position) {
          return { status: "unavailable" };
        }

        return {
          status: "granted",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } catch {
        return { status: "unavailable" };
      } finally {
        if (isMountedRef.current) {
          setIsRequesting(false);
        }
      }
    }, []);

  return { isRequesting, requestLocation };
}
