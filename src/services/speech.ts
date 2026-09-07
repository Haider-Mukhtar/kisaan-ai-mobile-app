import * as Speech from "expo-speech";

import type { LanguageCode } from "@/providers/language-provider";

export const SPEECH_LANGUAGE: Record<LanguageCode, string> = {
  en: "en-PK",
  ur: "ur-PK",
};

export function prepareSpokenText(text: string) {
  const cleaned = text
    .replace(/[*_#>`]+/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  const maxLength = Speech.maxSpeechInputLength;
  if (Number.isFinite(maxLength) && maxLength > 0 && cleaned.length > maxLength) {
    return cleaned.slice(0, maxLength);
  }

  return cleaned;
}

export function detectSpeechLanguage(text: string, fallback: LanguageCode): LanguageCode {
  let urduChars = 0;
  let latinChars = 0;

  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code >= 0x0600 && code <= 0x06ff) {
      urduChars += 1;
    } else if (
      (code >= 65 && code <= 90) ||
      (code >= 97 && code <= 122)
    ) {
      latinChars += 1;
    }
  }

  if (urduChars === 0 && latinChars === 0) {
    return fallback;
  }

  return urduChars >= latinChars ? "ur" : "en";
}

export async function pickSpeechVoice(language: LanguageCode) {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const ranked = voices
      .map((voice) => ({
        voice,
        score: scoreVoice(voice.language, voice.quality, language),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score);

    return ranked[0]?.voice ?? null;
  } catch {
    return null;
  }
}

function scoreVoice(
  voiceLanguage: string,
  quality: string,
  language: LanguageCode,
) {
  const normalized = voiceLanguage.replaceAll("_", "-").toLowerCase();
  const enhanced = quality === Speech.VoiceQuality.Enhanced ? 1 : 0;

  if (language === "ur") {
    if (normalized.startsWith("ur-pk") || normalized === "ur") return 4 + enhanced;
    if (normalized.startsWith("ur")) return 2 + enhanced;
    return 0;
  }

  if (normalized.startsWith("en-pk")) return 5 + enhanced;
  if (normalized.startsWith("en-in")) return 4 + enhanced;
  if (normalized.startsWith("en-gb") || normalized.startsWith("en-us")) {
    return 3 + enhanced;
  }
  if (normalized.startsWith("en")) return 2 + enhanced;
  return 0;
}
