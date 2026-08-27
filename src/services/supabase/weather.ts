import { supabase } from "@/lib/supabase";
import type { Json, WeatherForecastRow } from "@/types/database";
import { FORECAST_DAYS } from "@/services/weather/open-meteo";
import {
  pakistanDate,
  usableSnapshot,
  type DailyForecast,
  type WeatherLocation,
  type WeatherSnapshot,
} from "@/services/weather/types";

/**
 * District-level cache shared by every farmer in an area. Reads are cheap and
 * one farmer opening the app spares the rest a call to the forecast API.
 *
 * Both functions swallow their failures: the cache is an optimisation, and
 * weather must still render for a farmer whose Supabase call fails.
 */

function toNumber(value: number | string | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function toDailyForecast(row: WeatherForecastRow): DailyForecast | null {
  const tempMaxC = toNumber(row.temp_max_c);
  const tempMinC = toNumber(row.temp_min_c);

  if (tempMaxC === null || tempMinC === null) {
    return null;
  }

  return {
    date: row.forecast_date,
    weatherCode: Number(row.weather_code),
    tempMaxC,
    tempMinC,
    precipitationMm: toNumber(row.precipitation_mm) ?? 0,
    precipitationChance: toNumber(row.precipitation_chance),
    windMaxKph: toNumber(row.wind_max_kph),
  };
}

export async function readSharedForecast(
  location: WeatherLocation,
): Promise<WeatherSnapshot | null> {
  try {
    const { data, error } = await supabase
      .from("weather_forecasts")
      .select("*")
      .eq("district", location.districtId)
      .gte("forecast_date", pakistanDate())
      .order("forecast_date", { ascending: true })
      .limit(FORECAST_DAYS);

    if (error || !data || data.length === 0) {
      return null;
    }

    const days = data
      .map(toDailyForecast)
      .filter((day): day is DailyForecast => day !== null);

    if (days.length === 0) {
      return null;
    }

    const todayRow = data[0];
    const observedTemp = toNumber(todayRow.observed_temp_c);

    return usableSnapshot({
      location,
      // Only the row for today carries an observation, and only when the
      // farmer who warmed the cache had live values to share.
      current:
        todayRow.observed_at !== null && observedTemp !== null
          ? {
              tempC: observedTemp,
              humidity: toNumber(todayRow.observed_humidity),
              windKph: toNumber(todayRow.observed_wind_kph),
              weatherCode: Number(todayRow.observed_weather_code ?? todayRow.weather_code),
            }
          : null,
      days,
      fetchedAt: todayRow.fetched_at,
      source: "shared-cache",
    });
  } catch {
    return null;
  }
}

export async function cacheSharedForecast(snapshot: WeatherSnapshot) {
  const days: Json = snapshot.days.map((day) => ({
    forecast_date: day.date,
    weather_code: day.weatherCode,
    temp_max_c: day.tempMaxC,
    temp_min_c: day.tempMinC,
    precipitation_mm: day.precipitationMm,
    precipitation_chance: day.precipitationChance,
    wind_max_kph: day.windMaxKph,
  }));

  try {
    await supabase.rpc("cache_weather_forecast", {
      p_district: snapshot.location.districtId,
      p_latitude: snapshot.location.latitude,
      p_longitude: snapshot.location.longitude,
      p_days: days,
      p_observation: snapshot.current
        ? {
            temp_c: snapshot.current.tempC,
            humidity: snapshot.current.humidity,
            wind_kph: snapshot.current.windKph,
            weather_code: snapshot.current.weatherCode,
          }
        : null,
    });
  } catch {
    // Nothing to do: the farmer already has their forecast.
  }
}
