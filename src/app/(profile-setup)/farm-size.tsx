import { router } from "expo-router";

import { OnboardingButton } from "@/components/onboarding/onboarding-button";
import { ProfileSetupShell } from "@/components/profile-setup/profile-setup-shell";
import { AppTextInput } from "@/components/ui/app-text-input";
import { useLanguage } from "@/providers/language-provider";
import {
  parseFarmSize,
  useProfileSetup,
} from "@/providers/profile-setup-provider";

export default function FarmSizeScreen() {
  const { t } = useLanguage();
  const { draft, setField } = useProfileSetup();
  const isValid = parseFarmSize(draft.farmSize) !== null;

  const continueSetup = () => {
    if (isValid) {
      router.push("/(profile-setup)/field-type");
    }
  };

  return (
    <ProfileSetupShell
      description={t("profileFarmSizeDescription")}
      footer={
        <OnboardingButton
          disabled={!isValid}
          label={t("continue")}
          onPress={continueSetup}
        />
      }
      icon="📐"
      onBack={() => router.back()}
      step={4}
      title={t("profileFarmSizeTitle")}
    >
      <AppTextInput
        autoFocus
        forceLTR
        hint={t("farmProfileFarmSizeHint")}
        keyboardType="decimal-pad"
        label={t("farmProfileFarmSizeLabel")}
        maxLength={7}
        onChangeText={(value) => setField("farmSize", value)}
        onSubmitEditing={continueSetup}
        placeholder="5"
        returnKeyType="next"
        value={draft.farmSize}
      />
    </ProfileSetupShell>
  );
}
