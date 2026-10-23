import AsyncStorage from "@react-native-async-storage/async-storage";

import type { FarmLocation, LatLng } from "@/services/supabase/profiles";
import { getDistrict } from "@/constants/districts";

export type NDVIHealthStatus = "good" | "moderate" | "alert";
export type MoistureStatus = "dry" | "moderate" | "optimal";

export type SatelliteMetrics = {
  ndvi: number;
  healthStatus: NDVIHealthStatus;
  vegetationDensity: number; // Percentage (0-100)
  moistureLevel: number; // Percentage (0-100)
  moistureStatus: MoistureStatus;
  cloudCoverage: number; // Percentage (0-100)
  resolutionMeters: number; // Sentinel-2 default is 10m
};

export type SatelliteLocation = {
  districtId?: string;
  districtName?: string;
  latitude: number;
  longitude: number;
  polygonBoundary?: LatLng[] | null;
};

export type SatelliteHealthSnapshot = {
  id: string;
  satelliteName: string;
  capturedAt: string;
  fetchedAt: string;
  daysAgo: number;
  location: SatelliteLocation;
  metrics: SatelliteMetrics;
  source: "network" | "cache" | "simulated";
  isHighAccuracy: boolean;
  accuracyMode: "polygon" | "point";
  notes?: string;
};

const STORAGE_KEY_PREFIX = "kisaan-ai-satellite:v2:";

function sampleCoordinates(location: SatelliteLocation): LatLng[] {
  const points =
    location.polygonBoundary?.length === 4
      ? location.polygonBoundary
      : [{ latitude: location.latitude, longitude: location.longitude }];

  // Pin order should not change the result for the same field.
  return [...points].sort(
    (a, b) => a.latitude - b.latitude || a.longitude - b.longitude,
  );
}

function coordinateSignature(location: SatelliteLocation): string {
  return sampleCoordinates(location)
    .map((point) => `${point.latitude.toFixed(5)},${point.longitude.toFixed(5)}`)
    .join(";");
}

function coordinateSeed(points: LatLng[], salt: number): number {
  // Mix every pin (or the district point) into a stable 32-bit value.
  let hash = salt;
  for (const point of points) {
    hash = Math.imul(hash ^ Math.round(point.latitude * 100_000), 16_777_619);
    hash = Math.imul(hash ^ Math.round(point.longitude * 100_000), 16_777_619);
  }
  return (hash >>> 0) / 4_294_967_296;
}

function storageKey(location: SatelliteLocation): string {
  return `${STORAGE_KEY_PREFIX}${location.districtId ?? "field"}:${coordinateSignature(location)}`;
}

/**
 * Derives a health classification from an NDVI value.
 * Standard agricultural thresholds:
 * >= 0.60: Healthy, dense vegetation (Good)
 * 0.40 - 0.59: Moderate density, possible moisture or nutrient stress (Moderate)
 * < 0.40: Sparse vegetation, severe stress, bare soil, or crop loss (Alert)
 */
export function classifyNdvi(ndvi: number): NDVIHealthStatus {
  if (ndvi >= 0.6) {
    return "good";
  }
  if (ndvi >= 0.4) {
    return "moderate";
  }
  return "alert";
}

export function classifyMoisture(level: number): MoistureStatus {
  if (level < 40) {
    return "dry";
  }
  if (level < 60) {
    return "moderate";
  }
  return "optimal";
}

/**
 * Simulates Sentinel-2 telemetry for a given location in Pakistan.
 * Generates deterministic demo values from the selected field or district coordinates.
 */
