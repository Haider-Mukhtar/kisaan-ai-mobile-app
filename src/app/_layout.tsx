import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
  type Theme,
} from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Inter_400Regular, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { NotoNaskhArabic_400Regular } from "@expo-google-fonts/noto-naskh-arabic";
import { NotoNastaliqUrdu_400Regular } from "@expo-google-fonts/noto-nastaliq-urdu";
import { NotoSansArabic_600SemiBold } from "@expo-google-fonts/noto-sans-arabic";

import { Fonts } from "@/constants/theme";
import useThemeManager from "@/hooks/use-theme-manager";
import {
  LanguageProvider,
  useLanguage,
} from "@/providers/language-provider";
import { ThemeProvider } from "@/providers/theme-provider";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [Fonts.notoNaskhArabic]: NotoNaskhArabic_400Regular,
    [Fonts.notoNastaliqUrdu]: NotoNastaliqUrdu_400Regular,
    [Fonts.notoSansArabic]: NotoSansArabic_600SemiBold,
    [Fonts.interRegular]: Inter_400Regular,
    [Fonts.interSemiBold]: Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (fontError) {
    throw fontError;
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <ThemedRootLayout />
      </LanguageProvider>
    </ThemeProvider>
  );
}

function ThemedRootLayout() {
  const { colors, effectiveTheme, isDarkMode } = useThemeManager();
  const { direction, fonts } = useLanguage();

  const baseTheme = effectiveTheme === "dark" ? DarkTheme : DefaultTheme;
  const navigationTheme: Theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.foreground,
      border: colors.border,
      notification: colors.destructive,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <View style={[styles.app, { direction }]}>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.background },
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
            headerTitleStyle: { fontFamily: fonts.label },
          }}
        />
      </View>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </NavigationThemeProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
  },
});
