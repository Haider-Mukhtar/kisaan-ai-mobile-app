import * as Speech from "expo-speech";

import { CITY_LABELS } from "@/components/mandi/format";
import type { LanguageCode, TranslationKey } from "@/providers/language-provider";
import { MANDI_CITIES, type MandiRate } from "@/services/mandi/types";

type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string;

const NUMBER_FORMATTER = new Intl.NumberFormat("en-PK", {
  maximumFractionDigits: 1,
  useGrouping: false,
});

export const SPEECH_LANGUAGE: Record<LanguageCode, string> = {
  en: "en-PK",
  ur: "ur-PK",
};

export function formatSpokenNumber(value: number) {
  return NUMBER_FORMATTER.format(value);
}

export function formatSpokenUnit(unit: string, t: Translate) {
  const normalized = unit.trim().toLowerCase().replace(/\s+/g, "");

  if (normalized === "dozen") return t("mandiSpeakUnitDozen");
  if (normalized === "kg" || normalized === "kilogram" || normalized === "kilo") {
    return t("mandiSpeakUnitKg");
  }
  if (normalized === "40kg" || normalized === "40kilogram") return t("mandiSpeakUnit40Kg");

  const trimmed = unit.trim();
  return trimmed || t("mandiSpeakUnitKg");
}

export function formatSpokenPrice(value: number, t: Translate) {
  return t("mandiSpeakPrice", { value: formatSpokenNumber(value) });
}

export function formatSpokenPriceRange(min: number, max: number, t: Translate) {
  if (min === max) return formatSpokenPrice(min, t);
  return t("mandiSpeakPriceRange", {
    min: formatSpokenNumber(min),
    max: formatSpokenNumber(max),
  });
}

export function buildMandiSpeechText(
  rate: MandiRate,
  language: LanguageCode,
  t: Translate,
) {
  const cropName = language === "ur" && rate.urdu.trim() ? rate.urdu.trim() : rate.name;
  const unit = formatSpokenUnit(rate.unit, t);
  const parts = [
    t("mandiSpeakIntro", {
      name: cropName,
      price: formatSpokenPrice(rate.average, t),
      unit,
    }),
  ];

  if (rate.change > 0) {
    parts.push(t("mandiSpeakTrendUp", { change: formatSpokenNumber(rate.change) }));
  } else if (rate.change < 0) {
    parts.push(t("mandiSpeakTrendDown", { change: formatSpokenNumber(Math.abs(rate.change)) }));
  } else {
    parts.push(t("mandiSpeakTrendNone"));
  }

  const cities = MANDI_CITIES.filter((city) => rate.cityRates[city]);

  if (cities.length === 0) {
    parts.push(t("mandiSpeakNoCities"));
  } else {
    cities.forEach((city) => {
      const cityRate = rate.cityRates[city];
      if (!cityRate) return;

      parts.push(
        t("mandiSpeakCity", {
          city: t(CITY_LABELS[city]),
          price: formatSpokenPriceRange(cityRate.min, cityRate.max, t),
          unit,
        }),
      );
    });
  }

  return parts.join(" ");
}

export async function pickSpeechVoice(language: LanguageCode) {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const ranked = voices
      .map((voice) => ({ voice, score: scoreVoice(voice.language, voice.quality, language) }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score);

    return ranked[0]?.voice ?? null;
  } catch {
    return null;
  }
}

function scoreVoice(voiceLanguage: string, quality: string, language: LanguageCode) {
  const normalized = voiceLanguage.replaceAll("_", "-").toLowerCase();
  const enhanced = quality === Speech.VoiceQuality.Enhanced ? 1 : 0;

  if (language === "ur") {
    if (normalized.startsWith("ur-pk") || normalized === "ur") return 4 + enhanced;
    if (normalized.startsWith("ur")) return 2 + enhanced;
    return 0;
  }

  if (normalized.startsWith("en-pk")) return 5 + enhanced;
  if (normalized.startsWith("en-in")) return 4 + enhanced;
  if (normalized.startsWith("en-gb") || normalized.startsWith("en-us")) return 3 + enhanced;
  if (normalized.startsWith("en")) return 2 + enhanced;
  return 0;
}
