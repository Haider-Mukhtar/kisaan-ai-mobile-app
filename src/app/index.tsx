import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";

export default function Index() {
  const { colors } = useThemeManager();
  const { t } = useLanguage();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppText
        variant="title"
        style={[styles.appName, { color: colors.primaryDark }]}
      >
        {t("appName")}
      </AppText>
      <AppText
        variant="title"
        style={[styles.title, { color: colors.foreground }]}
      >
        {t("setupSavedTitle")}
      </AppText>
      <AppText style={[styles.description, { color: colors.mutedForeground }]}>
        {t("setupSavedDescription")}
      </AppText>

      <View
        style={[
          styles.readyCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[styles.readyDot, { backgroundColor: colors.success }]} />
        <AppText style={[styles.readyText, { color: colors.cardForeground }]}>
          {t("welcomeSubtitle")}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  appName: {
    fontSize: 22,
    lineHeight: 42,
  },
  title: {
    fontSize: 32,
    lineHeight: 52,
    marginTop: 2,
  },
  description: {
    fontSize: 16,
    lineHeight: 28,
    marginTop: 8,
    textAlign: "center",
  },
  readyCard: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 30,
    maxWidth: 420,
    padding: 18,
    width: "100%",
  },
  readyDot: {
    borderRadius: 6,
    height: 12,
    marginEnd: 12,
    width: 12,
  },
  readyText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 24,
  },
});
