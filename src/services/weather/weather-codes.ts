import type { TranslationKey } from "@/providers/language-provider";

export type WeatherCondition = {
  emoji: string;
  labelKey: TranslationKey;
  /** True when the sky is delivering water, which the advisories key off. */
  isWet: boolean;
};

/**
 * WMO weather interpretation codes as returned by Open-Meteo. Codes are grouped
 * into the handful of conditions a farmer actually needs to tell apart.
 */
const CONDITIONS: Record<number, WeatherCondition> = {
  0: { emoji: "☀️", labelKey: "weatherClear", isWet: false },
  1: { emoji: "🌤️", labelKey: "weatherMainlyClear", isWet: false },
  2: { emoji: "⛅", labelKey: "weatherPartlyCloudy", isWet: false },
  3: { emoji: "☁️", labelKey: "weatherOvercast", isWet: false },
  45: { emoji: "🌫️", labelKey: "weatherFog", isWet: false },
  48: { emoji: "🌫️", labelKey: "weatherFog", isWet: false },
  51: { emoji: "🌦️", labelKey: "weatherDrizzle", isWet: true },
  53: { emoji: "🌦️", labelKey: "weatherDrizzle", isWet: true },
  55: { emoji: "🌦️", labelKey: "weatherDrizzle", isWet: true },
  56: { emoji: "🌧️", labelKey: "weatherDrizzle", isWet: true },
  57: { emoji: "🌧️", labelKey: "weatherDrizzle", isWet: true },
  61: { emoji: "🌦️", labelKey: "weatherLightRain", isWet: true },
  63: { emoji: "🌧️", labelKey: "weatherRain", isWet: true },
  65: { emoji: "🌧️", labelKey: "weatherHeavyRain", isWet: true },
  66: { emoji: "🌧️", labelKey: "weatherRain", isWet: true },
  67: { emoji: "🌧️", labelKey: "weatherHeavyRain", isWet: true },
  71: { emoji: "🌨️", labelKey: "weatherSnow", isWet: true },
  73: { emoji: "🌨️", labelKey: "weatherSnow", isWet: true },
  75: { emoji: "❄️", labelKey: "weatherSnow", isWet: true },
  77: { emoji: "🌨️", labelKey: "weatherSnow", isWet: true },
  80: { emoji: "🌦️", labelKey: "weatherShowers", isWet: true },
  81: { emoji: "🌧️", labelKey: "weatherShowers", isWet: true },
  82: { emoji: "⛈️", labelKey: "weatherHeavyShowers", isWet: true },
  85: { emoji: "🌨️", labelKey: "weatherSnowShowers", isWet: true },
  86: { emoji: "🌨️", labelKey: "weatherSnowShowers", isWet: true },
  95: { emoji: "⛈️", labelKey: "weatherThunderstorm", isWet: true },
  96: { emoji: "⛈️", labelKey: "weatherHailstorm", isWet: true },
  99: { emoji: "⛈️", labelKey: "weatherHailstorm", isWet: true },
};

const UNKNOWN_CONDITION: WeatherCondition = {
  emoji: "🌡️",
  labelKey: "weatherUnknown",
  isWet: false,
};

export function describeWeatherCode(code: number | null | undefined) {
  if (code === null || code === undefined) {
    return UNKNOWN_CONDITION;
  }

  return CONDITIONS[code] ?? UNKNOWN_CONDITION;
}
