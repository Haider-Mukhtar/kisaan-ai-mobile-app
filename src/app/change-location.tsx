import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AuthShell } from "@/components/auth/auth-shell";
import { DistrictPicker } from "@/components/location/district-picker";
import { LocationNotice } from "@/components/location/location-notice";
import { OnboardingButton } from "@/components/onboarding/onboarding-button";
import { AppText } from "@/components/ui/app-text";
import { SecondaryButton } from "@/components/ui/secondary-button";
import {
  getDistrict,
  getDistrictName,
  type District,
} from "@/constants/districts";
import { useFarmLocation } from "@/hooks/use-farm-location";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import { useProfile } from "@/providers/profile-provider";

/**
 * Reached from the weather card. Same two ways in as onboarding — device
 * location or the district list — for a farmer whose forecast looks wrong.
 */
export default function ChangeLocationScreen() {
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
  const current = getDistrict(profile?.location?.districtId);
  const [selected, setSelected] = useState<District | null>(current);
  const isBusy = isDetecting || isSaving;

  const close = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  };

  const handleDetect = async () => {
    if (isBusy) {
      return;
    }

    const detected = await detect();

    if (!detected) {
      return;
    }

    setSelected(detected.district);

    if (await saveLocation(detected.location)) {
      close();
    }
  };

  const handleSave = async () => {
    if (!selected || isBusy) {
      return;
    }

    if (await saveDistrict(selected, "manual")) {
      close();
    }
  };

  return (
    <AuthShell
      onBack={close}
      footer={
        <OnboardingButton
          disabled={!selected || isBusy}
          label={isSaving ? t("locationSaving") : t("locationSave")}
          onPress={() => void handleSave()}
        />
      }
    >
      <AppText variant="title" style={[styles.title, { color: colors.foreground }]}>
        {t("locationChangeTitle")}
      </AppText>
      <AppText style={[styles.description, { color: colors.mutedForeground }]}>
        {t("locationChangeDescription")}
      </AppText>

      {current ? (
        <View
          style={[
            styles.currentChip,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <AppText style={[styles.currentText, { color: colors.mutedForeground }]}>
            {t("locationCurrent", {
              district: getDistrictName(current, language),
            })}
          </AppText>
        </View>
      ) : null}

      {notice ? <LocationNotice notice={notice} /> : null}

      <View style={styles.detect}>
        <SecondaryButton
          disabled={isBusy}
          icon="📍"
          label={isDetecting ? t("locationDetecting") : t("locationUseGps")}
          onPress={() => void handleDetect()}
        />
      </View>

      <DistrictPicker onSelect={setSelected} selectedId={selected?.id ?? null} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    lineHeight: 44,
  },
  description: {
    fontSize: 15,
    lineHeight: 27,
    marginTop: 4,
  },
  currentChip: {
    alignSelf: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  currentText: {
    fontSize: 13,
    lineHeight: 22,
  },
  detect: {
    marginTop: 20,
    marginBottom: 8,
  },
});
