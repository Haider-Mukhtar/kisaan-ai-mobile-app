import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/app-text";
import { WeatherCard } from "@/components/weather/weather-card";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import { useNetwork } from "@/providers/network-provider";
import { useProfile } from "@/providers/profile-provider";
import { useWeather } from "@/providers/weather-provider";

export default function HomeScreen() {
  const { colors } = useThemeManager();
  const { t } = useLanguage();
  const { isOffline } = useNetwork();
  const { profile } = useProfile();
  const { isRefreshing, refresh } = useWeather();
  const firstName = profile?.fullName?.trim().split(/\s+/)[0] ?? "";

  return (
    <SafeAreaView
      edges={isOffline ? [] : ["top"]}
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

        <View style={styles.weather}>
          <WeatherCard />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  appName: { fontSize: 14, lineHeight: 26 },
  greeting: { fontSize: 26, lineHeight: 44 },
  subtitle: { fontSize: 14, lineHeight: 25, marginTop: 2 },
  weather: { marginTop: 20 },
});
