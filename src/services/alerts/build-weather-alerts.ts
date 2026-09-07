import type { TranslationKey } from "@/providers/language-provider";
import type { FarmAlert, AlertSeverity } from "@/services/alerts/types";
import { describeWeatherCode } from "@/services/weather/weather-codes";
import type { DailyForecast, WeatherSnapshot } from "@/services/weather/types";

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

function windowKey(index: number): TranslationKey {
  if (index === 0) return "alertWindowToday";
  if (index === 1) return "alertWindowTomorrow";
  return "alertWindowNextThreeDays";
}

type AlertInput = Omit<
  FarmAlert,
  "districtId" | "sourceKey" | "updatedAt"
>;

function fromForecast(
  snapshot: WeatherSnapshot,
  input: AlertInput,
): FarmAlert {
  return {
    ...input,
    districtId: snapshot.location.districtId,
    sourceKey: "alertSourceForecast",
    updatedAt: snapshot.fetchedAt,
  };
}

/**
 * Converts the forecast into independent, ranked alerts. Disease guidance is
 * explicitly a weather-based risk signal; it never claims a diagnosed or
 * officially reported outbreak.
 */
export function buildWeatherAlerts(
  snapshot: WeatherSnapshot,
  crops: string[],
): FarmAlert[] {
  const alerts: FarmAlert[] = [];
  const nextDays = snapshot.days.slice(0, 3);
  const today = nextDays[0];

  if (!today) return alerts;

  const stormIndex = nextDays.findIndex(isStormy);

  if (stormIndex >= 0) {
    alerts.push(
      fromForecast(snapshot, {
        id: `storm:${snapshot.location.districtId}:${nextDays[stormIndex].date}`,
        category: "storm",
        severity: "critical",
        emoji: "⛈️",
        titleKey: "alertStormTitle",
        bodyKey: "alertStormBody",
        actionKey: "alertStormAction",
        windowKey: windowKey(stormIndex),
        affectedCrops: [],
      }),
    );
  } else {
    const rainIndex = nextDays.findIndex(isRainLikely);

    if (rainIndex >= 0) {
      alerts.push(
        fromForecast(snapshot, {
          id: `rain:${snapshot.location.districtId}:${nextDays[rainIndex].date}`,
          category: "weather",
          severity: "warning",
          emoji: rainIndex === 0 ? "🌧️" : "🌦️",
          titleKey: "alertRainTitle",
          bodyKey: "alertRainBody",
          actionKey: "alertRainAction",
          windowKey: windowKey(rainIndex),
          affectedCrops: [],
        }),
      );
    }
  }

  if (today.tempMaxC >= 40) {
    const severity: AlertSeverity = today.tempMaxC >= 45 ? "critical" : "warning";
    alerts.push(
      fromForecast(snapshot, {
        id: `heat:${snapshot.location.districtId}:${today.date}`,
        category: "weather",
        severity,
        emoji: "🥵",
        titleKey: "alertHeatTitle",
        bodyKey: "alertHeatBody",
        actionKey: "alertHeatAction",
        windowKey: "alertWindowToday",
        affectedCrops: [],
      }),
    );
  }

  if (today.tempMinC <= 4) {
    alerts.push(
      fromForecast(snapshot, {
        id: `frost:${snapshot.location.districtId}:${today.date}`,
        category: "weather",
        severity: "warning",
        emoji: "❄️",
        titleKey: "alertFrostTitle",
        bodyKey: "alertFrostBody",
        actionKey: "alertFrostAction",
        windowKey: "alertWindowToday",
        affectedCrops: [],
      }),
    );
  }

  if ((today.windMaxKph ?? 0) >= 35) {
    alerts.push(
      fromForecast(snapshot, {
        id: `wind:${snapshot.location.districtId}:${today.date}`,
        category: "weather",
        severity: "warning",
        emoji: "💨",
        titleKey: "alertWindTitle",
        bodyKey: "alertWindBody",
        actionKey: "alertWindAction",
        windowKey: "alertWindowToday",
        affectedCrops: [],
      }),
    );
  }

  const wetDays = nextDays.filter(isRainLikely).length;
  const isHumidAndWet =
    (snapshot.current?.humidity ?? 0) >= 85 && isRainLikely(today);

  if (crops.length > 0 && (wetDays >= 2 || isHumidAndWet)) {
    alerts.push(
      fromForecast(snapshot, {
        id: `disease-risk:${snapshot.location.districtId}:${today.date}`,
        category: "crop-disease",
        severity: "advisory",
        emoji: "🌿",
        titleKey: "alertDiseaseRiskTitle",
        bodyKey: "alertDiseaseRiskBody",
        actionKey: "alertDiseaseRiskAction",
        windowKey: "alertWindowNextThreeDays",
        affectedCrops: [...crops],
      }),
    );
  }

  return alerts;
}
