import {
  pakistanDate,
  type CurrentWeather,
  type DailyForecast,
  type WeatherError,
  type WeatherLocation,
  type WeatherSnapshot,
} from "@/services/weather/types";

/**
 * Open-Meteo is free and needs no API key, so the app calls it directly instead
 * of proxying through a server. Results are written to the shared Supabase
 * cache afterwards so other farmers in the same district reuse them.
 */
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export const FORECAST_DAYS = 5;

const REQUEST_TIMEOUT_MS = 12000;

const DAILY_FIELDS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "precipitation_probability_max",
  "wind_speed_10m_max",
].join(",");

const CURRENT_FIELDS = [
  "temperature_2m",
  "relative_humidity_2m",
  "weather_code",
  "wind_speed_10m",
].join(",");

type OpenMeteoResponse = {
  daily?: {
    time?: unknown;
    weather_code?: unknown;
    temperature_2m_max?: unknown;
    temperature_2m_min?: unknown;
    precipitation_sum?: unknown;
    precipitation_probability_max?: unknown;
    wind_speed_10m_max?: unknown;
  };
  current?: {
    temperature_2m?: unknown;
    relative_humidity_2m?: unknown;
    weather_code?: unknown;
    wind_speed_10m?: unknown;
  };
};

export type ForecastResult =
  | { data: WeatherSnapshot; error: null }
  | { data: null; error: WeatherError };

function round(value: number, decimals = 1) {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}

function numberAt(source: unknown, index: number): number | null {
  if (!Array.isArray(source)) {
    return null;
  }

  const value = source[index];

  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function buildUrl(location: WeatherLocation) {
  const params = new URLSearchParams({
    latitude: location.latitude.toFixed(4),
    longitude: location.longitude.toFixed(4),
    daily: DAILY_FIELDS,
    current: CURRENT_FIELDS,
    timezone: "Asia/Karachi",
    forecast_days: String(FORECAST_DAYS),
  });

  return `${FORECAST_URL}?${params.toString()}`;
}

function parseDays(payload: OpenMeteoResponse): DailyForecast[] {
  const times = payload.daily?.time;

  if (!Array.isArray(times)) {
    return [];
  }

  const today = pakistanDate();
  const days: DailyForecast[] = [];

  times.forEach((day, index) => {
    const tempMaxC = numberAt(payload.daily?.temperature_2m_max, index);
    const tempMinC = numberAt(payload.daily?.temperature_2m_min, index);
    const weatherCode = numberAt(payload.daily?.weather_code, index);

    // A day without these three cannot be rendered, so drop it rather than
    // showing a dash where a temperature belongs.
    if (
      typeof day !== "string" ||
      day < today ||
      tempMaxC === null ||
      tempMinC === null ||
      weatherCode === null
    ) {
      return;
    }

    const chance = numberAt(payload.daily?.precipitation_probability_max, index);
    const wind = numberAt(payload.daily?.wind_speed_10m_max, index);

    days.push({
      date: day,
      weatherCode: Math.round(weatherCode),
      tempMaxC: round(tempMaxC),
      tempMinC: round(tempMinC),
      precipitationMm: round(numberAt(payload.daily?.precipitation_sum, index) ?? 0),
      precipitationChance: chance === null ? null : Math.round(chance),
      windMaxKph: wind === null ? null : round(wind),
    });
  });

  return days;
}

function parseCurrent(payload: OpenMeteoResponse): CurrentWeather | null {
  const tempC = payload.current?.temperature_2m;
  const weatherCode = payload.current?.weather_code;

  if (typeof tempC !== "number" || typeof weatherCode !== "number") {
    return null;
  }

  const humidity = payload.current?.relative_humidity_2m;
  const windKph = payload.current?.wind_speed_10m;

  return {
    tempC: round(tempC),
    humidity: typeof humidity === "number" ? Math.round(humidity) : null,
    windKph: typeof windKph === "number" ? round(windKph) : null,
    weatherCode: Math.round(weatherCode),
  };
}

export async function fetchForecast(
  location: WeatherLocation,
): Promise<ForecastResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildUrl(location), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        data: null,
        error: {
          kind: "response",
          message: `Forecast request failed with status ${response.status}`,
        },
      };
    }

    const payload = (await response.json()) as OpenMeteoResponse;
    const days = parseDays(payload);

    if (days.length === 0) {
      return {
        data: null,
        error: { kind: "response", message: "Forecast response had no usable days" },
      };
    }

    return {
      data: {
        location,
        current: parseCurrent(payload),
        days,
        fetchedAt: new Date().toISOString(),
        source: "live",
      },
      error: null,
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";

    return {
      data: null,
      error: {
        kind: aborted ? "timeout" : "network",
        message: aborted
          ? "Forecast request timed out"
          : error instanceof Error
            ? error.message
            : "Forecast request failed",
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}
