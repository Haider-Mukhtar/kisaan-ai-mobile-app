import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  View,
} from "react-native";

import { AppText } from "@/components/ui/app-text";
import { useLanguage } from "@/providers/language-provider";

const splashBackground = require("../../assets/images/splash-background.png");

export default function SplashScreen() {
  const { t } = useLanguage();

  return (
    <ImageBackground
      source={splashBackground}
      resizeMode="cover"
      style={styles.background}
    >
      <View pointerEvents="none" style={styles.overlay} />

      {/* <View style={styles.brandContainer}>
        <AppText variant="title" style={styles.appName}>
          {t("appName")}
        </AppText>
      </View> */}

      {/* <View style={styles.loadingContainer}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </View> */}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    backgroundColor: "rgba(0, 16, 12, 0.28)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  brandContainer: {
    alignItems: "center",
    left: 24,
    position: "absolute",
    right: 24,
    top: "20%",
  },
  appName: {
    color: "#FFFFFF",
    fontSize: 46,
    lineHeight: 78,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.65)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  loadingContainer: {
    alignItems: "center",
    bottom: 44,
    gap: 10,
    left: 24,
    position: "absolute",
    right: 24,
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.92)",
    fontSize: 14,
    lineHeight: 24,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
