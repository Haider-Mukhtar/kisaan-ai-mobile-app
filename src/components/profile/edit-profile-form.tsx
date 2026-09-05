import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { OnboardingButton } from "@/components/onboarding/onboarding-button";
import { CropSelector } from "@/components/profile/crop-selector";
import { AppText } from "@/components/ui/app-text";
import { AppTextInput } from "@/components/ui/app-text-input";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import { parseFarmSize } from "@/providers/profile-setup-provider";
import { useProfile } from "@/providers/profile-provider";

type EditDraft = {
  fullName: string;
  village: string;
  city: string;
  farmSize: string;
  crops: string[];
};

export function EditProfileForm() {
  const { colors } = useThemeManager();
  const { t } = useLanguage();
  const { isSaving, profile, saveProfile } = useProfile();
  const [draft, setDraft] = useState<EditDraft>(() => ({
    fullName: profile?.fullName ?? "",
    village: profile?.village ?? "",
    city: profile?.city ?? "",
    farmSize: profile?.farmSizeAcres ? String(profile.farmSizeAcres) : "",
    crops: profile?.crops ?? [],
  }));

  const parsedFarmSize = parseFarmSize(draft.farmSize);
  const isValid =
    draft.fullName.trim().length >= 2 &&
    draft.village.trim().length >= 2 &&
    draft.city.trim().length >= 2 &&
    parsedFarmSize !== null &&
    draft.crops.length > 0;

  const setField = <Key extends keyof EditDraft>(
    key: Key,
    value: EditDraft[Key],
  ) => setDraft((current) => ({ ...current, [key]: value }));

  const toggleCrop = (cropId: string) => {
    setDraft((current) => ({
      ...current,
      crops: current.crops.includes(cropId)
        ? current.crops.filter((item) => item !== cropId)
        : [...current.crops, cropId],
    }));
  };

  const save = async () => {
    if (!isValid || isSaving || parsedFarmSize === null) return;

    const saved = await saveProfile({
      fullName: draft.fullName,
      village: draft.village,
      city: draft.city,
      farmSizeAcres: parsedFarmSize,
      crops: draft.crops,
    });

    if (saved) router.back();
  };

  return (
    <KeyboardAwareScrollView
      bottomOffset={20}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.intro,
          { backgroundColor: colors.accent, borderColor: colors.border },
        ]}
      >
        <AppText style={styles.introIcon}>✏️</AppText>
        <View style={styles.introCopy}>
          <AppText
            variant="label"
            style={[styles.introTitle, { color: colors.foreground }]}
          >
            {t("editProfileIntroTitle")}
          </AppText>
          <AppText
            style={[styles.introBody, { color: colors.mutedForeground }]}
          >
            {t("editProfileIntroDescription")}
          </AppText>
        </View>
      </View>

      <View style={styles.fields}>
        <AppTextInput
          autoCapitalize="words"
          autoComplete="name"
          label={t("farmProfileNameLabel")}
          maxLength={80}
          onChangeText={(value) => setField("fullName", value)}
          placeholder={t("farmProfileNamePlaceholder")}
          returnKeyType="next"
          value={draft.fullName}
        />
        <AppTextInput
          autoCapitalize="words"
          label={t("farmProfileVillageLabel")}
          maxLength={100}
          onChangeText={(value) => setField("village", value)}
          placeholder={t("farmProfileVillagePlaceholder")}
          returnKeyType="next"
          value={draft.village}
        />
        <AppTextInput
          autoCapitalize="words"
          label={t("profileCityLabel")}
          maxLength={100}
          onChangeText={(value) => setField("city", value)}
          placeholder={t("profileCityPlaceholder")}
          returnKeyType="next"
          value={draft.city}
        />
        <AppTextInput
          forceLTR
          hint={t("farmProfileFarmSizeHint")}
          keyboardType="decimal-pad"
          label={t("farmProfileFarmSizeLabel")}
          maxLength={7}
          onChangeText={(value) => setField("farmSize", value)}
          placeholder="5"
          value={draft.farmSize}
        />
      </View>

      <View style={styles.crops}>
        <AppText
          variant="label"
          style={[styles.sectionTitle, { color: colors.foreground }]}
        >
          {t("farmProfileCropsLabel")}
        </AppText>
        <AppText
          style={[styles.sectionHint, { color: colors.mutedForeground }]}
        >
          {t("editProfileCropsHint")}
        </AppText>
        <CropSelector selected={draft.crops} onToggle={toggleCrop} />
      </View>

      {!isValid ? (
        <AppText
          style={[styles.validation, { color: colors.warning }]}
        >
          {t("editProfileRequiredHint")}
        </AppText>
      ) : null}

      <OnboardingButton
        disabled={!isValid || isSaving}
        label={isSaving ? t("farmProfileSaving") : t("editProfileSave")}
        onPress={() => void save()}
      />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 24, padding: 20, paddingBottom: 40 },
  intro: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    padding: 16,
  },
  introIcon: { fontSize: 28, lineHeight: 38 },
  introCopy: { flex: 1, marginStart: 14 },
  introTitle: { fontSize: 16, lineHeight: 27 },
  introBody: { fontSize: 13, lineHeight: 23, marginTop: 2 },
  fields: { gap: 18 },
  crops: { gap: 9 },
  sectionTitle: { fontSize: 16, lineHeight: 27 },
  sectionHint: { fontSize: 13, lineHeight: 23, marginTop: -5 },
  validation: { fontSize: 13, lineHeight: 23 },
});
