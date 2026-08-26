import type { PropsWithChildren, ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";

type OnboardingFrameProps = PropsWithChildren<{
  step: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
  footer: ReactNode;
  onBack?: () => void;
}>;

export function OnboardingFrame({
  step,
  title,
  description,
  footer,
  onBack,
  children,
}: OnboardingFrameProps) {
  const { colors } = useThemeManager();
  const { isRTL, t } = useLanguage();

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View
        pointerEvents="none"
        style={[styles.glow, { backgroundColor: colors.primary }]}
      />

      <View style={[styles.header, isRTL && styles.rowReverse]}>
        {onBack ? (
          <Pressable
            accessibilityLabel={t("back")}
            accessibilityRole="button"
            hitSlop={12}
            onPress={onBack}
            style={[styles.backButton, { backgroundColor: colors.muted }]}
          >
            <AppText
              variant="label"
              style={[styles.backIcon, { color: colors.foreground }]}
            >
              {isRTL ? "›" : "‹"}
            </AppText>
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}

        <AppText
          variant="label"
          style={[styles.brand, { color: colors.foreground }]}
        >
          {t("appName")}
        </AppText>

        <AppText
          variant="label"
          style={[styles.stepLabel, { color: colors.mutedForeground }]}
        >
          {t("onboardingStep", { current: step, total: 5 })}
        </AppText>
      </View>

      <View style={styles.progressRow}>
        {[1, 2, 3, 4, 5].map((item) => (
          <View
            key={item}
            style={[
              styles.progressTrack,
              {
                backgroundColor:
                  item <= step ? colors.primary : colors.muted,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <AppText
            variant="title"
            style={[styles.title, { color: colors.foreground }]}
          >
            {title}
          </AppText>
          <AppText
            style={[styles.description, { color: colors.mutedForeground }]}
          >
            {description}
          </AppText>
        </View>

        <View style={styles.options}>{children}</View>
      </ScrollView>

      <View style={styles.footer}>{footer}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    overflow: "hidden",
  },
  glow: {
    borderRadius: 190,
    height: 320,
    opacity: 0.12,
    position: "absolute",
    right: -150,
    top: -150,
    width: 320,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  backButton: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  backIcon: {
    fontSize: 30,
    lineHeight: 32,
    textAlign: "center",
  },
  brand: {
    fontSize: 15,
    lineHeight: 28,
    textAlign: "center",
  },
  stepLabel: {
    fontSize: 12,
    lineHeight: 20,
    minWidth: 36,
  },
  progressRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  progressTrack: {
    borderRadius: 3,
    flex: 1,
    height: 5,
  },
  content: {
    flexGrow: 1,
    gap: 32,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  title: {
    fontSize: 34,
    lineHeight: 54,
  },
  description: {
    fontSize: 16,
    lineHeight: 28,
    marginTop: 8,
  },
  options: {
    gap: 14,
  },
  footer: {
    paddingBottom: 12,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
});
