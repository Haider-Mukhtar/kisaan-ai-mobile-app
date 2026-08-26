import { InfoOnboardingScreen } from "@/components/onboarding/info-onboarding-screen";

export default function FarmDecisionsOnboardingScreen() {
  return (
    <InfoOnboardingScreen
      artwork="decisions"
      englishBody="Get irrigation guidance, understand mandi price trends, and hear useful advice in your preferred language."
      englishTitle="Make Better Farm Decisions"
      nextRoute="/(onboarding)/language"
      step={3}
      urduBody="آبپاشی کی رہنمائی، منڈی کی قیمتوں کے رجحانات اور اپنی پسندیدہ زبان میں مفید مشورے حاصل کریں۔"
      urduTitle="بہتر زرعی فیصلے کریں"
    />
  );
}
