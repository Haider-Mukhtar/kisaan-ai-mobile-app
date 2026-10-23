import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import MapView, {
  Marker,
  Polygon,
  type MapPressEvent,
} from "react-native-maps";
import { SafeAreaView } from "react-native-screens/experimental";

import { AppText } from "@/components/ui/app-text";
import { Fonts } from "@/constants/theme";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import { useNetwork } from "@/providers/network-provider";
import { useProfile } from "@/providers/profile-provider";
import type { LatLng } from "@/services/supabase/profiles";

const REQUIRED_PIN_COUNT = 4;

export function FieldMappingScreen() {
  const { colors, isDarkMode } = useThemeManager();
  const { isRTL, t } = useLanguage();
  const { isOffline } = useNetwork();
  const { isSaving, profile, savePolygonBoundary } = useProfile();

  const existingBoundary = profile?.location?.polygonBoundary ?? null;
  const initialPins = useMemo(() => {
    if (existingBoundary && existingBoundary.length === REQUIRED_PIN_COUNT) {
      return existingBoundary;
    }
    return [];
  }, [existingBoundary]);

  const [pins, setPins] = useState<LatLng[]>(initialPins);
  const [mapError, setMapError] = useState(false);

  // Initial center coordinates
  const initialRegion = useMemo(() => {
    if (initialPins.length > 0) {
      const avgLat = initialPins.reduce((sum, p) => sum + p.latitude, 0) / initialPins.length;
      const avgLon = initialPins.reduce((sum, p) => sum + p.longitude, 0) / initialPins.length;
      return {
        latitude: avgLat,
        longitude: avgLon,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
    }

    if (profile?.location?.latitude && profile?.location?.longitude) {
      return {
        latitude: profile.location.latitude,
        longitude: profile.location.longitude,
        latitudeDelta: 0.006,
        longitudeDelta: 0.006,
      };
    }

    // Default Punjab farmland coordinates (Lahore outskirts)
    return {
      latitude: 31.5204,
      longitude: 74.3587,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    };
  }, [initialPins, profile?.location]);

  const handleMapPress = useCallback((e: MapPressEvent) => {
    const coord = e.nativeEvent.coordinate;
    setPins((current) => {
      if (current.length >= REQUIRED_PIN_COUNT) {
        return current;
      }
      return [
        ...current,
        {
          latitude: Number(coord.latitude.toFixed(6)),
          longitude: Number(coord.longitude.toFixed(6)),
        },
      ];
    });
  }, []);

  const handleClearPins = useCallback(() => {
    setPins([]);
  }, []);

  const handleSaveBoundary = useCallback(async () => {
    if (pins.length !== REQUIRED_PIN_COUNT) {
      return;
    }
    const success = await savePolygonBoundary(pins);
    if (success) {
      router.back();
    }
  }, [pins, savePolygonBoundary]);

  const isComplete = pins.length === REQUIRED_PIN_COUNT;

  // Offline or Map Load Failure Fallback View
  if (isOffline || mapError) {
    return (
      <SafeAreaView
        collapsable={false}
        edges={{ top: true }}
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel={t("back")}
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <AppText style={[styles.backArrow, { color: colors.foreground }]}>
              {isRTL ? "›" : "‹"}
            </AppText>
          </Pressable>
          <AppText variant="title" style={[styles.headerTitle, { color: colors.foreground }]}>
            {t("fieldMappingTitle")}
          </AppText>
        </View>

        <View style={styles.fallbackContainer}>
          <View
            style={[
              styles.fallbackCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <AppText style={styles.fallbackEmoji}>🛰️</AppText>
            <AppText
              variant="label"
              style={[styles.fallbackTitle, { color: colors.foreground }]}
            >
              {isOffline ? t("fieldMappingOfflineTitle") : t("fieldMappingLoadError")}
            </AppText>
            <AppText
              style={[styles.fallbackBody, { color: colors.mutedForeground }]}
            >
              {t("fieldMappingOfflineDesc")}
            </AppText>
            <View style={styles.fallbackAction}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setMapError(false);
                  if (!isOffline) {
                    // Retry state
                  }
                }}
                style={({ pressed }) => [
                  styles.retryButton,
                  { backgroundColor: colors.primaryDark },
                  pressed && styles.pressed,
                ]}
              >
                <AppText variant="label" style={styles.retryButtonText}>
                  {t("fieldMappingRetry")}
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      collapsable={false}
      edges={{ top: true }}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {/* Header bar */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Pressable
          accessibilityLabel={t("back")}
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <AppText style={[styles.backArrow, { color: colors.foreground }]}>
            {isRTL ? "›" : "‹"}
          </AppText>
        </Pressable>
        <View style={styles.headerTitles}>
          <AppText variant="title" style={[styles.headerTitle, { color: colors.foreground }]}>
            {t("fieldMappingTitle")}
          </AppText>
          <AppText style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            {t("fieldMappingSubtitle")}
          </AppText>
        </View>
      </View>

      {/* Floating Instructions Banner */}
      <View style={styles.instructionBannerWrapper}>
        <View
          style={[
            styles.instructionBanner,
            {
              backgroundColor: isComplete
                ? "rgba(18, 161, 80, 0.94)"
                : isDarkMode
                  ? "rgba(30, 30, 30, 0.94)"
                  : "rgba(255, 255, 255, 0.94)",
              borderColor: isComplete ? "#12A150" : colors.border,
            },
          ]}
        >
          <AppText
            variant="label"
            style={[
              styles.instructionText,
              { color: isComplete ? "#FFFFFF" : colors.foreground },
            ]}
          >
            {isComplete
              ? t("fieldMappingCompletePrompt")
              : t("fieldMappingTapPrompt", { current: pins.length + 1 })}
          </AppText>
        </View>
      </View>

      {/* Satellite Map */}
      <View style={styles.mapContainer}>
        <MapView
          initialRegion={initialRegion}
          mapType="satellite"
          onMapLoaded={() => setMapError(false)}
          onPress={handleMapPress}
          style={styles.map}
        >
          {/* Render Pin Markers */}
          {pins.map((pin, index) => (
            <Marker
              coordinate={pin}
              key={`pin-${index}-${pin.latitude}-${pin.longitude}`}
              title={`Point ${index + 1}`}
            >
              <View style={styles.markerContainer}>
                <View style={styles.markerBadge}>
                  <AppText style={styles.markerBadgeText}>{index + 1}</AppText>
                </View>
                <View style={styles.markerPoint} />
              </View>
            </Marker>
          ))}

          {/* Render 4-Pin Polygon */}
          {pins.length >= 3 ? (
            <Polygon
              coordinates={pins}
              fillColor="rgba(18, 161, 80, 0.32)"
              strokeColor="#12A150"
              strokeWidth={3}
            />
          ) : null}
        </MapView>
      </View>

      {/* Bottom Floating Control Bar */}
      <View
        style={[
          styles.bottomControls,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          disabled={pins.length === 0 || isSaving}
          onPress={handleClearPins}
          style={({ pressed }) => [
            styles.clearButton,
            {
              backgroundColor: colors.muted,
              borderColor: colors.border,
              opacity: pins.length === 0 ? 0.45 : pressed ? 0.7 : 1,
            },
          ]}
        >
          <AppText variant="label" style={[styles.clearButtonText, { color: colors.foreground }]}>
            {t("fieldMappingClearPins")}
          </AppText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={!isComplete || isSaving}
          onPress={() => void handleSaveBoundary()}
          style={({ pressed }) => [
            styles.saveButton,
            {
              backgroundColor: isComplete ? colors.primaryDark : colors.muted,
              borderColor: isComplete ? colors.primaryDark : colors.border,
              opacity: !isComplete ? 0.5 : pressed ? 0.88 : 1,
            },
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <AppText
              variant="label"
              style={[
                styles.saveButtonText,
                { color: isComplete ? "#FFFFFF" : colors.mutedForeground },
              ]}
            >
              {t("fieldMappingSaveBoundary")}
            </AppText>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  backArrow: {
    fontSize: 26,
    lineHeight: 28,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 26,
  },
  headerSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  instructionBannerWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    zIndex: 10,
  },
  instructionBanner: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    elevation: 3,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  instructionText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  mapContainer: {
    flex: 1,
    overflow: "hidden",
  },
  map: {
    height: "100%",
    width: "100%",
  },
  markerContainer: {
    alignItems: "center",
  },
  markerBadge: {
    alignItems: "center",
    backgroundColor: "#12A150",
    borderColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    elevation: 4,
    height: 24,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    width: 24,
  },
  markerBadgeText: {
    color: "#FFFFFF",
    fontFamily: Fonts.interSemiBold,
    fontSize: 11,
    lineHeight: 14,
  },
  markerPoint: {
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
    height: 4,
    marginTop: 1,
    width: 4,
  },
  bottomControls: {
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  clearButton: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 14,
  },
  clearButtonText: {
    fontSize: 14,
    lineHeight: 22,
  },
  saveButton: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1.5,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  saveButtonText: {
    fontSize: 15,
    lineHeight: 24,
  },
  fallbackContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  fallbackCard: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    width: "100%",
  },
  fallbackEmoji: {
    fontSize: 44,
    lineHeight: 56,
    marginBottom: 8,
  },
  fallbackTitle: {
    fontSize: 17,
    lineHeight: 26,
    marginBottom: 6,
    textAlign: "center",
  },
  fallbackBody: {
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 18,
    textAlign: "center",
  },
  fallbackAction: {
    width: "100%",
  },
  retryButton: {
    alignItems: "center",
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 20,
    width: "100%",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.7,
  },
});

export default FieldMappingScreen;
