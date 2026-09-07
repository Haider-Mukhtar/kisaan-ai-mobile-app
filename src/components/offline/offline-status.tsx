import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import {
  useLanguage,
  type TranslationKey,
} from "@/providers/language-provider";
import type { OfflineLlmPhase } from "@/services/offline-llm/types";

const PHASE_KEYS: Record<OfflineLlmPhase, TranslationKey> = {
  downloading: "offlineStatusDownloading",
  error: "offlineStatusError",
  generating: "offlineStatusGenerating",
  loading: "offlineStatusLoading",
  ready: "offlineStatusReady",
};

type Props = {
  phase: OfflineLlmPhase;
};

export function OfflineStatusPill({ phase }: Props) {
  const { colors } = useThemeManager();
  const { t } = useLanguage();
  const ready = phase === "ready" || phase === "generating";

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.pill,
        {
          backgroundColor: ready ? colors.primary : colors.muted,
          borderColor: ready ? colors.primaryDark : colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            backgroundColor:
              phase === "error"
                ? colors.red
                : ready
                  ? colors.success
                  : colors.warning,
          },
        ]}
      />
      <AppText
        numberOfLines={1}
        variant="label"
        style={[
          styles.text,
          {
            color: ready ? colors.primaryForeground : colors.mutedForeground,
          },
        ]}
      >
        {t(PHASE_KEYS[phase])}
      </AppText>
    </View>
  );
}

type ErrorProps = {
  message: string;
  onDismiss?: () => void;
};

export function OfflineErrorBanner({ message, onDismiss }: ErrorProps) {
  const { colors } = useThemeManager();
  const { t } = useLanguage();

  return (
    <View
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      style={[
        styles.error,
        {
          backgroundColor: colors.destructive,
          borderColor: colors.red,
        },
      ]}
    >
      <Ionicons
        color={colors.destructiveForeground}
        name="alert-circle-outline"
        size={20}
      />
      <AppText
        style={[styles.errorCopy, { color: colors.destructiveForeground }]}
      >
        {message}
      </AppText>
      {onDismiss ? (
        <Pressable
          accessibilityLabel={t("aiDismiss")}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onDismiss}
        >
          <Ionicons
            color={colors.destructiveForeground}
            name="close"
            size={20}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  error: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 9,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorCopy: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
  },
  pill: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    flexShrink: 1,
    gap: 6,
    maxWidth: 168,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  text: {
    fontSize: 11,
    lineHeight: 17,
  },
});
