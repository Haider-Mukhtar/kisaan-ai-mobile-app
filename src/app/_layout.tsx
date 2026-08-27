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
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Inter_400Regular, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { NotoNaskhArabic_400Regular } from "@expo-google-fonts/noto-naskh-arabic";
import { NotoNastaliqUrdu_400Regular } from "@expo-google-fonts/noto-nastaliq-urdu";
import { NotoSansArabic_600SemiBold } from "@expo-google-fonts/noto-sans-arabic";
import Toast from "react-native-toast-message";

import AppSplashScreen from "@/components/splash-screen";
import { Fonts } from "@/constants/theme";
import useThemeManager from "@/hooks/use-theme-manager";
import {
  LanguageProvider,
  useLanguage,
} from "@/providers/language-provider";
import {
  OnboardingProvider,
  useOnboarding,
} from "@/providers/onboarding-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import toastConfig from "@/components/toast-config";

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
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <OnboardingProvider>
            <ThemedRootLayout />
          </OnboardingProvider>
        </LanguageProvider>
      </ThemeProvider>
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  );
}

function ThemedRootLayout() {
  const {
    colors,
    effectiveTheme,
    isDarkMode,
    isReady: isThemeReady,
  } = useThemeManager();
  const {
    direction,
    fonts,
    isReady: isLanguageReady,
  } = useLanguage();
  const {
    isComplete: isOnboardingComplete,
    isReady: isOnboardingReady,
  } = useOnboarding();
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinSplashElapsed(true), 2000);

    return () => clearTimeout(timer);
  }, []);

  const showSplash =
    !minSplashElapsed ||
    !isThemeReady ||
    !isLanguageReady ||
    !isOnboardingReady;

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
        {showSplash ? (
          <AppSplashScreen />
        ) : (
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: colors.background },
              headerShown: false,
              headerStyle: { backgroundColor: colors.card },
              headerTintColor: colors.foreground,
              headerTitleStyle: { fontFamily: fonts.label },
            }}
          >
            <Stack.Protected guard={!isOnboardingComplete}>
              <Stack.Screen name="(onboarding)" />
            </Stack.Protected>
            <Stack.Protected guard={isOnboardingComplete}>
              <Stack.Screen name="index" />
            </Stack.Protected>
          </Stack>
        )}
      </View>
      <StatusBar style={showSplash || isDarkMode ? "light" : "dark"} />
    </NavigationThemeProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
  },
});
