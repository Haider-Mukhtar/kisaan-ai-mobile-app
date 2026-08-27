import type { PropsWithChildren, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Fonts } from "@/constants/theme";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";

type AuthShellProps = PropsWithChildren<{
  footer: ReactNode;
  onBack?: () => void;
}>;

export function AuthShell({ footer, onBack, children }: AuthShellProps) {
  const { colors } = useThemeManager();
  const { t } = useLanguage();

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
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

        <View style={styles.sideSlot} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
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
