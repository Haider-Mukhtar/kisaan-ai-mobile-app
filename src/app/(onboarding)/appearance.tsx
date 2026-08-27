import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useState } from "react";

import { OnboardingButton } from "@/components/onboarding/onboarding-button";
import { OnboardingFrame } from "@/components/onboarding/onboarding-frame";
import { AppText } from "@/components/ui/app-text";
import { Colors } from "@/constants/theme";
import useThemeManager from "@/hooks/use-theme-manager";
import {
  useLanguage,
  type TranslationKey,
} from "@/providers/language-provider";
import { useOnboarding } from "@/providers/onboarding-provider";
import type { ThemePreference } from "@/providers/theme-provider";

const options: {
  value: ThemePreference;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
}[] = [
  {
    value: "system",
    titleKey: "themeSystem",
    descriptionKey: "themeSystemDescription",
  },
  {
    value: "light",
    titleKey: "themeLight",
    descriptionKey: "themeLightDescription",
  },
  {
    value: "dark",
    titleKey: "themeDark",
    descriptionKey: "themeDarkDescription",
  },
];

function ThemePreview({ theme }: { theme: ThemePreference }) {
  const palette = theme === "dark" ? Colors.dark : Colors.light;

  if (theme === "system") {
    return (
      <View style={styles.preview}>
        <View
          style={[
            styles.previewHalf,
            { backgroundColor: Colors.light.background },
          ]}
        >
          <View
            style={[
              styles.previewCard,
              { backgroundColor: Colors.light.primary },
            ]}
          />
        </View>
        <View
          style={[
            styles.previewHalf,
            { backgroundColor: Colors.dark.background },
          ]}
        >
          <View
            style={[
              styles.previewCard,
              { backgroundColor: Colors.dark.primary },
            ]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.preview, { backgroundColor: palette.background }]}>
      <View style={[styles.previewCard, { backgroundColor: palette.primary }]} />
      <View style={[styles.previewLine, { backgroundColor: palette.muted }]} />
    </View>
  );
}

export default function AppearanceOnboardingScreen() {
  const router = useRouter();
  const { colors, storedTheme, setTheme } = useThemeManager();
  const { t } = useLanguage();
  const { markComplete } = useOnboarding();
  const [isFinishing, setIsFinishing] = useState(false);

  const finishOnboarding = async () => {
    if (isFinishing) {
      return;
    }

    setIsFinishing(true);
    await markComplete();
  };

  return (
    <OnboardingFrame
      step={5}
      title={t("onboardingThemeTitle")}
      description={t("onboardingThemeDescription")}
      onBack={() => router.back()}
      footer={
        <OnboardingButton
          disabled={isFinishing}
          label={isFinishing ? t("saving") : t("finishSetup")}
          onPress={() => void finishOnboarding()}
        />
      }
    >
      {options.map((option) => {
        const selected = storedTheme === option.value;

        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            key={option.value}
            onPress={() => setTheme(option.value)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: selected ? colors.accent : colors.card,
                borderColor: selected ? colors.primary : colors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <ThemePreview theme={option.value} />

            <View style={styles.cardCopy}>
              <AppText
                variant="label"
                style={[styles.optionTitle, { color: colors.foreground }]}
              >
                {t(option.titleKey)}
              </AppText>
              <AppText
                style={[
                  styles.optionDescription,
                  { color: colors.mutedForeground },
                ]}
              >
                {t(option.descriptionKey)}
              </AppText>
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
    minHeight: 102,
    padding: 14,
  },
  pressed: {
    opacity: 0.84,
  },
  preview: {
    borderColor: "rgba(128, 128, 128, 0.24)",
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    height: 68,
    overflow: "hidden",
    padding: 8,
    width: 74,
  },
  previewHalf: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 4,
  },
  previewCard: {
    borderRadius: 4,
    height: 18,
    width: "100%",
  },
  previewLine: {
    borderRadius: 3,
    height: 7,
    left: 8,
    position: "absolute",
    right: 8,
    top: 12,
  },
  cardCopy: {
    flex: 1,
    marginHorizontal: 15,
  },
  optionTitle: {
    fontSize: 17,
    lineHeight: 28,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 22,
    marginTop: 2,
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
