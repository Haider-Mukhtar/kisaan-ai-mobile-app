import { router } from "expo-router";

import { OnboardingButton } from "@/components/onboarding/onboarding-button";
import { ProfileSetupShell } from "@/components/profile-setup/profile-setup-shell";
import { AppTextInput } from "@/components/ui/app-text-input";
import { useLanguage } from "@/providers/language-provider";
import { useProfileSetup } from "@/providers/profile-setup-provider";

export default function VillageScreen() {
  const { t } = useLanguage();
  const { draft, setField } = useProfileSetup();
  const isValid = draft.village.trim().length >= 2;

  const continueSetup = () => {
    if (isValid) {
      router.push("/(profile-setup)/city");
    }
  };

  return (
    <ProfileSetupShell
      description={t("profileVillageDescription")}
      footer={
        <OnboardingButton
          disabled={!isValid}
          label={t("continue")}
          onPress={continueSetup}
        />
      }
      icon="🏡"
      onBack={() => router.back()}
      step={2}
      title={t("profileVillageTitle")}
    >
      <AppTextInput
        autoCapitalize="words"
        autoFocus
        hint={t("profileVillageHint")}
        label={t("farmProfileVillageLabel")}
        maxLength={100}
        onChangeText={(value) => setField("village", value)}
        onSubmitEditing={continueSetup}
        placeholder={t("farmProfileVillagePlaceholder")}
        returnKeyType="next"
        value={draft.village}
      />
    </ProfileSetupShell>
  );
}
