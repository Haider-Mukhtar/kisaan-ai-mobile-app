import { router } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { Fonts } from "@/constants/theme";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage, type TranslationKey } from "@/providers/language-provider";
import { useProfile } from "@/providers/profile-provider";
import { useSatelliteHealth } from "@/providers/satellite-provider";
import {
  describeSatelliteAge,
  type MoistureStatus,
  type NDVIHealthStatus,
} from "@/services/satelliteService";

const STATUS_COLOR = {
  good: "#12A150",
  moderate: "#D97706",
  alert: "#DD352E",
} as const;

const STATUS_BG = {
  good: "rgba(18, 161, 80, 0.12)",
  moderate: "rgba(217, 119, 6, 0.12)",
  alert: "rgba(221, 53, 46, 0.12)",
} as const;

const STATUS_TITLE_KEYS: Record<NDVIHealthStatus, TranslationKey> = {
  good: "satelliteHealthGood",
  moderate: "satelliteHealthModerate",
  alert: "satelliteHealthAlert",
};

const STATUS_DESC_KEYS: Record<NDVIHealthStatus, TranslationKey> = {
  good: "satelliteHealthDescGood",
  moderate: "satelliteHealthDescModerate",
  alert: "satelliteHealthDescAlert",
};

const MOISTURE_KEYS: Record<MoistureStatus, TranslationKey> = {
  adequate: "satelliteMoistureAdequate",
  low: "satelliteMoistureLow",
  surplus: "satelliteMoistureSurplus",
};

