import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { OnboardingButton } from "@/components/onboarding/onboarding-button";
import { OnboardingFrame } from "@/components/onboarding/onboarding-frame";
import { Fonts } from "@/constants/theme";
import useThemeManager from "@/hooks/use-theme-manager";
import {
  useLanguage,
  type LanguageCode,
} from "@/providers/language-provider";

const options: Array<{
  code: LanguageCode;
  name: string;
  sample: string;
  fontFamily: string;
  direction: "ltr" | "rtl";
}> = [
  {
    code: "en",
    name: "English",
    sample: "Aa",
    fontFamily: Fonts.interSemiBold,
    direction: "ltr",
  },
  {
    code: "ur",
    name: "اردو",
    sample: "ا",
    fontFamily: Fonts.notoNastaliqUrdu,
    direction: "rtl",
  },
];

export default function LanguageOnboardingScreen() {
  const router = useRouter();
  const { colors } = useThemeManager();
  const { language, setLanguage, t } = useLanguage();

  return (
    <OnboardingFrame
      step={4}
      title={t("onboardingLanguageTitle")}
      description={t("onboardingLanguageDescription")}
      onBack={() => router.back()}
      footer={
        <OnboardingButton
          label={t("continue")}
          onPress={() => router.push("/(onboarding)/appearance")}
        />
      }
    >
      {options.map((option) => {
        const selected = language === option.code;

        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            key={option.code}
            onPress={() => setLanguage(option.code)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: selected ? colors.accent : colors.card,
                borderColor: selected ? colors.primary : colors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.sample,
                {
                  backgroundColor: selected ? colors.primary : colors.muted,
                },
              ]}
            >
              <Text
                style={[
                  styles.sampleText,
                  {
                    color: selected
                      ? colors.primaryForeground
                      : colors.foreground,
                    fontFamily: option.fontFamily,
                    writingDirection: option.direction,
                  },
                ]}
              >
                {option.sample}
              </Text>
            </View>

            <View style={styles.cardCopy}>
              <Text
                style={[
                  styles.languageName,
                  {
                    color: colors.foreground,
                    fontFamily: option.fontFamily,
                    writingDirection: option.direction,
                  },
                ]}
              >
                {option.name}
              </Text>
              <Text
                style={[
                  styles.languageDescription,
                  {
                    color: colors.mutedForeground,
                    fontFamily:
                      option.code === "ur"
                        ? Fonts.notoNaskhArabic
                        : Fonts.interRegular,
                    writingDirection: option.direction,
                  },
                ]}
              >
                {option.code === "ur"
                  ? "ایپ کو اردو میں استعمال کریں"
                  : "Use the app in English"}
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                {
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              {selected && (
                <View
                  style={[styles.radioDot, { backgroundColor: colors.primary }]}
                />
              )}
            </View>
          </Pressable>
        );
      })}
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 2,
    flexDirection: "row",
    minHeight: 112,
    padding: 16,
  },
  pressed: {
    opacity: 0.84,
  },
  sample: {
    alignItems: "center",
    borderRadius: 18,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  sampleText: {
    fontSize: 29,
    lineHeight: 48,
    textAlign: "center",
  },
  cardCopy: {
    flex: 1,
    marginHorizontal: 16,
  },
  languageName: {
    fontSize: 20,
    lineHeight: 34,
  },
  languageDescription: {
    fontSize: 13,
    lineHeight: 24,
    marginTop: 1,
  },
  radio: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  radioDot: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
});
