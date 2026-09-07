import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Image } from "expo-image";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import type { GeminiChatMessage } from "@/services/gemini/types";

type Props = {
  isSpeaking?: boolean;
  message: GeminiChatMessage;
  onSpeakPress?: () => void;
};

export function AiChatBubble({ isSpeaking = false, message, onSpeakPress }: Props) {
  const { colors } = useThemeManager();
  const { language, t } = useLanguage();
  const isUser = message.role === "user";
  const textColor = isUser
    ? colors.primaryForeground
    : colors.cardForeground;
  const canSpeak =
    Boolean(onSpeakPress) &&
    !isUser &&
    !message.isStreaming &&
    Boolean(message.text.trim());

  return (
    <View
      style={[
        styles.row,
        { justifyContent: isUser ? "flex-end" : "flex-start" },
      ]}
    >
      <View style={styles.stack}>
        <View
          accessible
          accessibilityLabel={`${isUser ? t("aiYou") : t("aiAssistant")}: ${message.text}`}
          style={[
            styles.bubble,
            {
              backgroundColor: isUser ? colors.primary : colors.card,
              borderBottomEndRadius: isUser ? 6 : 20,
              borderBottomStartRadius: isUser ? 20 : 6,
              borderColor: isUser ? colors.primaryDark : colors.border,
            },
          ]}
        >
          {message.imageUri ? (
            <Image
              accessibilityLabel={t("aiAttachedCrop")}
              contentFit="cover"
              source={{ uri: message.imageUri }}
              style={styles.image}
              transition={150}
            />
          ) : null}

          {message.text ? (
            <AppText style={[styles.message, { color: textColor }]}>
              {message.text}
            </AppText>
          ) : message.isStreaming ? (
            <ActivityIndicator color={textColor} size="small" />
          ) : null}

          <View style={styles.meta}>
            <AppText style={[styles.time, { color: textColor }]}>
              {new Date(message.timestamp).toLocaleTimeString(
                language === "ur" ? "ur-PK" : "en-PK",
                { hour: "2-digit", minute: "2-digit" },
              )}
            </AppText>
            {message.isStreaming ? (
              <View style={[styles.liveDot, { backgroundColor: textColor }]} />
            ) : null}
          </View>
        </View>

        {canSpeak ? (
          <Pressable
            accessibilityLabel={
              isSpeaking ? t("offlineSpeakStop") : t("offlineSpeak")
            }
            accessibilityRole="button"
            accessibilityState={{ busy: isSpeaking }}
            hitSlop={6}
            onPress={onSpeakPress}
            style={({ pressed }) => [
              styles.speakButton,
              {
                backgroundColor: isSpeaking ? colors.muted : colors.primary,
                borderColor: isSpeaking ? colors.border : colors.primaryDark,
              },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              color={isSpeaking ? colors.foreground : colors.primaryForeground}
              name={isSpeaking ? "stop" : "volume-high"}
              size={18}
            />
            <AppText
              variant="label"
              style={[
                styles.speakLabel,
                {
                  color: isSpeaking
                    ? colors.foreground
                    : colors.primaryForeground,
                },
              ]}
            >
              {isSpeaking ? t("offlineSpeakStop") : t("offlineSpeak")}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 7,
    minWidth: 68,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  image: {
    aspectRatio: 4 / 3,
    borderRadius: 14,
    minWidth: 220,
    overflow: "hidden",
  },
  liveDot: {
    borderRadius: 3,
    height: 6,
    opacity: 0.72,
    width: 6,
  },
  message: {
    fontSize: 15,
    lineHeight: 24,
  },
  meta: {
    alignItems: "center",
    alignSelf: "flex-end",
    flexDirection: "row",
    gap: 5,
  },
  pressed: {
    opacity: 0.7,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 4,
    width: "100%",
  },
  speakButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  speakLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  stack: {
    maxWidth: "84%",
  },
  time: {
    fontSize: 10,
    lineHeight: 15,
    opacity: 0.62,
  },
});
