import { router } from "expo-router";

import { OnboardingButton } from "@/components/onboarding/onboarding-button";
import { CropSelector } from "@/components/profile/crop-selector";
import { ProfileSetupShell } from "@/components/profile-setup/profile-setup-shell";
import { useLanguage } from "@/providers/language-provider";
import { useProfileSetup } from "@/providers/profile-setup-provider";

export default function FieldTypeScreen() {
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
      <CropSelector selected={draft.crops} onToggle={toggleCrop} />
    </ProfileSetupShell>
  );
}
