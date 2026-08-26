import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Fonts } from "@/constants/theme";
import useThemeManager from "@/hooks/use-theme-manager";
import {
  useLanguage,
  type LanguageCode,
  type TranslationKey,
} from "@/providers/language-provider";
import type { ThemePreference } from "@/providers/theme-provider";

const themeOptions: ThemePreference[] = ["system", "light", "dark"];
const languageOptions: { code: LanguageCode; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ur", label: "اردو" },
];

const themeTranslationKeys: Record<ThemePreference, TranslationKey> = {
  system: "themeSystem",
  light: "themeLight",
  dark: "themeDark",
};

export default function Index() {
  const { colors, effectiveTheme, storedTheme, setTheme } = useThemeManager();
  const { isRTL, language, setLanguage, t } = useLanguage();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppText
        variant="title"
        style={[styles.appName, { color: colors.primaryDark }]}
      >
        {t("appName")}
      </AppText>
      <AppText
        variant="title"
        style={[styles.title, { color: colors.foreground }]}
      >
        {t("welcomeTitle")}
      </AppText>
      <AppText style={[styles.description, { color: colors.mutedForeground }]}>
        {t("welcomeSubtitle")}
      </AppText>

      <View style={styles.section}>
        <AppText
          variant="label"
          style={[styles.sectionTitle, { color: colors.foreground }]}
        >
          {t("languageTitle")}
        </AppText>
        <AppText style={[styles.sectionHint, { color: colors.mutedForeground }]}>
          {t("languagePrompt")}
        </AppText>
        <View
          style={[
            styles.picker,
            { backgroundColor: colors.muted },
            isRTL && styles.rowReverse,
          ]}
        >
          {languageOptions.map((option) => {
            const isSelected = language === option.code;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={option.code}
                onPress={() => setLanguage(option.code)}
                style={[
                  styles.option,
                  isSelected && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={{
                    color: isSelected
                      ? colors.primaryForeground
                      : colors.foreground,
                    fontFamily:
                      option.code === "ur"
                        ? Fonts.notoSansArabic
                        : Fonts.interSemiBold,
                    writingDirection: option.code === "ur" ? "rtl" : "ltr",
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <AppText
          variant="label"
          style={[styles.sectionTitle, { color: colors.foreground }]}
        >
          {t("appearanceTitle")}
        </AppText>
        <AppText style={[styles.sectionHint, { color: colors.mutedForeground }]}>
          {t("currentTheme", {
            theme: t(themeTranslationKeys[effectiveTheme]),
          })}
        </AppText>

        <View
          style={[
            styles.picker,
            { backgroundColor: colors.muted },
            isRTL && styles.rowReverse,
          ]}
        >
          {themeOptions.map((option) => {
            const isSelected = storedTheme === option;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={option}
                onPress={() => setTheme(option)}
                style={[
                  styles.option,
                  isSelected && { backgroundColor: colors.primary },
                ]}
              >
                <AppText
                  variant="label"
                  style={{
                    color: isSelected
                      ? colors.primaryForeground
                      : colors.foreground,
                  }}
                >
                  {t(themeTranslationKeys[option])}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  appName: {
    fontSize: 22,
    lineHeight: 42,
  },
  title: {
    fontSize: 32,
    lineHeight: 52,
    marginTop: 2,
  },
  description: {
    fontSize: 16,
    lineHeight: 28,
    marginTop: 8,
    textAlign: "center",
  },
  section: {
    marginTop: 28,
    maxWidth: 480,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 30,
  },
  sectionHint: {
    fontSize: 14,
    lineHeight: 24,
    marginTop: 2,
  },
  picker: {
    borderRadius: 12,
    flexDirection: "row",
    marginTop: 10,
    padding: 4,
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  option: {
    alignItems: "center",
    borderRadius: 9,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
});
