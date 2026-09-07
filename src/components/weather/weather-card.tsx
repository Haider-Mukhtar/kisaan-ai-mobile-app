import { router } from "expo-router";
import type { PropsWithChildren } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { WeatherAdvisory } from "@/components/weather/weather-advisory";
import { WeatherForecastList } from "@/components/weather/weather-forecast-list";
import {
  getDistrict,
  getDistrictName,
  PROVINCE_LABEL_KEYS,
} from "@/constants/districts";
import { Fonts } from "@/constants/theme";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage, type TranslationKey } from "@/providers/language-provider";
import { useProfile } from "@/providers/profile-provider";
import { useWeather } from "@/providers/weather-provider";
import { buildAdvisory } from "@/services/weather/advisory";
import { describeAge, formatTemperature } from "@/services/weather/format";
import { isSnapshotFresh, snapshotAgeMs } from "@/services/weather/types";
import { describeWeatherCode } from "@/services/weather/weather-codes";
import type { LocationSource } from "@/services/supabase/profiles";

type WeatherCardProps = {
  variant?: "detail" | "summary";
};

const SOURCE_LABEL_KEYS: Record<LocationSource, TranslationKey> = {
  gps: "locationSourceGps",
  manual: "locationSourceManual",
  default: "locationSourceDefault",
};

/**
 * The home screen's weather panel. It owns every state a forecast can be in —
 * no location yet, loading, failed, or showing something saved from earlier —
 * so a farmer always sees an explanation and a way forward.
 */
