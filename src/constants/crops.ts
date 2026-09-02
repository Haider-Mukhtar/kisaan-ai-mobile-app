import type { TranslationKey } from "@/providers/language-provider";

export type CropOption = {
  id: string;
  icon: string;
  labelKey: TranslationKey;
};

/** Common field crops in Pakistan. Custom crops are stored beside these ids. */
export const CROPS: CropOption[] = [
  { id: "wheat", icon: "🌾", labelKey: "cropWheat" },
  { id: "rice", icon: "🌾", labelKey: "cropRice" },
  { id: "cotton", icon: "☁️", labelKey: "cropCotton" },
  { id: "sugarcane", icon: "🎋", labelKey: "cropSugarcane" },
  { id: "maize", icon: "🌽", labelKey: "cropMaize" },
  { id: "mustard", icon: "🌼", labelKey: "cropMustard" },
  { id: "gram", icon: "🫘", labelKey: "cropGram" },
  { id: "potato", icon: "🥔", labelKey: "cropPotato" },
  { id: "tomato", icon: "🍅", labelKey: "cropTomato" },
  { id: "onion", icon: "🧅", labelKey: "cropOnion" },
  { id: "chili", icon: "🌶️", labelKey: "cropChili" },
];

const CROP_LABEL_KEYS = new Map(
  CROPS.map((crop) => [crop.id, crop.labelKey] as const),
);

export function getCropLabelKey(cropId: string) {
  return CROP_LABEL_KEYS.get(cropId);
}