export function SatelliteHealthCard() {
  const { colors } = useThemeManager();
  const { isRTL, t } = useLanguage();
  const { profile } = useProfile();
  const { isRefreshing, refresh, snapshot, status } = useSatelliteHealth();

  const farmLocation = profile?.location ?? null;

  // Empty state if farm location has not been configured yet
  if (!farmLocation && !snapshot) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <AppText style={styles.stateEmoji}>🛰️</AppText>
        <AppText
          variant="label"
          style={[styles.stateTitle, { color: colors.foreground }]}
        >
          {t("satelliteEmptyTitle")}
        </AppText>
        <AppText style={[styles.stateBody, { color: colors.mutedForeground }]}>
          {t("satelliteEmptyDesc")}
        </AppText>
        <View style={styles.stateAction}>
          <SecondaryButton
            icon="📍"
            label={t("weatherEmptyAction")}
            onPress={() => router.push("/change-location")}
          />
        </View>
      </View>
    );
  }

  // Initial loading state
  if (status === "loading" && !snapshot) {
    return (
      <View
        style={[
          styles.card,
          styles.loadingContainer,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <ActivityIndicator color={colors.primaryDark} size="small" />
        <AppText style={[styles.loadingText, { color: colors.mutedForeground }]}>
          {t("splashLoading")}
        </AppText>
      </View>
    );
  }

  if (!snapshot) {
    return null;
  }

  const { metrics, capturedAt, source } = snapshot;
  const statusColor = STATUS_COLOR[metrics.healthStatus];
  const statusBg = STATUS_BG[metrics.healthStatus];
  const ageLabel = describeSatelliteAge(capturedAt, t);

  // Position for the meter gauge marker (0.0 to 1.0 mapped to 0% to 100%)
  // Clamped between 4% and 96% to keep the needle within bounds
  const clampedNdvi = Math.max(0, Math.min(1, metrics.ndvi));
  const pointerPercent = Math.max(4, Math.min(96, Math.round(clampedNdvi * 100)));

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Header: Title and Status Badge */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <AppText
            variant="label"
            style={[styles.cardTitle, { color: colors.foreground }]}
          >
            {t("satelliteCardTitle")}
          </AppText>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.satelliteBadge,
                {
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                },
              ]}
            >
              <AppText style={styles.badgeIcon}>🛰️</AppText>
              <AppText
                variant="body"
                style={[styles.badgeText, { color: colors.mutedForeground }]}
              >
                {ageLabel}
              </AppText>
            </View>

            {source === "cache" ? (
              <View
                style={[
                  styles.cacheBadge,
                  {
                    backgroundColor: "rgba(217, 119, 6, 0.12)",
                    borderColor: "rgba(217, 119, 6, 0.3)",
                  },
                ]}
              >
                <AppText style={[styles.cacheBadgeText, { color: colors.warning }]}>
                  {t("satelliteSavedBadge")}
                </AppText>
              </View>
            ) : null}

            {snapshot.isHighAccuracy ? (
              <View
                style={[
                  styles.highAccuracyBadge,
                  {
                    backgroundColor: "rgba(18, 161, 80, 0.12)",
                    borderColor: "rgba(18, 161, 80, 0.35)",
                  },
                ]}
              >
                <AppText style={styles.highAccuracyIcon}>🎯</AppText>
                <AppText
                  variant="label"
                  style={[styles.highAccuracyText, { color: colors.success }]}
                >
                  {t("satelliteHighAccuracyBadge")}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>

        <Pressable
          accessibilityLabel={t("satelliteRefresh")}
          accessibilityRole="button"
          disabled={isRefreshing}
          onPress={() => void refresh()}
          style={({ pressed }) => [
            styles.refreshButton,
            { backgroundColor: colors.muted, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          {isRefreshing ? (
            <ActivityIndicator color={colors.primaryDark} size="small" />
          ) : (
            <AppText style={styles.refreshIcon}>🔄</AppText>
          )}
        </Pressable>
      </View>

      {/* Main Score & Health Vigor Display */}
      <View style={styles.heroSection}>
        <View style={styles.scoreRow}>
          <View style={styles.scoreNumberBlock}>
            <AppText
              style={[
                styles.ndviValue,
                { color: statusColor, fontFamily: Fonts.interSemiBold },
              ]}
            >
              {metrics.ndvi.toFixed(2)}
            </AppText>
            <AppText
              variant="label"
              style={[styles.ndviMax, { color: colors.mutedForeground }]}
            >
              / 1.00 NDVI
            </AppText>
          </View>

          <View
            style={[
              styles.statusPill,
              { backgroundColor: statusBg, borderColor: statusColor },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <AppText
              variant="label"
              style={[styles.statusPillText, { color: statusColor }]}
            >
              {t(STATUS_TITLE_KEYS[metrics.healthStatus])}
            </AppText>
          </View>
        </View>

        <AppText
          style={[styles.statusDescription, { color: colors.mutedForeground }]}
        >
          {t(STATUS_DESC_KEYS[metrics.healthStatus])}
        </AppText>
      </View>

      {/* Visual Health Meter Gauge */}
      <View style={styles.gaugeContainer}>
        {/* Track Bar with 3 Colored Segments */}
        <View style={styles.gaugeTrack}>
          {/* Segment 1: Alert (< 0.40) */}
          <View
            style={[
              styles.gaugeSegment,
              styles.segmentAlert,
              { flex: 4 },
            ]}
          />
          {/* Segment 2: Moderate (0.40 - 0.60) */}
          <View
            style={[
              styles.gaugeSegment,
              styles.segmentModerate,
              { flex: 2 },
            ]}
          />
          {/* Segment 3: Good (0.60 - 1.00) */}
          <View
            style={[
              styles.gaugeSegment,
              styles.segmentGood,
              { flex: 4 },
            ]}
          />
        </View>

        {/* Gauge Pointer Needle */}
        <View
          style={[
            styles.gaugePointerWrapper,
            isRTL
              ? { right: `${pointerPercent}%` }
              : { left: `${pointerPercent}%` },
          ]}
        >
          <View
            style={[
              styles.gaugePointer,
              { backgroundColor: colors.foreground, borderColor: colors.card },
            ]}
          />
        </View>

        {/* Meter Labels */}
        <View style={styles.gaugeLabels}>
          <AppText
            variant="label"
            style={[styles.gaugeLabelText, { color: STATUS_COLOR.alert }]}
          >
            {t("satelliteMeterLow")} (0.0 - 0.4)
          </AppText>
          <AppText
            variant="label"
            style={[styles.gaugeLabelText, { color: STATUS_COLOR.moderate }]}
          >
            {t("satelliteMeterMod")} (0.4 - 0.6)
          </AppText>
          <AppText
            variant="label"
            style={[styles.gaugeLabelText, { color: STATUS_COLOR.good }]}
          >
            {t("satelliteMeterGood")} (0.6 - 1.0)
          </AppText>
        </View>
      </View>

      {/* Sub-Metrics Grid */}
      <View style={styles.metricsGrid}>
        {/* Metric: Canopy Density */}
        <View
          style={[
            styles.metricBox,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <AppText
            style={[styles.metricLabel, { color: colors.mutedForeground }]}
          >
            {t("satelliteMetricVegetation")}
          </AppText>
          <AppText
            variant="label"
            style={[
              styles.metricValue,
              { color: colors.foreground, fontFamily: Fonts.interSemiBold },
            ]}
          >
            {`${metrics.vegetationDensity}%`}
          </AppText>
        </View>

        {/* Metric: Moisture Index */}
        <View
          style={[
            styles.metricBox,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <AppText
            style={[styles.metricLabel, { color: colors.mutedForeground }]}
          >
            {t("satelliteMetricMoisture")}
          </AppText>
          <AppText
            variant="label"
            style={[
              styles.metricValue,
              { color: colors.foreground, fontFamily: Fonts.interSemiBold },
            ]}
          >
            {`${metrics.moistureLevel}% · ${t(MOISTURE_KEYS[metrics.moistureStatus])}`}
          </AppText>
        </View>

        {/* Metric: Resolution & Constellation */}
        <View
          style={[
            styles.metricBox,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <AppText
            style={[styles.metricLabel, { color: colors.mutedForeground }]}
          >
            {t("satelliteMetricResolution")}
          </AppText>
          <AppText
            variant="label"
            style={[styles.metricValue, { color: colors.foreground }]}
          >
            {t("satelliteResolutionValue")}
          </AppText>
        </View>
      </View>

      {/* Clear Uncertainty Framing as per Safety Rules */}
      <View
        style={[
          styles.uncertaintyBox,
          {
            backgroundColor: "rgba(0, 98, 57, 0.05)",
            borderColor: "rgba(0, 98, 57, 0.18)",
          },
        ]}
      >
        <View style={styles.uncertaintyHeader}>
          <AppText style={styles.uncertaintyIcon}>🛡️</AppText>
          <AppText
            variant="label"
            style={[styles.uncertaintyTitle, { color: colors.primaryDark }]}
          >
            {t("satelliteUncertaintyBadge")}
          </AppText>
        </View>
        <AppText
          style={[styles.uncertaintyText, { color: colors.mutedForeground }]}
        >
          {t("satelliteUncertaintyNotice")}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    width: "100%",
  },
  loadingContainer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    lineHeight: 22,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerTitleGroup: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 26,
  },
  badgeRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  satelliteBadge: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeIcon: {
    fontSize: 12,
    lineHeight: 16,
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 17,
  },
  cacheBadge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  cacheBadgeText: {
    fontSize: 10,
    lineHeight: 14,
  },
  highAccuracyBadge: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  highAccuracyIcon: {
    fontSize: 11,
    lineHeight: 15,
  },
  highAccuracyText: {
    fontSize: 10,
    lineHeight: 15,
  },
  refreshButton: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    marginStart: 8,
    width: 34,
  },
  refreshIcon: {
    fontSize: 14,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.7,
  },
  heroSection: {
    marginTop: 16,
  },
  scoreRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  scoreNumberBlock: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 6,
  },
  ndviValue: {
    fontSize: 38,
    fontVariant: ["tabular-nums"],
    lineHeight: 46,
  },
  ndviMax: {
    fontSize: 13,
    lineHeight: 20,
  },
  statusPill: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  statusPillText: {
    fontSize: 13,
    lineHeight: 20,
  },
  statusDescription: {
    fontSize: 13,
    lineHeight: 21,
    marginTop: 4,
  },
  gaugeContainer: {
    marginTop: 16,
    position: "relative",
  },
  gaugeTrack: {
    borderRadius: 6,
    flexDirection: "row",
    gap: 3,
    height: 10,
    overflow: "hidden",
    width: "100%",
  },
  gaugeSegment: {
    borderRadius: 3,
    height: "100%",
  },
  segmentAlert: {
    backgroundColor: STATUS_COLOR.alert,
  },
  segmentModerate: {
    backgroundColor: STATUS_COLOR.moderate,
  },
  segmentGood: {
    backgroundColor: STATUS_COLOR.good,
  },
  gaugePointerWrapper: {
    alignItems: "center",
    height: 16,
    marginLeft: -6,
    marginRight: -6,
    marginTop: -13,
    position: "absolute",
    top: 0,
    width: 12,
  },
  gaugePointer: {
    borderRadius: 6,
    borderWidth: 2,
    elevation: 3,
    height: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    width: 12,
  },
  gaugeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  gaugeLabelText: {
    fontSize: 10,
    lineHeight: 16,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  metricBox: {
    borderRadius: 14,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: 94,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricLabel: {
    fontSize: 11,
    lineHeight: 18,
  },
  metricValue: {
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    lineHeight: 22,
    marginTop: 2,
  },
  uncertaintyBox: {
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    padding: 12,
  },
  uncertaintyHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
  },
  uncertaintyIcon: {
    fontSize: 14,
    lineHeight: 18,
  },
  uncertaintyTitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  uncertaintyText: {
    fontSize: 11,
    lineHeight: 18,
  },
  stateEmoji: {
    fontSize: 40,
    lineHeight: 52,
    marginTop: 4,
    textAlign: "center",
  },
  stateTitle: {
    fontSize: 17,
    lineHeight: 26,
    marginTop: 4,
    textAlign: "center",
  },
  stateBody: {
    fontSize: 13,
    lineHeight: 22,
    marginTop: 4,
    textAlign: "center",
  },
  stateAction: {
    marginTop: 14,
  },
});
