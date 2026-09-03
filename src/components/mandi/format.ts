import type { TranslationKey } from "@/providers/language-provider";
import type { MandiCity } from "@/services/mandi/types";
import type { ThemeColors } from "@/constants/theme";

export const CITY_LABELS: Record<MandiCity, TranslationKey> = {
  lahore: "mandiCityLahore",
  karachi: "mandiCityKarachi",
  multan: "mandiCityMultan",
  islamabad: "mandiCityIslamabad",
};

const NUMBER_FORMATTER = new Intl.NumberFormat("en-PK", {
  maximumFractionDigits: 1,
});

type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string;

export function formatNumber(value: number) {
  return NUMBER_FORMATTER.format(value);
}

export function formatUnit(unit: string, t: Translate) {
  const normalized = unit.trim().toLowerCase().replace(/\s+/g, "");

  if (normalized === "dozen") return t("mandiUnitDozen");
  if (normalized === "kg" || normalized === "kilogram" || normalized === "kilo") {
    return t("mandiUnitKg");
  }
  if (normalized === "40kg" || normalized === "40kilogram") return t("mandiUnit40Kg");

  const trimmed = unit.trim();
  return trimmed ? `/${trimmed}` : t("mandiUnitKg");
}

export function formatPrice(value: number, t: Translate) {
  return t("mandiPrice", { value: formatNumber(value) });
}

export function formatPriceRange(min: number, max: number, t: Translate) {
  if (min === max) return formatPrice(min, t);
  return t("mandiPriceRange", { min: formatNumber(min), max: formatNumber(max) });
}

export function getTrendAppearance(change: number, colors: ThemeColors) {
  if (change > 0) {
    return { color: colors.success, marker: "▲", text: `+${formatNumber(change)}%` };
  }

  if (change < 0) {
    return { color: colors.red, marker: "▼", text: `${formatNumber(change)}%` };
  }

  return { color: colors.mutedForeground, marker: "—", text: `${formatNumber(change)}%` };
}
