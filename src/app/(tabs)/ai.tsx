import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import { useNetwork } from "@/providers/network-provider";

const FEATURES = [
  { emoji: "💬", title: "aiAskTitle", body: "aiAskDescription" },
  { emoji: "🌿", title: "aiCropTitle", body: "aiCropDescription" },
  { emoji: "💧", title: "aiWaterTitle", body: "aiWaterDescription" },
] as const;

export default function AiScreen() {
  const { colors } = useThemeManager();
  const { t } = useLanguage();
  const { isOffline } = useNetwork();

  return (
    <SafeAreaView
      edges={isOffline ? [] : ["top"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.hero,
            {
              backgroundColor: colors.primary,
              borderColor: colors.primaryDark,
            },
          ]}
        >
          <View
            style={[styles.heroIcon, { backgroundColor: colors.background }]}
          >
            <AppText style={styles.heroEmoji}>✨</AppText>
          </View>
          <AppText
            variant="title"
            style={[styles.title, { color: colors.primaryForeground }]}
          >
            {t("aiTitle")}
          </AppText>
          <AppText
            style={[styles.description, { color: colors.primaryForeground }]}
          >
            {t("aiDescription")}
          </AppText>
          <View
            style={[styles.badge, { backgroundColor: colors.background }]}
          >
            <AppText
              variant="label"
              style={[styles.badgeText, { color: colors.primaryDark }]}
            >
              {t("comingSoon")}
            </AppText>
          </View>
        </View>

        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View
              key={feature.title}
              style={[styles.feature, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View
                style={[styles.featureIcon, { backgroundColor: colors.muted }]}
              >
                <AppText style={styles.featureEmoji}>{feature.emoji}</AppText>
              </View>
              <View style={styles.featureCopy}>
                <AppText
                  variant="label"
                  style={[styles.featureTitle, { color: colors.foreground }]}
                >
                  {t(feature.title)}
                </AppText>
                <AppText
                  style={[
                    styles.featureBody,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {t(feature.body)}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  hero: { alignItems: "center", borderRadius: 28, borderWidth: 1, padding: 24 },
  heroIcon: { alignItems: "center", borderRadius: 32, height: 64, justifyContent: "center", width: 64 },
  heroEmoji: { fontSize: 30, lineHeight: 40, textAlign: "center" },
  title: { fontSize: 26, lineHeight: 44, marginTop: 14, textAlign: "center" },
  description: { fontSize: 15, lineHeight: 26, marginTop: 4, opacity: 0.86, textAlign: "center" },
  badge: { borderRadius: 999, marginTop: 18, paddingHorizontal: 14, paddingVertical: 7 },
  badgeText: { fontSize: 12, lineHeight: 20, textAlign: "center" },
  features: { gap: 12, marginTop: 20 },
  feature: { alignItems: "center", borderRadius: 20, borderWidth: 1, flexDirection: "row", padding: 16 },
  featureIcon: { alignItems: "center", borderRadius: 18, height: 50, justifyContent: "center", width: 50 },
  featureEmoji: { fontSize: 23, lineHeight: 32, textAlign: "center" },
  featureCopy: { flex: 1, marginStart: 14 },
  featureTitle: { fontSize: 16, lineHeight: 27 },
  featureBody: { fontSize: 13, lineHeight: 23, marginTop: 2 },
});
