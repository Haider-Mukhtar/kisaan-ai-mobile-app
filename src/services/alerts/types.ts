import type { TranslationKey } from "@/providers/language-provider";

export type AlertCategory = "weather" | "storm" | "crop-disease";
export type AlertSeverity = "critical" | "warning" | "advisory";

/** A single actionable warning shown to a farmer. */
export type FarmAlert = {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  emoji: string;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  actionKey: TranslationKey;
  sourceKey: TranslationKey;
  windowKey: TranslationKey;
  districtId: string;
  affectedCrops: string[];
  updatedAt: string;
};

export const ALERT_SEVERITY_RANK: Record<AlertSeverity, number> = {
  critical: 3,
  warning: 2,
  advisory: 1,
};
