import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { OnboardingButton } from "@/components/onboarding/onboarding-button";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Fonts } from "@/constants/theme";
import useThemeManager from "@/hooks/use-theme-manager";
import { androidNastaliqHeadingStyle } from "@/utils/typography";

type Artwork = "companion" | "diagnosis" | "decisions";

const artworkSources = {
  companion: require("../../../assets/images/onboarding-farming-companion.png"),
  decisions: require("../../../assets/images/onboarding-farm-decisions.png"),
  diagnosis: require("../../../assets/images/onboarding-crop-diagnosis.png"),
} as const;

const artworkDescriptions: Record<Artwork, string> = {
  companion: "A farmer using Kisaan AI in a healthy field",
  decisions: "A farmer reviewing irrigation, weather, and market insights",
  diagnosis: "A farmer scanning a spotted crop leaf with a phone",
};

type InfoOnboardingScreenProps = {
  step: 1 | 2 | 3;
  artwork: Artwork;
  englishTitle: string;
  englishBody: string;
  urduTitle: string;
  urduBody: string;
  nextRoute: Href;
};

function HeroArtwork({ artwork }: { artwork: Artwork }) {
  const { colors } = useThemeManager();

  return (
    <View style={[styles.artworkCard, { backgroundColor: colors.accent }]}>
      <Image
        alt={artworkDescriptions[artwork]}
        contentFit="cover"
        source={artworkSources[artwork]}
        style={styles.artworkImage}
        transition={200}
      />
    </View>
  );
}

export function InfoOnboardingScreen({
  step,
  artwork,
  englishTitle,
  englishBody,
  urduTitle,
  urduBody,
  nextRoute,
}: InfoOnboardingScreenProps) {
  const router = useRouter();
  const { colors } = useThemeManager();
  const isLastInfoScreen = step === 3;

  return (
    <OnboardingShell
      contentStyle={styles.content}
      footer={
        <OnboardingButton
          englishLabel={isLastInfoScreen ? "Set up your app" : "Next"}
          onPress={() => router.push(nextRoute)}
          urduLabel={isLastInfoScreen ? "ایپ کی ترتیب کریں" : "اگلا"}
        />
      }
      onBack={step > 1 ? () => router.back() : undefined}
      step={step}
    >
      <HeroArtwork artwork={artwork} />

      <View style={styles.copyBlock}>
        <Text style={[styles.englishTitle, { color: colors.foreground }]}>
          {englishTitle}
        </Text>
        <Text style={[styles.englishBody, { color: colors.mutedForeground }]}>
          {englishBody}
        </Text>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.urduTitle, { color: colors.foreground }]}>
          {urduTitle}
        </Text>
        <Text style={[styles.urduBody, { color: colors.mutedForeground }]}>
          {urduBody}
        </Text>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "center",
  },
  artworkCard: {
    borderRadius: 28,
    height: 210,
    marginBottom: 24,
    overflow: "hidden",
  },
  artworkImage: {
    height: "100%",
    width: "100%",
  },
  copyBlock: {
    alignItems: "stretch",
  },
  englishTitle: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 28,
    lineHeight: 35,
    textAlign: "left",
  },
  englishBody: {
    fontFamily: Fonts.interRegular,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 7,
    textAlign: "left",
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  urduTitle: {
    fontFamily: Fonts.notoNastaliqUrdu,
    fontSize: 22,
    lineHeight: 44,
    textAlign: "right",
    writingDirection: "rtl",
    ...androidNastaliqHeadingStyle(22, 44),
  },
  urduBody: {
    fontFamily: Fonts.notoNaskhArabic,
    fontSize: 17,
    lineHeight: 30,
    marginTop: 2,
    textAlign: "right",
    writingDirection: "rtl",
  },
});
