import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import { AlertCard } from "@/components/alerts/alert-card";
import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import { useAlerts } from "@/providers/alerts-provider";
import { useLanguage } from "@/providers/language-provider";

export default function AlertsScreen() {
  const { colors } = useThemeManager();
  const { alerts, isRefreshing, isStale, refresh, status } = useAlerts();
  const { t } = useLanguage();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          colors={[colors.primaryDark]}
          onRefresh={() => void refresh()}
          refreshing={isRefreshing}
          tintColor={colors.primaryDark}
        />
      }
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: colors.background }}
    >
      <AppText style={[styles.intro, { color: colors.mutedForeground }]}>
        {t("alertsIntro")}
      </AppText>

      {isStale ? (
        <AppText style={[styles.stale, { color: colors.warning }]}>
          {t("alertStaleNotice")}
        </AppText>
      ) : null}

      {alerts.length > 0 ? (
        <View style={styles.list}>
          {alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)}
        </View>
      ) : (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AppText style={styles.emptyEmoji}>{status === "ready" ? "✅" : "📡"}</AppText>
          <AppText variant="label" style={[styles.emptyTitle, { color: colors.foreground }]}>
            {t(status === "ready" ? "alertsNoneTitle" : "alertsUnavailableTitle")}
          </AppText>
          <AppText style={[styles.emptyBody, { color: colors.mutedForeground }]}>
            {t(status === "ready" ? "alertsNoneBody" : "alertsUnavailableBody")}
          </AppText>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingBottom: 32, paddingHorizontal: 20, paddingTop: 16 },
  intro: { fontSize: 14, lineHeight: 25 },
  stale: { fontSize: 12, lineHeight: 21 },
  list: { gap: 14 },
  empty: { alignItems: "center", borderRadius: 22, borderWidth: 1, padding: 24 },
  emptyEmoji: { fontSize: 34, lineHeight: 46 },
  emptyTitle: { fontSize: 17, lineHeight: 28, paddingTop: 6 },
  emptyBody: { fontSize: 14, lineHeight: 25, paddingTop: 4, textAlign: "center" },
});
