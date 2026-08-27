import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import { useAuth } from "@/providers/auth-provider";
import { useLanguage } from "@/providers/language-provider";
import { useOnboarding } from "@/providers/onboarding-provider";
import { useProfile } from "@/providers/profile-provider";
import { formatPakistaniMobile } from "@/utils/phone";

export default function Index() {
  const { colors } = useThemeManager();
  const { t } = useLanguage();
  const { resetOnboarding } = useOnboarding();
  const { isAuthenticated, isBusy, signOut } = useAuth();
  const { profile } = useProfile();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetOnboarding = async () => {
    if (isResetting) {
      return;
    }

    setIsResetting(true);
    await resetOnboarding();
  };

  const handleSignOut = async () => {
    if (isBusy) {
      return;
    }

    await signOut();
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
        <View
          style={[
            styles.readyDot,
            {
              backgroundColor: isAuthenticated ? colors.success : colors.muted,
            },
          ]}
        />
        <AppText style={[styles.readyText, { color: colors.cardForeground }]}>
          {isAuthenticated && profile?.phone
            ? t("authSignedInWithPhone", {
                phone: formatPakistaniMobile(profile.phone),
              })
            : t("authSignedOutStatus")}
        </AppText>
      </View>

      {isAuthenticated ? (
        <Pressable
          accessibilityRole="button"
          disabled={isBusy}
          onPress={() => void handleSignOut()}
          style={({ pressed }) => [
            styles.resetButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
            pressed && styles.resetButtonPressed,
            isBusy && styles.resetButtonDisabled,
          ]}
        >
          <AppText
            variant="label"
            style={[styles.resetButtonText, { color: colors.foreground }]}
          >
            {isBusy ? t("authSigningOut") : t("authSignOut")}
          </AppText>
        </Pressable>
      ) : null}

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
