import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { OnboardingButton } from "@/components/onboarding/onboarding-button";
import { ProfileSetupShell } from "@/components/profile-setup/profile-setup-shell";
import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage, type TranslationKey } from "@/providers/language-provider";
import { useProfileSetup } from "@/providers/profile-setup-provider";

const FIELD_TYPES: {
  id: string;
  icon: string;
  labelKey: TranslationKey;
}[] = [
  { id: "tomato", icon: "🍅", labelKey: "cropTomato" },
  { id: "potato", icon: "🥔", labelKey: "cropPotato" },
  { id: "wheat", icon: "🌾", labelKey: "cropWheat" },
];

export default function FieldTypeScreen() {
  const { colors } = useThemeManager();
  const { t } = useLanguage();
  const { draft, isSaving, saveDetails, toggleCrop } = useProfileSetup();
  const isValid = draft.crops.length > 0;

  const continueSetup = async () => {
    if (!isValid || isSaving) {
      return;
    }

    if (await saveDetails()) {
      router.push("/(profile-setup)/location");
    }
  };

  return (
    <ProfileSetupShell
      description={t("profileFieldTypeDescription")}
      footer={
        <OnboardingButton
          disabled={!isValid || isSaving}
          label={isSaving ? t("farmProfileSaving") : t("continue")}
          onPress={() => void continueSetup()}
        />
      }
      icon="🌱"
      onBack={() => router.back()}
      step={5}
      title={t("profileFieldTypeTitle")}
    >
      <View style={styles.options}>
        {FIELD_TYPES.map((fieldType) => {
          const isSelected = draft.crops.includes(fieldType.id);

          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              key={fieldType.id}
              onPress={() => toggleCrop(fieldType.id)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: isSelected ? colors.accent : colors.card,
                  borderColor: isSelected ? colors.primaryDark : colors.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <AppText style={styles.optionIcon}>{fieldType.icon}</AppText>
              <AppText
                variant="label"
                style={[styles.optionLabel, { color: colors.foreground }]}
              >
                {t(fieldType.labelKey)}
              </AppText>
              <View
                style={[
                  styles.check,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : "transparent",
                    borderColor: isSelected
                      ? colors.primaryDark
                      : colors.border,
                  },
                ]}
              >
                {isSelected ? (
                  <AppText
                    style={[styles.checkMark, { color: colors.primaryForeground }]}
                  >
                    ✓
                  </AppText>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </ProfileSetupShell>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: 10,
  },
  option: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 68,
    paddingHorizontal: 16,
  },
  optionIcon: {
    fontSize: 28,
    lineHeight: 38,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    lineHeight: 28,
    marginHorizontal: 14,
  },
  check: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  checkMark: {
    fontSize: 13,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.82,
  },
});
