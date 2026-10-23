import { readCachedMandiRates } from "@/services/mandi/device-cache";
import { loadMandiSnapshotForGemini } from "@/services/mandi/gemini-snapshot";
import {
  getRememberedMandiSnapshot,
  rememberMandiSnapshot,
} from "@/services/mandi/memory";
import {
  MANDI_CITIES,
  type MandiCity,
  type MandiRate,
  type MandiSnapshot,
} from "@/services/mandi/types";
import type { LanguageCode } from "@/providers/language-provider";

const CITY_NAMES: Record<MandiCity, string> = {
  lahore: "Lahore",
  karachi: "Karachi",
  multan: "Multan",
  islamabad: "Islamabad",
};

const CROP_ALIASES: Record<string, string[]> = {
  apple: ["apples", "seb", "saib", "سیب"],
  potato: ["potatoes", "aloo", "aalu", "آلو"],
  tomato: ["tomatoes", "tamatar", "ٹماٹر"],
  wheat: ["gandum", "گندم"],
};

function containsName(text: string, name: string): boolean {
  const value = normalizeForMatch(name);
  if (!value) return false;

  const isWord = (character: string) => /[\p{L}\p{N}]/u.test(character);
  let start = text.indexOf(value);
  while (start >= 0) {
    if (
      (start === 0 || !isWord(text[start - 1])) &&
      (start + value.length === text.length || !isWord(text[start + value.length]))
    ) {
      return true;
    }
    start = text.indexOf(value, start + value.length);
  }
  return false;
}

function normalizeForMatch(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function namesForRate(rate: MandiRate): string[] {
  const parenthetical = rate.name.match(/^(.+?)\s*\(([^)]+)\)/);
  const englishNames = parenthetical
    ? [rate.name, parenthetical[1].trim(), parenthetical[2].trim()]
    : [rate.name];
  const plurals = englishNames
    .filter((name) => /^[a-z ]+$/i.test(name))
    .map((name) => `${name}s`);
  return [...englishNames, ...plurals, rate.urdu];
}

export function isMandiPriceQuestion(text: string): boolean {
  return /\b(price|prices|rate|rates|cost|qeemat|keemat|daam|bhao|bhav)\b|\bhow much (?:is|are)\b.*\b(today|now|mandi|market)\b|\bkitn[ae] (?:ka|ki)\b|قیمت|ریٹ|نرخ|بھاؤ|دام|کتنے کا|(?:منڈی.*(?:آج|اب)|(?:آج|اب).*منڈی)/iu.test(text);
}

export function isMandiSellingQuestion(text: string): boolean {
  return /\b(sell|selling|sold|hold|wait to sell|bech|baich|farokht)\b|بیچ|فروخت|روک کر|ابھی بیچ/iu.test(text);
}

export function isMandiPriceFollowUp(text: string): boolean {
  return /^(tell me now|tell me|answer now|what is it now|and now|now|اب بتائیں|اب بتاؤ|اب بتاو)[؟?!.\s]*$/iu.test(text.trim());
}

export function findMandiRatesInQuestion(
  question: string,
  snapshot: MandiSnapshot | null,
): MandiRate[] {
  if (!snapshot) return [];
  const normalized = normalizeForMatch(question);

  return snapshot.rates
    .filter((rate) => {
      if (
        typeof rate?.name !== "string" ||
        typeof rate?.urdu !== "string" ||
        typeof rate?.unit !== "string"
      ) {
        return false;
      }
      const aliases = CROP_ALIASES[normalizeForMatch(rate.name)] ?? [];
      return [...namesForRate(rate), ...aliases].some((name) =>
        containsName(normalized, name),
      );
    })
    .filter((rate) => Number.isFinite(rate.average) && rate.average > 0)
    .sort((left, right) => right.name.length - left.name.length);
}

export async function loadMandiSnapshotForOfflineHelper(
  isOffline: boolean,
): Promise<MandiSnapshot | null> {
  if (!isOffline) return loadMandiSnapshotForGemini();

  const remembered = getRememberedMandiSnapshot();
  const cached = await readCachedMandiRates();
  if (!remembered) return cached;
  if (!cached) return remembered;

  const newest = Date.parse(cached.fetchedAt) > Date.parse(remembered.fetchedAt)
    ? cached
    : remembered;
  rememberMandiSnapshot(newest);
  return newest;
}

export function findMandiCity(text: string): MandiCity | null {
  const normalized = normalizeForMatch(text);
  return MANDI_CITIES.find((city) => containsName(normalized, city)) ?? null;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-PK", { maximumFractionDigits: 2 }).format(value);
}

function findQuantityKg(text: string): number | null {
  const match = text.match(/\b([\d,]+(?:\.\d+)?)\s*(?:kg|kilos?|kilograms?)\b|([\d,]+(?:\.\d+)?)\s*کلو/iu);
  const quantity = Number((match?.[1] ?? match?.[2] ?? "").replace(/,/g, ""));
  return Number.isFinite(quantity) && quantity > 0 ? quantity : null;
}

function findOfferPerKg(text: string): number | null {
  const match = text.match(/(?:\b(?:rs\.?|pkr)\s*|₨\s*)([\d,]+(?:\.\d+)?)\s*(?:\/\s*kg|per\s+kg|فی\s*کلو)/iu);
  const offer = Number((match?.[1] ?? "").replace(/,/g, ""));
  return Number.isFinite(offer) && offer > 0 ? offer : null;
}