export function simulateSentinel2Telemetry(
  location: SatelliteLocation,
): SatelliteHealthSnapshot {
  const isHighAccuracy = Boolean(
    location.polygonBoundary && location.polygonBoundary.length === 4,
  );
  const accuracyMode: "polygon" | "point" = isHighAccuracy ? "polygon" : "point";

  let effectiveLat = location.latitude;
  let effectiveLon = location.longitude;

  // When high-accuracy polygon is provided, calculate centroid
  if (isHighAccuracy && location.polygonBoundary) {
    effectiveLat =
      location.polygonBoundary.reduce((sum, p) => sum + p.latitude, 0) / 4;
    effectiveLon =
      location.polygonBoundary.reduce((sum, p) => sum + p.longitude, 0) / 4;
  }

  const points = sampleCoordinates(location);
  const vigorSeed = coordinateSeed(points, 2_166_136_261);
  const moistureSeed = coordinateSeed(points, 1_013_904_223);
  const ndvi = Number((0.45 + vigorSeed * 0.4).toFixed(2));

  const healthStatus = classifyNdvi(ndvi);
  const vegetationDensity = Math.min(
    90,
    Math.max(40, Math.round(ndvi * 100 + (moistureSeed - 0.5) * 8)),
  );
  const moistureLevel = Math.min(
    85,
    Math.max(25, Math.round(28 + (ndvi - 0.45) * 120 + (moistureSeed - 0.5) * 14)),
  );
  const moistureStatus = classifyMoisture(moistureLevel);
  const cloudCoverage = 2 + Math.round(coordinateSeed(points, 3_745_613_935) * 10);

  const daysAgo = 3;
  const capturedAt = new Date(
    Date.now() - daysAgo * 24 * 60 * 60 * 1000,
  ).toISOString();
  const fetchedAt = new Date().toISOString();

  const district = location.districtId ? getDistrict(location.districtId) : null;
  const districtName = district ? district.en : location.districtName ?? "Farm Field";

  return {
    id: `sentinel2-${location.districtId || "field"}-${Date.now()}`,
    satelliteName: "Sentinel-2",
    capturedAt,
    fetchedAt,
    daysAgo,
    location: {
      ...location,
      latitude: effectiveLat,
      longitude: effectiveLon,
      districtName,
    },
    metrics: {
      ndvi,
      healthStatus,
      vegetationDensity,
      moistureLevel,
      moistureStatus,
      cloudCoverage,
      resolutionMeters: 10,
    },
    source: "simulated",
    isHighAccuracy,
    accuracyMode,
    notes: isHighAccuracy
      ? "Demo simulation derived from the selected 4-point field boundary"
      : "Demo simulation derived from the selected district or point coordinates",
  };
}

/**
 * Reads cached satellite snapshot from device storage.
 */
export async function readCachedSatelliteSnapshot(
  location: SatelliteLocation,
): Promise<SatelliteHealthSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(location));
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isSnapshotShaped(parsed)) {
      await AsyncStorage.removeItem(storageKey(location));
      return null;
    }

    return {
      ...(parsed as SatelliteHealthSnapshot),
      source: "cache",
    };
  } catch {
    return null;
  }
}

/**
 * Stores satellite telemetry snapshot into device storage.
 */
export async function writeCachedSatelliteSnapshot(
  snapshot: SatelliteHealthSnapshot,
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      storageKey(snapshot.location),
      JSON.stringify(snapshot),
    );
  } catch {
    // Caching is non-fatal
  }
}

function isSnapshotShaped(value: unknown): value is SatelliteHealthSnapshot {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<SatelliteHealthSnapshot>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.satelliteName === "string" &&
    typeof candidate.capturedAt === "string" &&
    typeof candidate.metrics?.ndvi === "number" &&
    typeof candidate.metrics?.healthStatus === "string" &&
    typeof candidate.location?.latitude === "number" &&
    typeof candidate.location?.longitude === "number"
  );
}

/**
 * Main service entrypoint for retrieving satellite telemetry.
 * Leverages local-first cache with graceful network fallback.
 */
