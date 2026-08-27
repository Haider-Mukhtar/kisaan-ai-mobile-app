import { router } from "expo-router";

import { OnboardingButton } from "@/components/onboarding/onboarding-button";
import { ProfileSetupShell } from "@/components/profile-setup/profile-setup-shell";
import { AppTextInput } from "@/components/ui/app-text-input";
import { useLanguage } from "@/providers/language-provider";
import { useProfileSetup } from "@/providers/profile-setup-provider";

export default function NameScreen() {
  const { t } = useLanguage();
  const { draft, setField } = useProfileSetup();
  const isValid = draft.fullName.trim().length >= 2;

  const continueSetup = () => {
    if (isValid) {
      router.push("/(profile-setup)/village");
    }
  };

  return (
    <ProfileSetupShell
      description={t("profileNameDescription")}
      footer={
        <OnboardingButton
          disabled={!isValid}
          label={t("continue")}
          onPress={continueSetup}
        />
      }
      icon="👋"
      step={1}
      title={t("profileNameTitle")}
    >
      <AppTextInput
        autoCapitalize="words"
        autoComplete="name"
        autoFocus
        hint={t("profileNameHint")}
        label={t("farmProfileNameLabel")}
        maxLength={80}
        onChangeText={(value) => setField("fullName", value)}
        onSubmitEditing={continueSetup}
        placeholder={t("farmProfileNamePlaceholder")}
        returnKeyType="next"
        value={draft.fullName}
      />
    </ProfileSetupShell>
  );
}
