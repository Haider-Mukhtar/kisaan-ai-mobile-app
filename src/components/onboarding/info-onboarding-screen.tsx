import { useRouter, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { OnboardingButton } from "@/components/onboarding/onboarding-button";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Fonts } from "@/constants/theme";
import useThemeManager from "@/hooks/use-theme-manager";

type Artwork = "companion" | "diagnosis" | "decisions";

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

  if (artwork === "diagnosis") {
    return (
      <View style={[styles.artworkCard, { backgroundColor: colors.accent }]}>
        <View style={[styles.scanFrame, { borderColor: colors.primaryDark }]}>
          <Text style={styles.heroEmoji}>🍃</Text>
          <View style={[styles.scanLine, { backgroundColor: colors.primary }]} />
        </View>
        <View style={[styles.resultPill, { backgroundColor: colors.card }]}>
          <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
          <Text style={[styles.resultText, { color: colors.foreground }]}>AI crop check</Text>
        </View>
      </View>
    );
  }

  if (artwork === "decisions") {
    return (
      <View
        style={[
          styles.artworkCard,
          styles.decisionArtwork,
          { backgroundColor: colors.accent },
        ]}
      >
        <InsightCard
          color={colors.foreground}
          emoji="💧"
          mutedColor={colors.mutedForeground}
        />
        <InsightCard
          color={colors.primaryDark}
          emoji="📈"
          mutedColor={colors.mutedForeground}
          offset
        />
      </View>
    );
  }

  return (
    <View style={[styles.artworkCard, { backgroundColor: colors.accent }]}>
      <View style={[styles.sun, { backgroundColor: colors.primary }]} />
      <View style={[styles.heroCircle, { backgroundColor: colors.card }]}>
        <Text style={styles.heroEmoji}>🌱</Text>
      </View>
      <View style={[styles.ground, { backgroundColor: colors.primaryDark }]} />
    </View>
  );
}

function InsightCard({
  emoji,
  color,
  mutedColor,
  offset = false,
}: {
  emoji: string;
  color: string;
  mutedColor: string;
  offset?: boolean;
}) {
  const { colors } = useThemeManager();

  return (
    <View
      style={[
        styles.insightCard,
        offset && styles.insightCardOffset,
        { backgroundColor: colors.card },
      ]}
    >
      <Text style={styles.insightEmoji}>{emoji}</Text>
      <View style={styles.insightCopy}>
        <View style={[styles.insightLineLong, { backgroundColor: color }]} />
        <View
          style={[styles.insightLineShort, { backgroundColor: mutedColor }]}
        />
      </View>
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
    alignItems: "center",
    borderRadius: 28,
    height: 210,
    justifyContent: "center",
    marginBottom: 24,
    overflow: "hidden",
    position: "relative",
  },
  sun: {
    borderRadius: 50,
    height: 78,
    opacity: 0.5,
    position: "absolute",
    right: 30,
    top: 25,
    width: 78,
  },
  heroCircle: {
    alignItems: "center",
    borderRadius: 68,
    height: 136,
    justifyContent: "center",
    width: 136,
  },
  heroEmoji: {
    fontSize: 72,
    lineHeight: 92,
  },
  ground: {
    bottom: -30,
    height: 68,
    left: -10,
    opacity: 0.8,
    position: "absolute",
    right: -10,
    transform: [{ rotate: "-3deg" }],
  },
  scanFrame: {
    alignItems: "center",
    borderRadius: 26,
    borderWidth: 3,
    height: 150,
    justifyContent: "center",
    width: 150,
  },
  scanLine: {
    height: 3,
    left: 15,
    opacity: 0.85,
    position: "absolute",
    right: 15,
    top: 73,
  },
  resultPill: {
    alignItems: "center",
    borderRadius: 18,
    bottom: 16,
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 8,
    position: "absolute",
    right: 16,
  },
  statusDot: {
    borderRadius: 5,
    height: 10,
    marginRight: 8,
    width: 10,
  },
  resultText: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 12,
  },
  decisionArtwork: {
    gap: 12,
    paddingHorizontal: 30,
  },
  insightCard: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 20,
    flexDirection: "row",
    padding: 16,
    width: "86%",
  },
  insightCardOffset: {
    alignSelf: "flex-end",
  },
  insightEmoji: {
    fontSize: 34,
    lineHeight: 44,
  },
  insightCopy: {
    flex: 1,
    gap: 9,
    marginLeft: 14,
  },
  insightLineLong: {
    borderRadius: 3,
    height: 7,
    opacity: 0.8,
    width: "88%",
  },
  insightLineShort: {
    borderRadius: 3,
    height: 6,
    opacity: 0.35,
    width: "60%",
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
