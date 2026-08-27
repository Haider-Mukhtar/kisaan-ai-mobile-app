import { router } from "expo-router";

import { OnboardingButton } from "@/components/onboarding/onboarding-button";
import { ProfileSetupShell } from "@/components/profile-setup/profile-setup-shell";
import { AppTextInput } from "@/components/ui/app-text-input";
import { useLanguage } from "@/providers/language-provider";
import { useProfileSetup } from "@/providers/profile-setup-provider";

export default function CityScreen() {
  const { t } = useLanguage();
  const { draft, setField } = useProfileSetup();
  const isValid = draft.city.trim().length >= 2;

  const continueSetup = () => {
    if (isValid) {
      router.push("/(profile-setup)/farm-size");
    }
  };

  return (
    <ProfileSetupShell
      description={t("profileCityDescription")}
      footer={
        <OnboardingButton
          disabled={!isValid}
          label={t("continue")}
          onPress={continueSetup}
        />
      }
      icon="🏙️"
      onBack={() => router.back()}
      step={3}
      title={t("profileCityTitle")}
    >
      <AppTextInput
        autoCapitalize="words"
        autoFocus
        hint={t("profileCityHint")}
        label={t("profileCityLabel")}
        maxLength={100}
        onChangeText={(value) => setField("city", value)}
        onSubmitEditing={continueSetup}
        placeholder={t("profileCityPlaceholder")}
        returnKeyType="next"
        value={draft.city}
      />
    </ProfileSetupShell>
  );
}
