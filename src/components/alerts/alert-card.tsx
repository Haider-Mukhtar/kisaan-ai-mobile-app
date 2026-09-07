import { router, type Href } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage, type TranslationKey } from "@/providers/language-provider";
import type {
  AlertCategory,
  AlertSeverity,
  FarmAlert,
} from "@/services/alerts/types";

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

type AlertCardProps = {
  alert: FarmAlert;
  compact?: boolean;
};

export function AlertCard({ alert, compact = false }: AlertCardProps) {
  const { colors } = useThemeManager();
  const { isRTL, t } = useLanguage();
  const accent =
    alert.severity === "critical"
      ? colors.red
      : alert.severity === "warning"
        ? colors.warning
        : colors.info;

  const openAlert = () =>
    router.push(`/alert/${encodeURIComponent(alert.id)}` as Href);

  return (
    <Pressable
      accessibilityHint={t("alertOpenHint")}
      accessibilityRole="button"
      onPress={openAlert}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderStartColor: accent,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.heading}>
        <AppText style={styles.emoji}>{alert.emoji}</AppText>
        <View style={styles.headingCopy}>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: `${accent}18` }]}>
              <AppText variant="label" style={[styles.badgeText, { color: accent }]}>
                {t(SEVERITY_KEYS[alert.severity])}
              </AppText>
            </View>
            <AppText style={[styles.category, { color: colors.mutedForeground }]}>
              {t(CATEGORY_KEYS[alert.category])}
            </AppText>
          </View>
          <AppText
            selectable
            variant="label"
            style={[styles.title, { color: colors.foreground }]}
          >
            {t(alert.titleKey)}
          </AppText>
        </View>
      </View>

      <AppText
        numberOfLines={compact ? 2 : undefined}
        style={[styles.body, { color: colors.mutedForeground }]}
      >
        {t(alert.bodyKey)}
      </AppText>

      <View style={styles.footer}>
        <AppText variant="label" style={[styles.window, { color: accent }]}>
          {t(alert.windowKey)}
        </AppText>
        <AppText variant="label" style={[styles.open, { color: colors.primaryDark }]}>
          {`${t("alertViewAction")} ${isRTL ? "←" : "→"}`}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderStartWidth: 4,
    borderWidth: 1,
    padding: 16,
  },
  pressed: { opacity: 0.72 },
  heading: { alignItems: "flex-start", flexDirection: "row", gap: 12 },
  emoji: { fontSize: 28, lineHeight: 38 },
  headingCopy: { flex: 1, gap: 4 },
  badges: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: { borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { fontSize: 11, lineHeight: 18 },
  category: { fontSize: 12, lineHeight: 20 },
  title: { fontSize: 16, lineHeight: 27 },
  body: { fontSize: 14, lineHeight: 24, paddingTop: 10 },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
  },
  window: { fontSize: 12, lineHeight: 20 },
  open: { fontSize: 12, lineHeight: 20 },
});
