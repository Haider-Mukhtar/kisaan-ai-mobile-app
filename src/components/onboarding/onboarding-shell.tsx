import type { PropsWithChildren, ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Fonts } from "@/constants/theme";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import { useNetwork } from "@/providers/network-provider";
import { androidNastaliqHeadingStyle } from "@/utils/typography";

export type OnboardingStep = 1 | 2 | 3 | 4 | 5;

type OnboardingShellProps = PropsWithChildren<{
  step: OnboardingStep;
  footer: ReactNode;
  onBack?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function OnboardingShell({
  step,
  footer,
  onBack,
  contentStyle,
  children,
}: OnboardingShellProps) {
  const { colors } = useThemeManager();
  const { t } = useLanguage();
  const { isOffline } = useNetwork();

  return (
    <SafeAreaView
      edges={isOffline ? ["bottom"] : ["top", "bottom"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View
        pointerEvents="none"
        style={[styles.glow, { backgroundColor: colors.primary }]}
      />

      <View style={styles.header}>
        <View style={styles.sideSlot}>
          {onBack ? (
            <Pressable
              accessibilityLabel={t("back")}
              accessibilityRole="button"
              hitSlop={10}
              onPress={onBack}
              style={({ pressed }) => [
                styles.backButton,
                { backgroundColor: colors.muted },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.backIcon, { color: colors.foreground }]}>
                ‹
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.brandLockup}>
          <Text style={[styles.brandEnglish, { color: colors.foreground }]}>
            Kisaan AI
          </Text>
          <Text style={[styles.brandUrdu, { color: colors.mutedForeground }]}>
            کسان اے آئی
          </Text>
        </View>

        <View style={styles.sideSlot}>
          <View style={[styles.stepBadge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>
              {step} / 5
            </Text>
          </View>
        </View>
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
        contentContainerStyle={[styles.content, contentStyle]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        {footer}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    overflow: "hidden",
  },
  glow: {
    borderRadius: 180,
    height: 300,
    opacity: 0.1,
    position: "absolute",
    right: -150,
    top: -140,
    width: 300,
  },
  header: {
    alignItems: "center",
    direction: "ltr",
    flexDirection: "row",
    minHeight: 54,
    paddingHorizontal: 24,
    paddingTop: 6,
  },
  sideSlot: {
    alignItems: "center",
    justifyContent: "center",
    width: 54,
  },
  backButton: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  backIcon: {
    fontFamily: Fonts.interRegular,
    fontSize: 30,
    lineHeight: 32,
    textAlign: "center",
  },
  brandLockup: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  brandEnglish: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  brandUrdu: {
    fontFamily: Fonts.notoNastaliqUrdu,
    fontSize: 11,
    lineHeight: 23,
    ...androidNastaliqHeadingStyle(11, 23),
  },
  stepBadge: {
    alignItems: "center",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    minWidth: 50,
    paddingHorizontal: 8,
  },
  stepLabel: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  progressRow: {
    direction: "ltr",
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  progressTrack: {
    borderRadius: 3,
    flex: 1,
    height: 5,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: 12,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  pressed: {
    opacity: 0.76,
  },
});
