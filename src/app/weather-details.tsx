import { RefreshControl, ScrollView, StyleSheet } from "react-native";

import { WeatherCard } from "@/components/weather/weather-card";
import useThemeManager from "@/hooks/use-theme-manager";
import { useWeather } from "@/providers/weather-provider";

export default function WeatherDetailsScreen() {
  const { colors } = useThemeManager();
  const { isRefreshing, refresh } = useWeather();

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
      <WeatherCard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});
