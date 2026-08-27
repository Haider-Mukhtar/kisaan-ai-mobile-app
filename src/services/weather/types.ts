export type WeatherLocation = {
  /** District id from `@/constants/districts`, also the shared cache key. */
  districtId: string;
  latitude: number;
  longitude: number;
};

export type DailyForecast = {
  /** Calendar day in Pakistan time, `YYYY-MM-DD`. */
  date: string;
  weatherCode: number;
  tempMaxC: number;
  tempMinC: number;
  precipitationMm: number;
  precipitationChance: number | null;
  windMaxKph: number | null;
};

export type CurrentWeather = {
  tempC: number;
  humidity: number | null;
  windKph: number | null;
  weatherCode: number;
};

/**
 * Where a snapshot came from, so the UI can tell a farmer whether they are
 * looking at live numbers or something we kept from an earlier session.
 */
export type WeatherSource = "live" | "shared-cache" | "device-cache";

export type WeatherSnapshot = {
  location: WeatherLocation;
  /** Null when the snapshot came from a cache that only holds daily values. */
  current: CurrentWeather | null;
  /** Today first, then upcoming days. Never empty. */
  days: DailyForecast[];
  fetchedAt: string;
  source: WeatherSource;
};

export type WeatherErrorKind = "offline" | "timeout" | "network" | "response";

export type WeatherError = {
  kind: WeatherErrorKind;
  message: string;
};

/** Within this age a snapshot is shown as-is and no refetch is attempted. */
export const WEATHER_FRESH_MS = 3 * 60 * 60 * 1000;

/** Pakistan has no daylight saving, so the UTC+5 shift is always correct. */
const PAKISTAN_UTC_OFFSET_MS = 5 * 60 * 60 * 1000;

export function pakistanDate(now: Date = new Date()): string {
  return new Date(now.getTime() + PAKISTAN_UTC_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

/** Weekday index (0 = Sunday) for a `YYYY-MM-DD` day, free of timezone drift. */
export function weekdayIndex(date: string): number {
  const parsed = new Date(`${date}T12:00:00Z`);

  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getUTCDay();
}

export function snapshotAgeMs(
  snapshot: WeatherSnapshot,
  now: Date = new Date(),
): number {
  const fetchedAt = new Date(snapshot.fetchedAt).getTime();

  return Number.isNaN(fetchedAt)
    ? Number.POSITIVE_INFINITY
    : Math.max(0, now.getTime() - fetchedAt);
}

export function isSnapshotFresh(
  snapshot: WeatherSnapshot,
  now: Date = new Date(),
): boolean {
  return snapshotAgeMs(snapshot, now) < WEATHER_FRESH_MS;
}

/**
 * Drops days that have already passed, which is what a snapshot kept overnight
 * looks like, and returns null once nothing usable is left. The live
 * observation is discarded as soon as the snapshot goes stale so the hero
 * temperature never claims to be current when it is hours old.
 */
export function usableSnapshot(
  snapshot: WeatherSnapshot | null,
  now: Date = new Date(),
): WeatherSnapshot | null {
  if (!snapshot) {
    return null;
  }

  const today = pakistanDate(now);
  const days = snapshot.days.filter((day) => day.date >= today);

  if (days.length === 0) {
    return null;
  }

  return {
    ...snapshot,
    days,
    current: isSnapshotFresh(snapshot, now) ? snapshot.current : null,
  };
}

export function daysFromToday(date: string, today = pakistanDate()): number {
  const target = new Date(`${date}T12:00:00Z`).getTime();
  const base = new Date(`${today}T12:00:00Z`).getTime();

  if (Number.isNaN(target) || Number.isNaN(base)) {
    return 0;
  }

  return Math.round((target - base) / (24 * 60 * 60 * 1000));
}
