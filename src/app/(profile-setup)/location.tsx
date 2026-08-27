import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AuthShell } from "@/components/auth/auth-shell";
import { DistrictPicker } from "@/components/location/district-picker";
import { LocationNotice } from "@/components/location/location-notice";
import { OnboardingButton } from "@/components/onboarding/onboarding-button";
import { AppText } from "@/components/ui/app-text";
import { SecondaryButton } from "@/components/ui/secondary-button";
import {
  getDefaultDistrict,
  getDistrict,
  getDistrictName,
  type District,
} from "@/constants/districts";
import { useFarmLocation } from "@/hooks/use-farm-location";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import { useProfile } from "@/providers/profile-provider";

/**
 * Last step of post-login onboarding. Saving here is what completes the
 * profile, so every path out of this screen ends with a location: the device
 * one, a district the farmer picks, or the default district if they skip.
 */
export default function LocationScreen() {
  const { colors } = useThemeManager();
  const { language, t } = useLanguage();
  const { profile } = useProfile();
  const {
    detect,
    isDetecting,
    isSaving,
    notice,
    saveDistrict,
    saveLocation,
  } = useFarmLocation();
  const savedDistrict = getDistrict(profile?.location?.districtId);
  const [selected, setSelected] = useState<District | null>(savedDistrict);
  const [isPicking, setIsPicking] = useState(savedDistrict !== null);
  const defaultDistrict = getDefaultDistrict();
  const isBusy = isDetecting || isSaving;

  const handleDetect = async () => {
    if (isBusy) {
      return;
    }

    const detected = await detect();

    if (!detected) {
      // The notice explains what happened; the list is the way forward.
      setIsPicking(true);
      return;
    }

    setSelected(detected.district);

    // On success the root layout guard replaces this group with the home
    // screen. If it fails the farmer stays here and can retry from the list.
    if (!(await saveLocation(detected.location))) {
      setIsPicking(true);
    }
  };

  const handleSaveSelected = async () => {
    if (!selected || isBusy) {
      return;
    }

    await saveDistrict(selected, "manual");
  };

  const handleSkip = async () => {
    if (isBusy) {
      return;
    }

    await saveDistrict(defaultDistrict, "default");
  };

  const handleBack = () => {
    if (isPicking && savedDistrict === null) {
      setIsPicking(false);
      return;
    }

    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <AuthShell
      onBack={handleBack}
      footer={
        <View style={styles.footer}>
          {isPicking ? (
            <OnboardingButton
              disabled={!selected || isBusy}
              label={isSaving ? t("locationSaving") : t("locationSave")}
              onPress={() => void handleSaveSelected()}
            />
          ) : (
            <>
              <OnboardingButton
                disabled={isBusy}
                label={isDetecting ? t("locationDetecting") : t("locationUseGps")}
                onPress={() => void handleDetect()}
              />
              <SecondaryButton
                disabled={isBusy}
                label={t("locationChooseDistrict")}
                onPress={() => setIsPicking(true)}
              />
            </>
          )}

          <Pressable
            accessibilityRole="button"
            disabled={isBusy}
            onPress={() => void handleSkip()}
            style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
          >
            <AppText
              variant="label"
              style={[styles.skipLabel, { color: colors.mutedForeground }]}
            >
              {t("locationSkip")}
            </AppText>
            <AppText style={[styles.skipNotice, { color: colors.mutedForeground }]}>
              {t("locationSkipNotice", {
                district: getDistrictName(defaultDistrict, language),
              })}
            </AppText>
          </Pressable>
        </View>
      }
    >
      <AppText variant="title" style={[styles.title, { color: colors.foreground }]}>
        {t("locationTitle")}
      </AppText>
      <AppText style={[styles.description, { color: colors.mutedForeground }]}>
        {t("locationDescription")}
      </AppText>

      {notice ? <LocationNotice notice={notice} /> : null}

      {isPicking ? (
        <>
          <View style={styles.retry}>
            <SecondaryButton
              disabled={isBusy}
              icon="📍"
              label={isDetecting ? t("locationDetecting") : t("locationUseGps")}
              onPress={() => void handleDetect()}
            />
          </View>

          {selected ? (
            <View
              style={[
                styles.selectedChip,
                { backgroundColor: colors.accent, borderColor: colors.primaryDark },
              ]}
            >
              <AppText
                variant="label"
                style={[styles.selectedText, { color: colors.accentForeground }]}
              >
                {t("locationSelected", {
                  district: getDistrictName(selected, language),
                })}
              </AppText>
            </View>
          ) : null}

          <View style={styles.picker}>
            <DistrictPicker
              onSelect={setSelected}
              selectedId={selected?.id ?? null}
            />
          </View>
        </>
      ) : (
        <View
          style={[
            styles.hero,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <AppText style={styles.heroEmoji}>🗺️</AppText>
          <AppText style={[styles.heroText, { color: colors.mutedForeground }]}>
            {t("locationBenefit")}
          </AppText>
        </View>
      )}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    lineHeight: 46,
  },
  description: {
    fontSize: 15,
    lineHeight: 27,
    marginTop: 4,
  },
  hero: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 28,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  heroEmoji: {
    fontSize: 56,
    lineHeight: 68,
  },
  heroText: {
    fontSize: 15,
    lineHeight: 27,
    marginTop: 8,
    textAlign: "center",
  },
  retry: {
    marginTop: 22,
  },
  selectedChip: {
    alignSelf: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  selectedText: {
    fontSize: 14,
    lineHeight: 24,
  },
  picker: {
    marginTop: 16,
  },
  footer: {
    gap: 10,
  },
  skip: {
    paddingTop: 4,
  },
  skipLabel: {
    fontSize: 15,
    lineHeight: 26,
    textAlign: "center",
  },
  skipNotice: {
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
