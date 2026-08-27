import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import type { WeatherAdvisory as Advisory } from "@/services/weather/advisory";

type WeatherAdvisoryProps = {
  advisory: Advisory;
};

/** The one thing to do about today's weather, in plain language. */
export function WeatherAdvisory({ advisory }: WeatherAdvisoryProps) {
  const { colors } = useThemeManager();
  const { t } = useLanguage();
  const accent = colors[advisory.tone];

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: colors.muted, borderColor: accent },
      ]}
    >
      <AppText style={styles.emoji}>{advisory.emoji}</AppText>
      <View style={styles.copy}>
        <AppText variant="label" style={[styles.title, { color: accent }]}>
          {t(advisory.titleKey)}
        </AppText>
        <AppText style={[styles.body, { color: colors.mutedForeground }]}>
          {t(advisory.bodyKey)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 20,
    padding: 16,
  },
  emoji: {
    fontSize: 24,
    lineHeight: 32,
    marginEnd: 12,
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    lineHeight: 26,
  },
  body: {
    fontSize: 14,
    lineHeight: 25,
    marginTop: 2,
  },
});
