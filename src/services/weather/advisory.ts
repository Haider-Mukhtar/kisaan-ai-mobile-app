import type { TranslationKey } from "@/providers/language-provider";
import { describeWeatherCode } from "@/services/weather/weather-codes";
import type { DailyForecast, WeatherSnapshot } from "@/services/weather/types";

/** Maps straight onto the matching theme colour token. */
export type AdvisoryTone = "warning" | "info" | "success";

export type WeatherAdvisory = {
  emoji: string;
  tone: AdvisoryTone;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
};

const STORM_CODES = new Set([82, 95, 96, 99]);

function isStormy(day: DailyForecast) {
  return STORM_CODES.has(day.weatherCode) || day.precipitationMm >= 25;
}

function isRainLikely(day: DailyForecast) {
  return (
    describeWeatherCode(day.weatherCode).isWet ||
    day.precipitationMm >= 5 ||
    (day.precipitationChance ?? 0) >= 60
  );
}

/**
 * Turns the forecast into the single most useful thing to do about it today.
 * Only one advisory is shown: a farmer scanning the home screen should not have
 * to rank a list of warnings themselves.
 */
export function buildAdvisory(
  snapshot: WeatherSnapshot,
): WeatherAdvisory | null {
  const [today, tomorrow] = snapshot.days;

  if (!today) {
    return null;
  }

  const nextDays = snapshot.days.slice(0, 3);

  if (nextDays.some(isStormy)) {
    return {
      emoji: "⛈️",
      tone: "warning",
      titleKey: "advisoryStormTitle",
      bodyKey: "advisoryStormBody",
    };
  }

  if (isRainLikely(today)) {
    return {
      emoji: "🌧️",
      tone: "info",
      titleKey: "advisoryRainTodayTitle",
      bodyKey: "advisoryRainTodayBody",
    };
  }

  if (tomorrow && isRainLikely(tomorrow)) {
    return {
      emoji: "🌦️",
      tone: "info",
      titleKey: "advisoryRainTomorrowTitle",
      bodyKey: "advisoryRainTomorrowBody",
    };
  }

  if (today.tempMaxC >= 40) {
    return {
      emoji: "🥵",
      tone: "warning",
      titleKey: "advisoryHeatTitle",
      bodyKey: "advisoryHeatBody",
    };
  }

  if (today.tempMinC <= 4) {
    return {
      emoji: "❄️",
      tone: "warning",
      titleKey: "advisoryFrostTitle",
      bodyKey: "advisoryFrostBody",
    };
  }

  if ((today.windMaxKph ?? 0) >= 35) {
    return {
      emoji: "💨",
      tone: "info",
      titleKey: "advisoryWindTitle",
      bodyKey: "advisoryWindBody",
    };
  }

  const staysDry = nextDays.every(
    (day) => !isRainLikely(day) && (day.precipitationChance ?? 0) < 30,
  );

  if (staysDry) {
    return {
      emoji: "🌞",
      tone: "success",
      titleKey: "advisoryDryTitle",
      bodyKey: "advisoryDryBody",
    };
  }

  return null;
}
