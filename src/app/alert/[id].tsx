import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { getCropLabelKey } from "@/constants/crops";
import { getDistrict, getDistrictName } from "@/constants/districts";
import useThemeManager from "@/hooks/use-theme-manager";
import { useAlerts } from "@/providers/alerts-provider";
import {
  useLanguage,
  type LanguageCode,
  type TranslationKey,
} from "@/providers/language-provider";
import type { AlertCategory, AlertSeverity } from "@/services/alerts/types";

const CATEGORY_KEYS: Record<AlertCategory, TranslationKey> = {
  weather: "alertCategoryWeather",
  storm: "alertCategoryStorm",
  "crop-disease": "alertCategoryCropDisease",
};

const SEVERITY_KEYS: Record<AlertSeverity, TranslationKey> = {
  critical: "alertSeverityCritical",
  warning: "alertSeverityWarning",
  advisory: "alertSeverityAdvisory",
};

function formatUpdatedAt(timestamp: string, language: LanguageCode) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return timestamp;

  return date.toLocaleString(language === "ur" ? "ur-PK" : "en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AlertDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useThemeManager();
  const { alerts } = useAlerts();
  const { language, t } = useLanguage();
  const alert = alerts.find((item) => item.id === id);

  if (!alert) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        style={{ backgroundColor: colors.background }}
      >
        <View style={[styles.missing, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AppText style={styles.heroEmoji}>ℹ️</AppText>
          <AppText variant="label" style={[styles.title, { color: colors.foreground }]}>
            {t("alertExpiredTitle")}
          </AppText>
          <AppText style={[styles.body, { color: colors.mutedForeground }]}>
            {t("alertExpiredBody")}
          </AppText>
        </View>
      </ScrollView>
    );
  }

  const accent =
    alert.severity === "critical"
      ? colors.red
      : alert.severity === "warning"
        ? colors.warning
        : colors.info;
  const district = getDistrict(alert.districtId);
  const cropLabels = alert.affectedCrops.map((crop) => {
    const key = getCropLabelKey(crop);
    return key ? t(key) : crop;
  });

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: colors.background }}
    >
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border, borderTopColor: accent }]}>
        <AppText style={styles.heroEmoji}>{alert.emoji}</AppText>
        <View style={[styles.badge, { backgroundColor: `${accent}18` }]}>
          <AppText variant="label" style={[styles.badgeText, { color: accent }]}>
            {`${t(SEVERITY_KEYS[alert.severity])} · ${t(CATEGORY_KEYS[alert.category])}`}
          </AppText>
        </View>
        <AppText selectable variant="title" style={[styles.title, { color: colors.foreground }]}>
          {t(alert.titleKey)}
        </AppText>
        <AppText selectable style={[styles.body, { color: colors.mutedForeground }]}>
          {t(alert.bodyKey)}
        </AppText>
      </View>

      <View style={[styles.action, { backgroundColor: `${accent}10`, borderColor: `${accent}55` }]}>
        <AppText variant="label" style={[styles.actionTitle, { color: accent }]}>
          {t("alertRecommendedAction")}
        </AppText>
        <AppText selectable style={[styles.actionBody, { color: colors.foreground }]}>
          {t(alert.actionKey)}
        </AppText>
      </View>

      <View style={[styles.details, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <DetailRow label={t("alertTimeWindow")} value={t(alert.windowKey)} />
        <DetailRow
          label={t("alertAffectedArea")}
          value={district ? getDistrictName(district, language) : alert.districtId}
        />
        {cropLabels.length > 0 ? (
          <DetailRow label={t("alertAffectedCrops")} value={cropLabels.join(", ")} />
        ) : null}
        <DetailRow label={t("alertSource")} value={t(alert.sourceKey)} />
        <DetailRow
          label={t("alertLastUpdated")}
          value={formatUpdatedAt(alert.updatedAt, language)}
          last
        />
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, last = false, value }: { label: string; last?: boolean; value: string }) {
  const { colors } = useThemeManager();

  return (
    <View style={[styles.row, !last && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
      <AppText style={[styles.rowLabel, { color: colors.mutedForeground }]}>{label}</AppText>
      <AppText selectable variant="label" style={[styles.rowValue, { color: colors.foreground }]}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingBottom: 32, paddingHorizontal: 20, paddingTop: 16 },
  hero: { alignItems: "center", borderRadius: 22, borderTopWidth: 4, borderWidth: 1, padding: 22 },
  heroEmoji: { fontSize: 46, lineHeight: 58 },
  badge: { borderRadius: 99, marginTop: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, lineHeight: 18 },
  title: { fontSize: 22, lineHeight: 36, paddingTop: 10, textAlign: "center" },
  body: { fontSize: 14, lineHeight: 25, paddingTop: 6, textAlign: "center" },
  action: { borderRadius: 20, borderWidth: 1, padding: 18 },
  actionTitle: { fontSize: 14, lineHeight: 24 },
  actionBody: { fontSize: 15, lineHeight: 27, paddingTop: 5 },
  details: { borderRadius: 20, borderWidth: 1, overflow: "hidden", paddingHorizontal: 16 },
  row: { gap: 4, paddingVertical: 14 },
  rowLabel: { fontSize: 12, lineHeight: 20 },
  rowValue: { fontSize: 14, lineHeight: 24 },
  missing: { alignItems: "center", borderRadius: 22, borderWidth: 1, padding: 24 },
});