export function WeatherCard({ variant = "detail" }: WeatherCardProps) {
  const { colors } = useThemeManager();
  const { isRTL, language, t } = useLanguage();
  const { profile } = useProfile();
  const { error, isRefreshing, refresh, snapshot, status } = useWeather();

  const farmLocation = profile?.location ?? null;
  const district =
    getDistrict(farmLocation?.districtId) ??
    getDistrict(snapshot?.location.districtId);

  const openLocationPicker = () => router.push("/change-location");

  const header = district ? (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <AppText variant="label" style={[styles.district, { color: colors.foreground }]}>
          {`📍 ${getDistrictName(district, language)}`}
        </AppText>
        <AppText style={[styles.districtMeta, { color: colors.mutedForeground }]}>
          {`${t(PROVINCE_LABEL_KEYS[district.province])}${
            farmLocation ? ` · ${t(SOURCE_LABEL_KEYS[farmLocation.source])}` : ""
          }`}
        </AppText>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={openLocationPicker}
        style={({ pressed }) => [
          styles.changePill,
          { backgroundColor: colors.muted, borderColor: colors.border },
          pressed && styles.pressed,
        ]}
      >
        <AppText variant="label" style={[styles.changePillText, { color: colors.foreground }]}>
          {t("locationChangeTitle")}
        </AppText>
      </Pressable>
    </View>
  ) : null;

  if (status === "idle" || (!snapshot && !district)) {
    return (
      <Card>
        <AppText style={styles.stateEmoji}>🗺️</AppText>
        <AppText variant="label" style={[styles.stateTitle, { color: colors.foreground }]}>
          {t("weatherEmptyTitle")}
        </AppText>
        <AppText style={[styles.stateBody, { color: colors.mutedForeground }]}>
          {t("weatherEmptyDescription")}
        </AppText>
        <View style={styles.stateAction}>
          <SecondaryButton
            icon="📍"
            label={t("weatherEmptyAction")}
            onPress={openLocationPicker}
          />
        </View>
      </Card>
    );
  }

  if (status === "loading" && !snapshot) {
    return (
      <Card>
        {header}
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primaryDark} />
          <AppText style={[styles.stateBody, { color: colors.mutedForeground }]}>
            {t("weatherLoading")}
          </AppText>
        </View>
      </Card>
    );
  }

  if (!snapshot) {
    return (
      <Card>
        {header}
        <AppText style={styles.stateEmoji}>📡</AppText>
        <AppText variant="label" style={[styles.stateTitle, { color: colors.foreground }]}>
          {t("weatherErrorTitle")}
        </AppText>
        <AppText style={[styles.stateBody, { color: colors.mutedForeground }]}>
          {error?.kind === "offline"
            ? t("weatherErrorOfflineDescription")
            : t("weatherErrorDescription")}
        </AppText>
        <View style={styles.stateAction}>
          <SecondaryButton
            disabled={isRefreshing}
            icon="🔄"
            label={isRefreshing ? t("weatherLoading") : t("weatherRetry")}
            onPress={() => void refresh()}
          />
        </View>
      </Card>
    );
  }

  const [today] = snapshot.days;
  const condition = describeWeatherCode(
    snapshot.current?.weatherCode ?? today.weatherCode,
  );
  const heroTemp = snapshot.current?.tempC ?? today.tempMaxC;
  const age = describeAge(snapshotAgeMs(snapshot));
  const isStale = !isSnapshotFresh(snapshot);
  const advisory = buildAdvisory(snapshot);
  const windKph = snapshot.current?.windKph ?? today.windMaxKph;
  const humidity = snapshot.current?.humidity ?? null;

  const details: { key: string; label: string; value: string }[] = [];

  if (today.precipitationChance !== null) {
    details.push({
      key: "rain",
      label: t("weatherRainChance"),
      value:
        today.precipitationMm > 0
          ? `${t("weatherPercent", { value: today.precipitationChance })} · ${t(
              "weatherRainAmount",
              { value: today.precipitationMm },
            )}`
          : t("weatherPercent", { value: today.precipitationChance }),
    });
  }

  if (humidity !== null) {
    details.push({
      key: "humidity",
      label: t("weatherHumidity"),
      value: t("weatherPercent", { value: humidity }),
    });
  }

  if (windKph !== null) {
    details.push({
      key: "wind",
      label: t("weatherWind"),
      value: t("weatherWindSpeed", { value: Math.round(windKph) }),
    });
  }

  const summaryDetails = details.map((detail) =>
    detail.key === "rain" && today.precipitationChance !== null
      ? {
          ...detail,
          value: t("weatherPercent", { value: today.precipitationChance }),
        }
      : detail,
  );

  if (variant === "summary") {
    return (
      <Card>
        {header}

        <View style={styles.summaryHero}>
          <View style={styles.summaryCondition}>
            <AppText style={styles.summaryEmoji}>{condition.emoji}</AppText>
            <View style={styles.summaryConditionCopy}>
              <AppText
                style={[styles.summaryTemp, { color: colors.foreground }]}
              >
                {formatTemperature(heroTemp)}
              </AppText>
              <AppText
                variant="label"
                style={[styles.summaryConditionLabel, { color: colors.foreground }]}
              >
                {t(condition.labelKey)}
              </AppText>
            </View>
          </View>

          <View
            style={[styles.summaryRange, { backgroundColor: colors.input }]}
          >
            <AppText
              style={[
                styles.summaryRangeLabel,
                { color: colors.mutedForeground },
              ]}
            >
              {t("weatherHigh")}
            </AppText>
            <AppText
              variant="label"
              style={[styles.summaryRangeValue, { color: colors.foreground }]}
            >
              {formatTemperature(today.tempMaxC)}
            </AppText>
            <View style={[styles.summaryRangeDivider, { backgroundColor: colors.border }]} />
            <AppText
              style={[
                styles.summaryRangeLabel,
                { color: colors.mutedForeground },
              ]}
            >
              {t("weatherLow")}
            </AppText>
            <AppText
              variant="label"
              style={[styles.summaryRangeValue, { color: colors.foreground }]}
            >
              {formatTemperature(today.tempMinC)}
            </AppText>
          </View>
        </View>

        {summaryDetails.length > 0 ? (
          <View style={styles.summaryDetails}>
            {summaryDetails.map((detail) => (
              <View key={detail.key} style={styles.summaryDetail}>
                <AppText
                  style={[
                    styles.detailLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {detail.label}
                </AppText>
                <AppText
                  numberOfLines={1}
                  variant="label"
                  style={[styles.summaryDetailValue, { color: colors.foreground }]}
                >
                  {detail.value}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}

        {isStale ? (
          <AppText
            style={[styles.savedNotice, { color: colors.warning }]}
          >
            {t("weatherSavedNotice")}
          </AppText>
        ) : null}

        <View
          style={[styles.summaryFooter, { borderTopColor: colors.border }]}
        >
          <AppText
            style={[styles.updated, { color: colors.mutedForeground }]}
          >
            {t(age.key, { count: age.count })}
          </AppText>
          <Pressable
            accessibilityHint={t("weatherDetailsHint")}
            accessibilityRole="button"
            onPress={() => router.push("/weather-details")}
            style={({ pressed }) => [
              styles.detailsButton,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}
          >
            <AppText
              variant="label"
              style={[
                styles.detailsButtonText,
                { color: colors.primaryForeground },
              ]}
            >
              {`${t("weatherDetailsAction")}  ${isRTL ? "←" : "→"}`}
            </AppText>
          </Pressable>
        </View>
      </Card>
    );
  }

  return (
    <Card>
      {header}

      <View style={styles.hero}>
        <AppText style={styles.heroEmoji}>{condition.emoji}</AppText>
        <View style={styles.heroCopy}>
          <AppText style={[styles.heroTemp, { color: colors.foreground }]}>
            {formatTemperature(heroTemp)}
          </AppText>
          <AppText variant="label" style={[styles.heroCondition, { color: colors.foreground }]}>
            {t(condition.labelKey)}
          </AppText>
          <View style={styles.heroRange}>
            <AppText style={[styles.heroRangeText, { color: colors.mutedForeground }]}>
              {`${t("weatherHigh")} ${formatTemperature(today.tempMaxC)}`}
            </AppText>
            <AppText style={[styles.heroRangeText, { color: colors.mutedForeground }]}>
              {`${t("weatherLow")} ${formatTemperature(today.tempMinC)}`}
            </AppText>
          </View>
        </View>
      </View>

      {details.length > 0 ? (
        <View style={styles.details}>
          {details.map((detail) => (
            <View
              key={detail.key}
              style={[
                styles.detail,
                { backgroundColor: colors.input, borderColor: colors.border },
              ]}
            >
              <AppText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                {detail.label}
              </AppText>
              <AppText variant="label" style={[styles.detailValue, { color: colors.foreground }]}>
                {detail.value}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      {advisory ? <WeatherAdvisory advisory={advisory} /> : null}

      <WeatherForecastList days={snapshot.days} />

      {isStale ? (
        <AppText style={[styles.savedNotice, { color: colors.warning }]}>
          {t("weatherSavedNotice")}
        </AppText>
      ) : null}

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <AppText style={[styles.updated, { color: colors.mutedForeground }]}>
          {t(age.key, { count: age.count })}
        </AppText>

        <Pressable
          accessibilityRole="button"
          disabled={isRefreshing}
          onPress={() => void refresh()}
          style={({ pressed }) => [
            styles.refresh,
            pressed && styles.pressed,
            isRefreshing && styles.pressed,
          ]}
        >
          <AppText variant="label" style={[styles.refreshText, { color: colors.primaryDark }]}>
            {isRefreshing ? t("weatherLoading") : `🔄 ${t("weatherRefresh")}`}
          </AppText>
        </Pressable>
      </View>
    </Card>
  );
}

function Card({ children }: PropsWithChildren) {
  const { colors } = useThemeManager();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    width: "100%",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
  },
  headerText: {
    flex: 1,
  },
  district: {
    fontSize: 16,
    lineHeight: 28,
  },
  districtMeta: {
    fontSize: 12,
    lineHeight: 22,
  },
  changePill: {
    borderRadius: 14,
    borderWidth: 1,
    marginStart: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  changePillText: {
    fontSize: 12,
    lineHeight: 20,
  },
  hero: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 18,
  },
  summaryHero: {
    gap: 14,
    marginTop: 18,
  },
  summaryCondition: {
    alignItems: "center",
    flexDirection: "row",
  },
  summaryEmoji: {
    fontSize: 52,
    lineHeight: 64,
    marginEnd: 14,
  },
  summaryConditionCopy: {
    flex: 1,
  },
  summaryTemp: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 42,
    fontVariant: ["tabular-nums"],
    lineHeight: 50,
  },
  summaryConditionLabel: {
    fontSize: 15,
    lineHeight: 26,
  },
  summaryRange: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  summaryRangeLabel: {
    fontSize: 12,
    lineHeight: 20,
  },
  summaryRangeValue: {
    fontSize: 15,
    fontVariant: ["tabular-nums"],
    lineHeight: 24,
    marginStart: 6,
  },
  summaryRangeDivider: {
    height: 22,
    marginHorizontal: 12,
    width: StyleSheet.hairlineWidth,
  },
  summaryDetails: {
    flexDirection: "row",
    marginTop: 18,
  },
  summaryDetail: {
    flex: 1,
    minWidth: 0,
    paddingEnd: 8,
  },
  summaryDetailValue: {
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    lineHeight: 24,
  },
  summaryFooter: {
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    marginTop: 18,
    paddingTop: 14,
  },
  detailsButton: {
    borderRadius: 14,
    marginStart: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  detailsButtonText: {
    fontSize: 13,
    lineHeight: 22,
  },
  heroEmoji: {
    fontSize: 60,
    lineHeight: 72,
    marginEnd: 16,
  },
  heroCopy: {
    flex: 1,
  },
  heroTemp: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 46,
    lineHeight: 56,
  },
  heroCondition: {
    fontSize: 16,
    lineHeight: 28,
  },
  heroRange: {
    flexDirection: "row",
    gap: 14,
    marginTop: 2,
  },
  heroRangeText: {
    fontSize: 13,
    lineHeight: 22,
  },
  details: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  detail: {
    borderRadius: 14,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: 96,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 12,
    lineHeight: 20,
  },
  detailValue: {
    fontSize: 15,
    lineHeight: 26,
  },
  savedNotice: {
    fontSize: 13,
    lineHeight: 23,
    marginTop: 16,
  },
  footer: {
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    paddingTop: 14,
  },
  updated: {
    flex: 1,
    fontSize: 12,
    lineHeight: 22,
  },
  refresh: {
    marginStart: 12,
    paddingVertical: 4,
  },
  refreshText: {
    fontSize: 14,
    lineHeight: 24,
  },
  loading: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 28,
  },
  stateEmoji: {
    fontSize: 44,
    lineHeight: 56,
    marginTop: 8,
    textAlign: "center",
  },
  stateTitle: {
    fontSize: 18,
    lineHeight: 30,
    marginTop: 4,
    textAlign: "center",
  },
  stateBody: {
    fontSize: 14,
    lineHeight: 25,
    marginTop: 4,
    textAlign: "center",
  },
  stateAction: {
    marginTop: 18,
  },
  pressed: {
    opacity: 0.7,
  },
});
