import type { TranslationKey } from "@/providers/language-provider";
import {
  daysFromToday,
  pakistanDate,
  weekdayIndex,
} from "@/services/weather/types";

const WEEKDAY_KEYS: TranslationKey[] = [
  "weekdaySunday",
  "weekdayMonday",
  "weekdayTuesday",
  "weekdayWednesday",
  "weekdayThursday",
  "weekdayFriday",
  "weekdaySaturday",
];

export function formatTemperature(value: number) {
  return `${Math.round(value)}°`;
}

/**
 * Weekday names come from the locale files rather than `Intl`, so Urdu day
 * names are guaranteed to be there on every device.
 */
export function dayLabelKey(
  date: string,
  today = pakistanDate(),
): TranslationKey {
  const offset = daysFromToday(date, today);

  if (offset <= 0) {
    return "weatherToday";
  }

  if (offset === 1) {
    return "weatherTomorrow";
  }

  return WEEKDAY_KEYS[weekdayIndex(date)];
}

export type AgeLabel = { key: TranslationKey; count: number };

export function describeAge(ageMs: number): AgeLabel {
  const minutes = Math.floor(ageMs / 60000);

  if (minutes < 2) {
    return { key: "weatherUpdatedJustNow", count: 0 };
  }

  if (minutes < 60) {
    return { key: "weatherUpdatedMinutesAgo", count: minutes };
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return { key: "weatherUpdatedHoursAgo", count: hours };
  }

  return { key: "weatherUpdatedDaysAgo", count: Math.floor(hours / 24) };
}
