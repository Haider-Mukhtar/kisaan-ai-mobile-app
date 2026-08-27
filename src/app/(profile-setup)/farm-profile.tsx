import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AuthShell } from "@/components/auth/auth-shell";
import { OnboardingButton } from "@/components/onboarding/onboarding-button";
import { AppText } from "@/components/ui/app-text";
import { AppTextInput } from "@/components/ui/app-text-input";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage, type TranslationKey } from "@/providers/language-provider";
import { useProfile } from "@/providers/profile-provider";
import { formatPakistaniMobile } from "@/utils/phone";

const CROP_OPTIONS: { id: string; labelKey: TranslationKey }[] = [
  { id: "tomato", labelKey: "cropTomato" },
  { id: "potato", labelKey: "cropPotato" },
  { id: "wheat", labelKey: "cropWheat" },
];

function parseFarmSize(value: string): number | null {
  const parsed = Number.parseFloat(value.replace(",", "."));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default function FarmProfileScreen() {
  const { colors } = useThemeManager();
  const { t } = useLanguage();
  const { isSaving, profile, saveProfile } = useProfile();
  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [village, setVillage] = useState(profile?.village ?? "");
  const [farmSize, setFarmSize] = useState(
    profile?.farmSizeAcres ? String(profile.farmSizeAcres) : "",
  );
  const [crops, setCrops] = useState<string[]>(profile?.crops ?? []);

  const hasName = fullName.trim().length > 1;
  const hasCrops = crops.length > 0;
  const canSubmit = hasName && hasCrops && !isSaving;

  const toggleCrop = (cropId: string) => {
    setCrops((current) =>
      current.includes(cropId)
        ? current.filter((item) => item !== cropId)
        : [...current, cropId],
    );
  };

  const handleSave = async () => {
    if (!canSubmit) {
      return;
    }

    // On success the root layout guard swaps this group for the home screen.
    await saveProfile({
      fullName,
      village,
      farmSizeAcres: parseFarmSize(farmSize),
      crops,
    });
  };

  return (
    <AuthShell
      footer={
        <OnboardingButton
          disabled={!canSubmit}
          label={isSaving ? t("farmProfileSaving") : t("farmProfileSave")}
          onPress={() => void handleSave()}
        />
      }
    >
      <AppText
        variant="title"
        style={[styles.title, { color: colors.foreground }]}
      >
        {t("farmProfileTitle")}
      </AppText>
      <AppText style={[styles.description, { color: colors.mutedForeground }]}>
        {t("farmProfileDescription")}
      </AppText>

      {profile?.phone ? (
        <View
          style={[
            styles.phoneChip,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <AppText style={[styles.phoneText, { color: colors.mutedForeground }]}>
            {t("farmProfilePhone", {
              phone: formatPakistaniMobile(profile.phone),
            })}
          </AppText>
        </View>
      ) : null}

      <View style={styles.field}>
        <AppTextInput
          autoComplete="name"
          label={t("farmProfileNameLabel")}
          onChangeText={setFullName}
          placeholder={t("farmProfileNamePlaceholder")}
          value={fullName}
        />
      </View>

      <View style={styles.field}>
        <AppTextInput
          label={t("farmProfileVillageLabel")}
          onChangeText={setVillage}
          placeholder={t("farmProfileVillagePlaceholder")}
          value={village}
        />
      </View>

      <View style={styles.field}>
        <AppTextInput
          forceLTR
          hint={t("farmProfileFarmSizeHint")}
          keyboardType="decimal-pad"
          label={t("farmProfileFarmSizeLabel")}
          onChangeText={setFarmSize}
          placeholder="5"
          value={farmSize}
        />
      </View>

      <View style={styles.field}>
        <AppText
          variant="label"
          style={[styles.cropsLabel, { color: colors.foreground }]}
        >
          {t("farmProfileCropsLabel")}
        </AppText>
        <View style={styles.crops}>
          {CROP_OPTIONS.map((crop) => {
            const isSelected = crops.includes(crop.id);

            return (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                key={crop.id}
                onPress={() => toggleCrop(crop.id)}
                style={({ pressed }) => [
                  styles.cropChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.input,
                    borderColor: isSelected ? colors.primaryDark : colors.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <AppText
                  variant="label"
                  style={[
                    styles.cropChipText,
                    {
                      color: isSelected
                        ? colors.primaryForeground
                        : colors.foreground,
                    },
                  ]}
                >
                  {t(crop.labelKey)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
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
  phoneChip: {
    alignSelf: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  phoneText: {
    fontSize: 13,
    lineHeight: 22,
  },
  field: {
    marginTop: 22,
  },
  cropsLabel: {
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 10,
  },
  crops: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  cropChip: {
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  cropChipText: {
    fontSize: 14,
    lineHeight: 24,
  },
  pressed: {
    opacity: 0.84,
  },
});