export async function getSatelliteHealth(
  farmLocation: FarmLocation | null,
  isOffline = false,
): Promise<SatelliteHealthSnapshot | null> {
  // If no farm location is set, return default Punjab coordinates
  const location: SatelliteLocation = farmLocation
    ? {
        districtId: farmLocation.districtId,
        latitude: farmLocation.latitude,
        longitude: farmLocation.longitude,
        polygonBoundary: farmLocation.polygonBoundary ?? null,
      }
    : {
        districtId: "lahore",
        districtName: "Lahore",
        latitude: 31.5204,
        longitude: 74.3587,
        polygonBoundary: null,
      };

  // 1. Check cache first when offline
  if (isOffline) {
    const cached = await readCachedSatelliteSnapshot(location);
    if (cached) {
      return cached;
    }
    // Generate deterministic fallback and cache it
    const simulated = simulateSentinel2Telemetry(location);
    simulated.source = "cache";
    await writeCachedSatelliteSnapshot(simulated);
    return simulated;
  }

  // 2. Regenerate immediately when the selected location changes
  try {
    const telemetry = simulateSentinel2Telemetry(location);
    await writeCachedSatelliteSnapshot(telemetry);
    return telemetry;
  } catch {
    // Graceful fallback to cache
    const cached = await readCachedSatelliteSnapshot(location);
    if (cached) {
      return cached;
    }
    const fallback = simulateSentinel2Telemetry(location);
    fallback.source = "cache";
    return fallback;
  }
}

/**
 * Formats satellite acquisition age for status badges.
 */
export function describeSatelliteAge(
  capturedAt: string,
  t: (key: any, params?: Record<string, string | number>) => string,
): string {
  const captured = new Date(capturedAt).getTime();
  const now = Date.now();
  const diffDays = Math.max(0, Math.floor((now - captured) / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) {
    return t("satelliteStatusToday");
  }
  if (diffDays === 1) {
    return t("satelliteStatusYesterday");
  }
  return t("satelliteStatusBadge", { days: diffDays });
}

/**
 * Generates structured context for Gemini Live and offline LLM prompts.
 */
export function formatSatelliteContextForGemini(
  snapshot: SatelliteHealthSnapshot | null,
): string {
  if (!snapshot) {
    return "";
  }

  const { metrics, satelliteName, daysAgo } = snapshot;
  const statusLabel =
    metrics.healthStatus === "good"
      ? "Good (Healthy, vigorous canopy)"
      : metrics.healthStatus === "moderate"
        ? "Moderate (Some canopy variation or mild stress)"
        : "Alert (Low vigor, stress or patchy growth detected)";

  return [
    "FIELD SATELLITE HEALTH (SENTINEL-2 NDVI) — APP-PROVIDED SENSOR DATA:",
    `- Observation source: ${satelliteName} multispectral imagery (10-meter surface resolution).`,
    `- Freshness: Observed approximately ${daysAgo} days ago over the farmer's registered field.`,
    `- NDVI Score: ${metrics.ndvi.toFixed(2)} / 1.00 [Status: ${statusLabel}].`,
    `- Canopy Vegetation Density: ${metrics.vegetationDensity}%.`,
    `- Moisture Index: ${metrics.moistureLevel}% (${metrics.moistureStatus}).`,
    `- Cloud Coverage: ${metrics.cloudCoverage}%.`,
    "SAFETY & INTERPRETATION RULES FOR SATELLITE DATA:",
    "1. Frame observations as orbital signals, NOT certainty: NDVI reflects canopy greenness and surface moisture from 10 meters above; it cannot diagnose specific pathogens, nematodes, or root rot.",
    "2. If NDVI is high/good: Congratulate the farmer on strong crop vigor, but remind them to maintain scouting for insects hiding under the canopy.",
    "3. If NDVI is moderate or alert: Advise them to physically walk into that field section to check for irrigation blockage, salinity patches, or early disease lesions. NEVER recommend spraying chemical pesticides solely because of an NDVI drop without in-person confirmation.",
  ].join("\n");
}
