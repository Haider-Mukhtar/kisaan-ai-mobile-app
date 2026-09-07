import { router, type Href } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { AlertCard } from "@/components/alerts/alert-card";
import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import { useAlerts } from "@/providers/alerts-provider";
import { useLanguage } from "@/providers/language-provider";

export function HomeAlerts() {
  const { colors } = useThemeManager();
  const { alerts, isStale, status } = useAlerts();
  const { t } = useLanguage();

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText variant="title" style={[styles.sectionTitle, { color: colors.foreground }]}>
          {t("alertsHomeTitle")}
        </AppText>
        {alerts.length > 0 ? (
          <Pressable
            accessibilityHint={t("alertsViewAllHint")}
            accessibilityRole="button"
            onPress={() => router.push("/alerts" as Href)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <AppText variant="label" style={[styles.viewAll, { color: colors.primaryDark }]}>
              {t("alertsViewAll")}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {status === "loading" ? (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ActivityIndicator color={colors.primaryDark} />
          <AppText style={{ color: colors.mutedForeground }}>{t("alertsLoading")}</AppText>
        </View>
      ) : status === "error" || status === "idle" ? (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AppText style={styles.stateEmoji}>📡</AppText>
          <View style={styles.stateCopy}>
            <AppText variant="label" style={{ color: colors.foreground }}>
              {t("alertsUnavailableTitle")}
            </AppText>
            <AppText style={[styles.stateBody, { color: colors.mutedForeground }]}>
              {t("alertsUnavailableBody")}
            </AppText>
          </View>
        </View>
      ) : alerts.length === 0 ? (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AppText style={styles.stateEmoji}>✅</AppText>
          <View style={styles.stateCopy}>
            <AppText variant="label" style={{ color: colors.foreground }}>
              {t("alertsNoneTitle")}
            </AppText>
            <AppText style={[styles.stateBody, { color: colors.mutedForeground }]}>
              {t("alertsNoneBody")}
            </AppText>
          </View>
        </View>
      ) : (
        <>
          <AlertCard alert={alerts[0]} compact />
          {alerts.length > 1 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/alerts" as Href)}
              style={({ pressed }) => [styles.more, pressed && styles.pressed]}
            >
              <AppText variant="label" style={{ color: colors.primaryDark }}>
                {t("alertsMoreCount", { count: alerts.length - 1 })}
              </AppText>
            </Pressable>
          ) : null}
          {isStale ? (
            <AppText style={[styles.stale, { color: colors.warning }]}>
              {t("alertStaleNotice")}
            </AppText>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  sectionTitle: { fontSize: 20, lineHeight: 34 },
  viewAll: { fontSize: 13, lineHeight: 22 },
  stateCard: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 88,
    padding: 16,
  },
  stateEmoji: { fontSize: 24, lineHeight: 34 },
  stateCopy: { flex: 1 },
  stateBody: { fontSize: 13, lineHeight: 22, paddingTop: 2 },
  more: { alignItems: "center", paddingVertical: 4 },
  stale: { fontSize: 12, lineHeight: 21 },
  pressed: { opacity: 0.65 },
});
