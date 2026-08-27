import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/app-text";
import { WeatherCard } from "@/components/weather/weather-card";
import useThemeManager from "@/hooks/use-theme-manager";
import { useAuth } from "@/providers/auth-provider";
import { useLanguage } from "@/providers/language-provider";
import { useNetwork } from "@/providers/network-provider";
import { useOnboarding } from "@/providers/onboarding-provider";
import { useProfile } from "@/providers/profile-provider";
import { useWeather } from "@/providers/weather-provider";
import { formatPakistaniMobile } from "@/utils/phone";

export default function Index() {
  const { colors } = useThemeManager();
  const { t } = useLanguage();
  const { resetOnboarding } = useOnboarding();
  const { isAuthenticated, isBusy, signOut } = useAuth();
  const { isOffline } = useNetwork();
  const { profile } = useProfile();
  const { isRefreshing, refresh } = useWeather();
  const [isResetting, setIsResetting] = useState(false);

  const firstName = profile?.fullName?.trim().split(/\s+/)[0] ?? "";

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
    <SafeAreaView
      edges={isOffline ? ["bottom"] : ["top", "bottom"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
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
      >
        <AppText variant="label" style={[styles.appName, { color: colors.primaryDark }]}>
          {t("appName")}
        </AppText>
        <AppText variant="title" style={[styles.greeting, { color: colors.foreground }]}>
          {firstName
            ? t("homeGreeting", { name: firstName })
            : t("homeGreetingPlain")}
        </AppText>
        <AppText style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {t("homeSubtitle")}
        </AppText>

        <View style={styles.section}>
          <WeatherCard />
        </View>

        <View
          style={[
            styles.statusCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isAuthenticated ? colors.success : colors.muted },
            ]}
          />
          <AppText style={[styles.statusText, { color: colors.cardForeground }]}>
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
              styles.secondaryButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && styles.pressed,
              isBusy && styles.disabled,
            ]}
          >
            <AppText
              variant="label"
              style={[styles.secondaryButtonText, { color: colors.foreground }]}
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
            styles.secondaryButton,
            { backgroundColor: colors.muted, borderColor: colors.border },
            pressed && styles.pressed,
            isResetting && styles.disabled,
          ]}
        >
          <AppText
            variant="label"
            style={[styles.secondaryButtonText, { color: colors.mutedForeground }]}
          >
            {isResetting ? t("resettingOnboarding") : t("resetOnboarding")}
          </AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  appName: {
    fontSize: 14,
    lineHeight: 26,
  },
  greeting: {
    fontSize: 26,
    lineHeight: 44,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 25,
    marginTop: 2,
  },
  section: {
    marginTop: 20,
  },
  statusCard: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 20,
    padding: 16,
  },
  statusDot: {
    borderRadius: 6,
    height: 12,
    marginEnd: 12,
    width: 12,
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 24,
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 12,
    minHeight: 54,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    fontSize: 15,
    lineHeight: 26,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.84,
  },
  disabled: {
    opacity: 0.55,
  },
});
