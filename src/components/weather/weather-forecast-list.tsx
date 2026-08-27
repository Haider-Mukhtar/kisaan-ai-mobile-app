import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Fonts } from "@/constants/theme";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import { dayLabelKey, formatTemperature } from "@/services/weather/format";
import { describeWeatherCode } from "@/services/weather/weather-codes";
import type { DailyForecast } from "@/services/weather/types";

type WeatherForecastListProps = {
  days: DailyForecast[];
};

/**
 * Vertical rows rather than a horizontal strip: it reads the same way in Urdu
 * and English, and there is nothing to discover by swiping.
 */
export function WeatherForecastList({ days }: WeatherForecastListProps) {
  const { colors } = useThemeManager();
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <AppText variant="label" style={[styles.heading, { color: colors.foreground }]}>
        {t("weatherForecastTitle")}
      </AppText>

      {days.map((day, index) => {
        const condition = describeWeatherCode(day.weatherCode);
        const chance = day.precipitationChance;

        return (
          <View
            key={day.date}
            style={[
              styles.row,
              { borderTopColor: colors.border },
              index === 0 && styles.firstRow,
            ]}
          >
            <AppText style={styles.emoji}>{condition.emoji}</AppText>

            <View style={styles.labels}>
              <AppText variant="label" style={[styles.day, { color: colors.foreground }]}>
                {t(dayLabelKey(day.date))}
              </AppText>
              <AppText style={[styles.condition, { color: colors.mutedForeground }]}>
                {t(condition.labelKey)}
                {chance !== null && chance >= 20
                  ? ` · ${t("weatherPercent", { value: chance })}`
                  : ""}
              </AppText>
            </View>

            <View style={styles.temps}>
              <AppText style={[styles.high, { color: colors.foreground }]}>
                {formatTemperature(day.tempMaxC)}
              </AppText>
              <AppText style={[styles.low, { color: colors.mutedForeground }]}>
                {formatTemperature(day.tempMinC)}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 22,
  },
  heading: {
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 4,
  },
  row: {
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    paddingVertical: 12,
  },
  firstRow: {
    borderTopWidth: 0,
  },
  emoji: {
    fontSize: 24,
    lineHeight: 34,
    marginEnd: 12,
    width: 30,
  },
  labels: {
    flex: 1,
  },
  day: {
    fontSize: 15,
    lineHeight: 26,
  },
  condition: {
    fontSize: 13,
    lineHeight: 22,
  },
  temps: {
    // Highest temperature always leads, in both reading directions.
    direction: "ltr",
    flexDirection: "row",
    marginStart: 12,
  },
  high: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 16,
    lineHeight: 26,
  },
  low: {
    fontFamily: Fonts.interRegular,
    fontSize: 16,
    lineHeight: 26,
    marginStart: 8,
  },
});
