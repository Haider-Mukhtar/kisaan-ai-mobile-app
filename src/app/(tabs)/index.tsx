import { useRouter } from "expo-router";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-screens/experimental";

import { OfflineAdvisorCard } from "@/components/offline/offline-advisor-card";
import { AppText } from "@/components/ui/app-text";
import { HomeAlerts } from "@/components/alerts/home-alerts";
import { WeatherCard } from "@/components/weather/weather-card";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import { useNetwork } from "@/providers/network-provider";
import { useProfile } from "@/providers/profile-provider";
import { useWeather } from "@/providers/weather-provider";

export default function HomeScreen() {
  const { colors } = useThemeManager();
  const { isRTL, t } = useLanguage();
  const { isOffline } = useNetwork();
  const router = useRouter();
  const { profile } = useProfile();
  const { isRefreshing, refresh } = useWeather();
  const firstName = profile?.fullName?.trim().split(/\s+/)[0] ?? "";

  return (
    <SafeAreaView
      collapsable={false}
      edges={{ top: !isOffline }}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <AppText
          variant="label"
          style={[styles.appName, { color: colors.primaryDark }]}
        >
          {t("appName")}
        </AppText>
        <AppText
          variant="title"
          style={[styles.greeting, { color: colors.foreground }]}
        >
          {firstName
            ? t("homeGreeting", { name: firstName })
            : t("homeGreetingPlain")}
        </AppText>
        <AppText
          style={[styles.subtitle, { color: colors.mutedForeground }]}
        >
          {t("homeSubtitle")}
        </AppText>
      </View>

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
        style={styles.scroll}
      >
        <HomeAlerts />

        <Pressable
          accessibilityHint={t("homeBlogsHint")}
          accessibilityRole="button"
          android_ripple={{ color: "rgba(255, 255, 255, 0.14)" }}
          onPress={() => router.push("/blogs")}
          style={({ pressed }) => [
            styles.blogButton,
            {
              backgroundColor: colors.primaryDark,
              opacity: pressed ? 0.88 : 1,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            },
          ]}
        >
            <View style={styles.blogDecorationLarge} />
            <View style={styles.blogDecorationSmall} />
            <View style={styles.blogIcon}>
              <AppText style={styles.blogEmoji}>🌾</AppText>
            </View>
            <View style={styles.blogCopy}>
              <AppText style={styles.blogEyebrow} variant="label">
                {t("blogsTitle")}
              </AppText>
              <AppText variant="label" style={styles.blogTitle}>
                {t("homeBlogsTitle")}
              </AppText>
              <AppText style={styles.blogBody}>
                {t("homeBlogsBody")}
              </AppText>
            </View>
            <View style={styles.blogArrowCircle}>
              <AppText style={styles.blogArrow}>{isRTL ? "‹" : "›"}</AppText>
            </View>
        </Pressable>

        <View style={styles.weather}>
          <WeatherCard variant="summary" />
        </View>

        <View style={styles.offline}>
          <OfflineAdvisorCard />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  scroll: { flex: 1 },
  content: {
    paddingBottom: 92,
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  appName: { fontSize: 14, lineHeight: 26 },
  greeting: { fontSize: 26, lineHeight: 44 },
  subtitle: { fontSize: 14, lineHeight: 25, marginTop: 2 },
  blogButton: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 24,
    boxShadow: "0 6px 18px rgba(0, 98, 57, 0.20)",
    flexDirection: "row",
    gap: 14,
    marginTop: 20,
    minHeight: 126,
    overflow: "hidden",
    padding: 18,
    position: "relative",
  },
  blogDecorationLarge: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 100,
    height: 150,
    position: "absolute",
    right: -62,
    top: -76,
    width: 150,
  },
  blogDecorationSmall: {
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderRadius: 50,
    bottom: -35,
    height: 82,
    left: 38,
    position: "absolute",
    width: 82,
  },
  blogIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderCurve: "continuous",
    borderRadius: 18,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  blogEmoji: { fontSize: 28, lineHeight: 38, textAlign: "center" },
  blogCopy: { flex: 1, gap: 2 },
  blogEyebrow: {
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: 10,
    letterSpacing: 0.7,
    lineHeight: 17,
    textTransform: "uppercase",
  },
  blogTitle: { color: "#FFFFFF", fontSize: 17, lineHeight: 27 },
  blogBody: { color: "rgba(255, 255, 255, 0.82)", fontSize: 12, lineHeight: 20 },
  blogArrowCircle: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 18,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  blogArrow: { color: "#FFFFFF", fontSize: 25, lineHeight: 28, textAlign: "center" },
  weather: { marginTop: 20 },
  offline: { marginTop: 14 },
});
