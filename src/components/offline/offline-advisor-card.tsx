import { Ionicons } from "@react-native-vector-icons/ionicons";
import { type Href, router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { useOfflineModelStatus } from "@/hooks/use-offline-model-status";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";

export function OfflineAdvisorCard() {
  const { colors } = useThemeManager();
  const { isRTL, t } = useLanguage();
  const { status } = useOfflineModelStatus();

  const badge =
    status === "downloaded"
      ? t("offlineCardReady")
      : status === "unsupported"
        ? t("offlineCardUnsupported")
        : status === "checking"
          ? t("offlineCardChecking")
          : t("offlineCardDownload");

  return (
    <Pressable
      accessibilityHint={t("offlineCardSubtitle")}
      accessibilityLabel={t("offlineCardTitle")}
      accessibilityRole="button"
      onPress={() => router.push("/offline-advisor" as Href)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.84 : 1,
        },
      ]}
    >
      <View
        style={[styles.icon, { backgroundColor: colors.primary }]}
      >
        <Ionicons
          color={colors.primaryForeground}
          name="cloud-offline-outline"
          size={22}
        />
      </View>

      <View style={styles.copy}>
        <AppText
          variant="label"
          style={[styles.title, { color: colors.foreground }]}
        >
          {t("offlineCardTitle")}
        </AppText>
        <AppText
          style={[styles.subtitle, { color: colors.mutedForeground }]}
        >
          {t("offlineCardSubtitle")}
        </AppText>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.muted,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.dot,
              {
                backgroundColor:
                  status === "downloaded" ? colors.success : colors.warning,
              },
            ]}
          />
          <AppText
            variant="label"
            style={[styles.badgeText, { color: colors.foreground }]}
          >
            {badge}
          </AppText>
        </View>
      </View>

      <Ionicons
        color={colors.mutedForeground}
        name={isRTL ? "chevron-back" : "chevron-forward"}
        size={18}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 17,
  },
  card: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    padding: 18,
    width: "100%",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  dot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  icon: {
    alignItems: "center",
    borderRadius: 16,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 21,
    marginTop: 2,
  },
  title: {
    fontSize: 16,
    lineHeight: 26,
  },
});