export function formatOfflineMandiSellingAdvice(
  question: string,
  rate: MandiRate | null,
  snapshot: MandiSnapshot | null,
  language: LanguageCode,
): string {
  const quantityKg = findQuantityKg(question);
  const offerPerKg = findOfferPerKg(question);
  const isKg = rate?.unit.trim().toLowerCase() === "kg";
  const crop = language === "ur"
    ? rate?.urdu.trim() || rate?.name || "فصل"
    : rate?.name || "crop";

  if (!rate || !snapshot) {
    return language === "ur"
      ? "صرف محفوظ شدہ منڈی قیمت دیکھ کر بیچنے کا فیصلہ نہ کریں۔ خریدار کی پیشکش میں سے کرایہ اور آڑھتی کی کٹوتی نکال کر قریبی منڈی سے ملائیں، اور فصل خراب ہونے کا خطرہ بھی دیکھیں۔ آپ کون سی فصل بیچ رہے ہیں اور خریدار فی کلو کتنے روپے دے رہا ہے؟"
      : "A mandi average alone is not enough to decide whether to sell. Compare the buyer's offer after transport and commission with a local quote, and consider whether the crop can be stored safely. Which crop are you selling, and what is the buyer offering per kg?";
  }

  const reference = `Rs ${formatNumber(rate.average)} per ${rate.unit}`;
  const sourceDate = snapshot.sourceUpdatedAt?.trim();
  const gross = isKg && quantityKg !== null
    ? `Rs ${formatNumber(quantityKg * (offerPerKg ?? rate.average))}`
    : null;

  if (language === "ur") {
    const offer = offerPerKg === null
      ? `خریدار کی اصل پیشکش معلوم نہیں۔ ${crop} کی محفوظ شدہ پاکستانی اوسط ${reference} ہے${sourceDate ? ` (${sourceDate})` : ""}، یہ آپ کی فروخت کی قیمت نہیں۔`
      : `اگر خریدار ${crop} کے ${formatNumber(offerPerKg)} روپے فی کلو دے رہا ہے تو محفوظ شدہ پاکستانی اوسط ${reference} ہے${sourceDate ? ` (${sourceDate})` : ""}۔`;
    const total = gross && quantityKg !== null
      ? ` ${formatNumber(quantityKg)} کلو کی مجموعی رقم ${gross} ہوگی، کرایہ اور کمیشن سے پہلے۔`
      : "";
    return `${offer}${total} صرف اس اوسط کی بنیاد پر بیچنے کا فیصلہ نہ کریں؛ مقامی منڈی کی پیشکش، اخراجات اور ذخیرہ کرنے کی حالت دیکھیں۔ ${offerPerKg === null ? "خریدار فی کلو کتنے روپے دے رہا ہے؟" : "کرایہ اور کمیشن کتنا ہوگا؟"}`;
  }

  const offer = offerPerKg === null
    ? `I don't know the buyer's actual offer. The saved Pakistan average for ${crop} is ${reference}${sourceDate ? ` (${sourceDate})` : ""}; that is a reference, not your sale price.`
    : `If the buyer offers Rs ${formatNumber(offerPerKg)} per kg for ${crop}, the saved Pakistan average is ${reference}${sourceDate ? ` (${sourceDate})` : ""}.`;
  const total = gross && quantityKg !== null
    ? ` For ${formatNumber(quantityKg)} kg, that is ${gross} gross before transport and commission.`
    : "";
  return `${offer}${total} I would not decide to sell from the average alone: compare a local offer after costs and check whether the crop can store without losing quality. ${offerPerKg === null ? "What is the buyer offering per kg?" : "What will transport and commission cost?"}`;
}

export function formatOfflineMandiPrice(
  rate: MandiRate,
  snapshot: MandiSnapshot,
  language: LanguageCode,
  city: MandiCity | null,
): string {
  const cityRate = city ? rate.cityRates?.[city] : null;
  const hasCityRate = Boolean(
    cityRate &&
      Number.isFinite(cityRate.min) &&
      Number.isFinite(cityRate.max) &&
      cityRate.min > 0 &&
      cityRate.max > 0,
  );
  const price = hasCityRate && cityRate
    ? cityRate.min === cityRate.max
      ? `Rs ${formatNumber(cityRate.min)}`
      : `Rs ${formatNumber(Math.min(cityRate.min, cityRate.max))}–${formatNumber(Math.max(cityRate.min, cityRate.max))}`
    : `Rs ${formatNumber(rate.average)}`;
  const sourceUpdate = snapshot.sourceUpdatedAt?.trim();
  const savedAt = Number.isFinite(Date.parse(snapshot.fetchedAt))
    ? new Date(snapshot.fetchedAt).toLocaleString("en-PK")
    : "unknown";
  const timestamp = sourceUpdate
    ? language === "ur"
      ? `ماخذ کی تاریخ: ${sourceUpdate}`
      : `Source update: ${sourceUpdate}`
    : language === "ur"
      ? `فون پر محفوظ ہونے کا وقت: ${savedAt} (ماخذ کی تاریخ دستیاب نہیں)`
      : `Saved on this phone: ${savedAt} (source date unavailable)`;

  if (language === "ur") {
    const crop = rate.urdu.trim() || rate.name;
    const place = hasCityRate && city
      ? `${CITY_NAMES[city]} منڈی میں`
      : "پاکستانی اوسط";
    return `${crop} کی محفوظ شدہ منڈی قیمت ${place} ${price} فی ${rate.unit} ہے۔ ${timestamp}۔ یہ آج کی تصدیق شدہ قیمت نہیں ہو سکتی؛ مقامی منڈی میں معیار کے حساب سے قیمت بدل سکتی ہے۔`;
  }

  const place = hasCityRate && city
    ? `in ${CITY_NAMES[city]}`
    : "as a Pakistan average";
  return `The latest saved mandi rate for ${rate.name} ${place} is ${price} per ${rate.unit}. ${timestamp}. This may not be today's confirmed price; your local price can vary by quality and market.`;
}
