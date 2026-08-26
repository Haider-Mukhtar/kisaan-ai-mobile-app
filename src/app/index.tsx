import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import { useOnboarding } from "@/providers/onboarding-provider";

export default function Index() {
  const { colors } = useThemeManager();
  const { t } = useLanguage();
  const { resetOnboarding } = useOnboarding();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetOnboarding = async () => {
    if (isResetting) {
      return;
    }

    setIsResetting(true);
    await resetOnboarding();
  };

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

      <Pressable
        accessibilityRole="button"
        disabled={isResetting}
        onPress={() => void handleResetOnboarding()}
        style={({ pressed }) => [
          styles.resetButton,
          {
            backgroundColor: colors.primary,
            borderColor: colors.primaryDark,
          },
          pressed && styles.resetButtonPressed,
          isResetting && styles.resetButtonDisabled,
        ]}
      >
        <AppText
          variant="label"
          style={[styles.resetButtonText, { color: colors.primaryForeground }]}
        >
          {isResetting ? t("resettingOnboarding") : t("resetOnboarding")}
        </AppText>
      </Pressable>
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
  resetButton: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 18,
    maxWidth: 420,
    minHeight: 56,
    justifyContent: "center",
    paddingHorizontal: 24,
    width: "100%",
  },
  resetButtonText: {
    fontSize: 15,
    lineHeight: 25,
    textAlign: "center",
  },
  resetButtonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  resetButtonDisabled: {
    opacity: 0.55,
  },
});
