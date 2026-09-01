import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import {
  useLanguage,
  type TranslationKey,
} from "@/providers/language-provider";
import type {
  GeminiConnectionStatus,
  GeminiErrorCode,
} from "@/services/gemini/types";

const STATUS_KEYS: Record<GeminiConnectionStatus, TranslationKey> = {
  closed: "aiStatusIdle",
  connected: "aiStatusConnected",
  connecting: "aiStatusConnecting",
  error: "aiStatusError",
  idle: "aiStatusIdle",
  reconnecting: "aiStatusReconnecting",
};

const ERROR_KEYS: Record<GeminiErrorCode, TranslationKey> = {
  "audio-playback": "aiErrorAudioPlayback",
  connection: "aiErrorConnection",
  "connection-lost": "aiErrorConnectionLost",
  "image-permission": "aiErrorImagePermission",
  "image-too-large": "aiErrorImageTooLarge",
  "image-unavailable": "aiErrorImageUnavailable",
  "image-unsupported": "aiErrorImageUnsupported",
  "invalid-response": "aiErrorInvalidResponse",
  "microphone-permission": "aiErrorMicrophonePermission",
  "microphone-start": "aiErrorMicrophoneStart",
  "missing-key": "aiErrorMissingKey",
  send: "aiErrorSend",
  "session-restarted": "aiErrorSessionRestarted",
};

type StatusProps = {
  onRetry: () => void;
  status: GeminiConnectionStatus;
};

export function AiLiveStatus({ onRetry, status }: StatusProps) {
  const { colors } = useThemeManager();
  const { t } = useLanguage();
  const isConnected = status === "connected";

  return (
    <View style={styles.statusRow}>
      <View
        accessibilityLiveRegion="polite"
        style={[
          styles.statusPill,
          {
            backgroundColor: isConnected ? colors.primary : colors.muted,
            borderColor: isConnected ? colors.primaryDark : colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: isConnected
                ? colors.success
                : status === "error"
                  ? colors.red
                  : colors.warning,
            },
          ]}
        />
        <AppText
          numberOfLines={1}
          variant="label"
          style={[
            styles.statusText,
            {
              color: isConnected
                ? colors.primaryForeground
                : colors.mutedForeground,
            },
          ]}
        >
          {t(STATUS_KEYS[status])}
        </AppText>
      </View>

      {!isConnected && status !== "connecting" ? (
        <Pressable
          accessibilityLabel={t("aiRetry")}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retry,
            { opacity: pressed ? 0.55 : 1 },
          ]}
        >
          <Ionicons color={colors.foreground} name="refresh" size={18} />
        </Pressable>
      ) : null}
    </View>
  );
}

type ErrorProps = {
  errorCode: GeminiErrorCode | null;
  onDismissError: () => void;
};

export function AiLiveError({ errorCode, onDismissError }: ErrorProps) {
  const { colors } = useThemeManager();
  const { t } = useLanguage();

  if (!errorCode) {
    return null;
  }

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
        {t(ERROR_KEYS[errorCode])}
      </AppText>
      <Pressable
        accessibilityLabel={t("aiDismiss")}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onDismissError}
      >
        <Ionicons
          color={colors.destructiveForeground}
          name="close"
          size={20}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
  retry: {
    alignItems: "center",
    height: 34,
    justifyContent: "center",
    width: 28,
  },
  statusDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  statusPill: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    flexShrink: 1,
    gap: 6,
    maxWidth: 148,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: 2,
  },
  statusText: {
    fontSize: 11,
    lineHeight: 17,
  },
});
