import { InfoOnboardingScreen } from "@/components/onboarding/info-onboarding-screen";

export default function WelcomeOnboardingScreen() {
  return (
    <InfoOnboardingScreen
      artwork="companion"
      englishBody="Kisaan AI brings helpful farming guidance to your phone—simple, practical, and easy to understand."
      englishTitle="Your Farming Companion"
      nextRoute="/(onboarding)/crop-health"
      step={1}
      urduBody="کسان اے آئی آپ کے فون پر آسان، عملی اور قابلِ فہم زرعی رہنمائی فراہم کرتا ہے۔"
      urduTitle="آپ کا زرعی ساتھی"
    />
  );
}
