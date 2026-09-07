import { Ionicons } from "@react-native-vector-icons/ionicons";
import { StyleSheet, View } from "react-native";

import { OfflineAdvisorCard } from "@/components/offline/offline-advisor-card";
import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";

export function AiOfflineEmpty() {
  const { colors } = useThemeManager();
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={[styles.icon, { backgroundColor: colors.muted }]}>
        <Ionicons
          color={colors.foreground}
          name="cloud-offline-outline"
          size={28}
        />
      </View>
      <AppText
        variant="title"
        style={[styles.title, { color: colors.foreground }]}
      >
        {t("aiOfflineTitle")}
      </AppText>
      <AppText
        style={[styles.description, { color: colors.mutedForeground }]}
      >
        {t("aiOfflineDescription")}
      </AppText>
      <View style={styles.card}>
        <OfflineAdvisorCard />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 24,
    maxWidth: 420,
    width: "100%",
  },
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  description: {
    fontSize: 13,
    lineHeight: 22,
    marginTop: 7,
    maxWidth: 390,
    textAlign: "center",
  },
  icon: {
    alignItems: "center",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  title: {
    fontSize: 21,
    lineHeight: 34,
    marginTop: 14,
    textAlign: "center",
  },
});
