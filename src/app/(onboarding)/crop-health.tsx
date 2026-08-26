import { InfoOnboardingScreen } from "@/components/onboarding/info-onboarding-screen";

export default function CropHealthOnboardingScreen() {
  return (
    <InfoOnboardingScreen
      artwork="diagnosis"
      englishBody="Take a photo of an affected plant to identify possible diseases and receive treatment and prevention guidance."
      englishTitle="Identify Crop Problems"
      nextRoute="/(onboarding)/farm-decisions"
      step={2}
      urduBody="متاثرہ پودے کی تصویر لیں، ممکنہ بیماری کی شناخت کریں اور علاج و بچاؤ کی رہنمائی حاصل کریں۔"
      urduTitle="فصل کے مسائل کی شناخت کریں"
    />
  );
}
