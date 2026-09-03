import type { PropsWithChildren, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/app-text";
import { Fonts } from "@/constants/theme";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import { useNetwork } from "@/providers/network-provider";
import { androidNastaliqHeadingStyle } from "@/utils/typography";

export type ProfileSetupStep = 1 | 2 | 3 | 4 | 5 | 6;

type ProfileSetupShellProps = PropsWithChildren<{
  step: ProfileSetupStep;
  icon: string;
  title: string;
  description: string;
  footer: ReactNode;
  onBack?: () => void;
}>;

export function ProfileSetupShell({
  step,
  icon,
  title,
  description,
  footer,
  onBack,
  children,
}: ProfileSetupShellProps) {
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
              {step} / 6
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.progressRow}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <View
            key={item}
            style={[
              styles.progressTrack,
              { backgroundColor: item <= step ? colors.primary : colors.muted },
            ]}
          />
        ))}
      </View>

      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
            <Text style={styles.icon}>{icon}</Text>
          </View>

          <View style={styles.copyBlock}>
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

          <View style={styles.control}>{children}</View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {footer}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    overflow: "hidden",
  },
  flex: {
    flex: 1,
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
    fontVariant: ["tabular-nums"],
    lineHeight: 16,
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
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  iconCircle: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  icon: {
    fontSize: 27,
    lineHeight: 38,
  },
  copyBlock: {
    paddingTop: 18,
  },
  title: {
    fontSize: 30,
    lineHeight: 46,
  },
  description: {
    fontSize: 15,
    lineHeight: 26,
    paddingTop: 4,
  },
  control: {
    paddingTop: 28,
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
