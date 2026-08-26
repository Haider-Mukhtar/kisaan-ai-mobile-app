import { useRouter, type Href } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
        <View style={[styles.insightCard, { backgroundColor: colors.card }]}>
          <Text style={styles.insightEmoji}>💧</Text>
          <View style={styles.insightCopy}>
            <View
              style={[
                styles.insightLineLong,
                { backgroundColor: colors.foreground },
              ]}
            />
            <View
              style={[
                styles.insightLineShort,
                { backgroundColor: colors.mutedForeground },
              ]}
            />
          </View>
        </View>
        <View
          style={[
            styles.insightCard,
            styles.insightCardOffset,
            { backgroundColor: colors.card },
          ]}
        >
          <Text style={styles.insightEmoji}>📈</Text>
          <View style={styles.insightCopy}>
            <View
              style={[
                styles.insightLineLong,
                { backgroundColor: colors.primaryDark },
              ]}
            />
            <View
              style={[
                styles.insightLineShort,
                { backgroundColor: colors.mutedForeground },
              ]}
            />
          </View>
        </View>
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
    <SafeAreaView
      edges={["top", "bottom"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View
        pointerEvents="none"
        style={[styles.glow, { backgroundColor: colors.primary }]}
      />

      <View style={styles.header}>
        {step > 1 ? (
          <Pressable
            accessibilityLabel="Back"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => router.back()}
            style={[styles.headerButton, { backgroundColor: colors.muted }]}
          >
            <Text style={[styles.backIcon, { color: colors.foreground }]}>
              ‹
            </Text>
          </Pressable>
        ) : (
          <View style={styles.headerButton} />
        )}

        <View style={styles.brandLockup}>
          <Text style={[styles.brandEnglish, { color: colors.foreground }]}>
            Kisaan AI
          </Text>
          <Text style={[styles.brandUrdu, { color: colors.mutedForeground }]}>
            کسان اے آئی
          </Text>
        </View>

        <Pressable
          accessibilityLabel="Skip introduction"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.replace("/(onboarding)/language")}
        >
          <Text style={[styles.skipText, { color: colors.primaryDark }]}>Skip</Text>
          <Text style={[styles.skipUrdu, { color: colors.primaryDark }]}>چھوڑیں</Text>
        </Pressable>
      </View>

      <View style={styles.progressRow}>
        {[1, 2, 3, 4, 5].map((item) => (
          <View
            key={item}
            style={[
              styles.progressTrack,
              { backgroundColor: item <= step ? colors.primary : colors.muted },
            ]}
          />
        ))}
      </View>

      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HeroArtwork artwork={artwork} />

        <View style={styles.copyBlock}>
          <Text style={[styles.englishTitle, { color: colors.foreground }]}>
            {englishTitle}
          </Text>
          <Text
            style={[styles.englishBody, { color: colors.mutedForeground }]}
          >
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
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityLabel={isLastInfoScreen ? "Set up your app" : "Next"}
          accessibilityRole="button"
          onPress={() => router.push(nextRoute)}
          style={({ pressed }) => [
            styles.nextButton,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.buttonCopy}>
            <Text
              style={[
                styles.buttonEnglish,
                { color: colors.primaryForeground },
              ]}
            >
              {isLastInfoScreen ? "Set up your app" : "Next"}
            </Text>
            <Text
              style={[styles.buttonUrdu, { color: colors.primaryForeground }]}
            >
              {isLastInfoScreen ? "ایپ کی ترتیب کریں" : "اگلا"}
            </Text>
          </View>
          <Text
            style={[styles.buttonArrow, { color: colors.primaryForeground }]}
          >
            ›
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, overflow: "hidden" },
  glow: {
    borderRadius: 180,
    height: 300,
    opacity: 0.12,
    position: "absolute",
    right: -150,
    top: -140,
    width: 300,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  headerButton: { alignItems: "center", borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  backIcon: { fontFamily: Fonts.interRegular, fontSize: 30, lineHeight: 32 },
  brandLockup: { alignItems: "center" },
  brandEnglish: { fontFamily: Fonts.interSemiBold, fontSize: 14, lineHeight: 18 },
  brandUrdu: { fontFamily: Fonts.notoNastaliqUrdu, fontSize: 11, lineHeight: 23 },
  skipText: { fontFamily: Fonts.interSemiBold, fontSize: 12, lineHeight: 15, textAlign: "center" },
  skipUrdu: { fontFamily: Fonts.notoNaskhArabic, fontSize: 11, lineHeight: 15, textAlign: "center" },
  progressRow: { flexDirection: "row", gap: 8, paddingHorizontal: 24, paddingTop: 14 },
  progressTrack: { borderRadius: 3, flex: 1, height: 5 },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 22 },
  artworkCard: {
    alignItems: "center",
    borderRadius: 32,
    height: 220,
    justifyContent: "center",
    marginBottom: 26,
    overflow: "hidden",
    position: "relative",
  },
  sun: { borderRadius: 50, height: 78, opacity: 0.5, position: "absolute", right: 30, top: 25, width: 78 },
  heroCircle: { alignItems: "center", borderRadius: 72, height: 144, justifyContent: "center", width: 144 },
  heroEmoji: { fontSize: 76, lineHeight: 96 },
  ground: { bottom: -30, height: 68, left: -10, opacity: 0.8, position: "absolute", right: -10, transform: [{ rotate: "-3deg" }] },
  scanFrame: { alignItems: "center", borderRadius: 28, borderWidth: 3, height: 156, justifyContent: "center", width: 156 },
  scanLine: { height: 3, left: 15, opacity: 0.85, position: "absolute", right: 15, top: 76 },
  resultPill: { alignItems: "center", borderRadius: 18, bottom: 18, flexDirection: "row", paddingHorizontal: 14, paddingVertical: 8, position: "absolute", right: 18 },
  statusDot: { borderRadius: 5, height: 10, marginRight: 8, width: 10 },
  resultText: { fontFamily: Fonts.interSemiBold, fontSize: 12 },
  decisionArtwork: { gap: 12, paddingHorizontal: 30 },
  insightCard: { alignItems: "center", alignSelf: "flex-start", borderRadius: 20, flexDirection: "row", padding: 16, width: "86%" },
  insightCardOffset: { alignSelf: "flex-end" },
  insightEmoji: { fontSize: 34, lineHeight: 44 },
  insightCopy: { flex: 1, gap: 9, marginLeft: 14 },
  insightLineLong: { borderRadius: 3, height: 7, opacity: 0.8, width: "88%" },
  insightLineShort: { borderRadius: 3, height: 6, opacity: 0.35, width: "60%" },
  copyBlock: { alignItems: "stretch" },
  englishTitle: { fontFamily: Fonts.interSemiBold, fontSize: 29, lineHeight: 36, textAlign: "left" },
  englishBody: { fontFamily: Fonts.interRegular, fontSize: 15, lineHeight: 23, marginTop: 8, textAlign: "left" },
  divider: { height: 1, marginVertical: 15 },
  urduTitle: { fontFamily: Fonts.notoNastaliqUrdu, fontSize: 23, lineHeight: 46, textAlign: "right", writingDirection: "rtl" },
  urduBody: { fontFamily: Fonts.notoNaskhArabic, fontSize: 17, lineHeight: 31, marginTop: 3, textAlign: "right", writingDirection: "rtl" },
  footer: { paddingBottom: 12, paddingHorizontal: 24, paddingTop: 8 },
  nextButton: { alignItems: "center", borderRadius: 18, flexDirection: "row", justifyContent: "center", minHeight: 58, paddingHorizontal: 22 },
  buttonCopy: { alignItems: "center" },
  buttonEnglish: { fontFamily: Fonts.interSemiBold, fontSize: 15, lineHeight: 20 },
  buttonUrdu: { fontFamily: Fonts.notoNaskhArabic, fontSize: 14, lineHeight: 20 },
  buttonArrow: { fontFamily: Fonts.interRegular, fontSize: 28, lineHeight: 30, marginLeft: 12 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
