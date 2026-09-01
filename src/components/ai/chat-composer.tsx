import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Image } from "expo-image";
import { useCallback } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import type {
  GeminiConnectionStatus,
  PendingImage,
} from "@/services/gemini/types";

type Props = {
  image: PendingImage | null;
  isModelSpeaking: boolean;
  isRecording: boolean;
  nativeID?: string;
  onChooseImage: () => void;
  onClearImage: () => void;
  onSend: (text: string) => boolean;
  onStopModelAudio: () => void;
  onTakePhoto: () => void;
  onToggleMic: (contextText: string) => Promise<boolean>;
  status: GeminiConnectionStatus;
  text: string;
  onChangeText: (value: string) => void;
};

export function AiChatComposer({
  image,
  isModelSpeaking,
  isRecording,
  nativeID,
  onChangeText,
  onChooseImage,
  onClearImage,
  onSend,
  onStopModelAudio,
  onTakePhoto,
  onToggleMic,
  status,
  text,
}: Props) {
  const { colors } = useThemeManager();
  const { fonts, t, textAlign } = useLanguage();
  const isConnected = status === "connected";
  const canSend = isConnected && !isRecording && Boolean(text.trim() || image);

  const send = useCallback(() => {
    if (onSend(text)) {
      onChangeText("");
    }
  }, [onChangeText, onSend, text]);

  const toggleMic = useCallback(async () => {
    const consumedDraft = await onToggleMic(text);
    if (consumedDraft) {
      onChangeText("");
    }
  }, [onChangeText, onToggleMic, text]);

  const showImageOptions = useCallback(() => {
    Alert.alert(t("aiAttachImage"), undefined, [
      { onPress: onTakePhoto, text: t("aiTakePhoto") },
      { onPress: onChooseImage, text: t("aiChoosePhoto") },
      { style: "cancel", text: t("aiCancel") },
    ]);
  }, [onChooseImage, onTakePhoto, t]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
    >
      {isModelSpeaking ? (
        <Pressable
          accessibilityLabel={t("aiSpeaking")}
          accessibilityRole="button"
          onPress={onStopModelAudio}
          style={[
            styles.speaking,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <Ionicons color={colors.info} name="volume-high" size={17} />
          <AppText
            variant="label"
            style={[styles.speakingText, { color: colors.foreground }]}
          >
            {t("aiSpeaking")}
          </AppText>
          <Ionicons color={colors.mutedForeground} name="close" size={16} />
        </Pressable>
      ) : null}

      {image ? (
        <View style={styles.previewWrap}>
          <Image
            accessibilityLabel={t("aiAttachImage")}
            contentFit="cover"
            source={{ uri: image.uri }}
            style={[styles.preview, { backgroundColor: colors.muted }]}
          />
          <Pressable
            accessibilityLabel={t("aiRemoveImage")}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClearImage}
            style={[styles.removeImage, { backgroundColor: colors.red }]}
          >
            <Ionicons
              color={colors.destructiveForeground}
              name="close"
              size={16}
            />
          </Pressable>
        </View>
      ) : null}

      {isRecording ? (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.listening, { backgroundColor: colors.destructive }]}
        >
          <View
            style={[
              styles.recordingDot,
              { backgroundColor: colors.destructiveForeground },
            ]}
          />
          <AppText
            variant="label"
            style={[
              styles.listeningText,
              { color: colors.destructiveForeground },
            ]}
          >
            {t("aiListening")}
          </AppText>
        </View>
      ) : null}

      <View
        style={[
          styles.composer,
          { backgroundColor: colors.input, borderColor: colors.border },
        ]}
      >
        <Pressable
          accessibilityLabel={t("aiAttachImage")}
          accessibilityRole="button"
          disabled={isRecording}
          hitSlop={6}
          onPress={showImageOptions}
          style={({ pressed }) => [
            styles.iconButton,
            { opacity: pressed || isRecording ? 0.45 : 1 },
          ]}
        >
          <Ionicons color={colors.foreground} name="image-outline" size={23} />
        </Pressable>

        <TextInput
          accessibilityLabel={t("aiTypePlaceholder")}
          editable={!isRecording}
          maxLength={4_000}
          multiline
          nativeID={nativeID}
          onChangeText={onChangeText}
          placeholder={t("aiTypePlaceholder")}
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            {
              color: colors.foreground,
              fontFamily: fonts.body,
              textAlign,
            },
          ]}
          textAlignVertical="top"
          value={text}
        />

        <Pressable
          accessibilityLabel={
            isRecording ? t("aiStopListening") : t("aiStartListening")
          }
          accessibilityRole="button"
          disabled={!isConnected && !isRecording}
          onPress={() => void toggleMic()}
          style={({ pressed }) => [
            styles.roundButton,
            {
              backgroundColor: isRecording
                ? colors.red
                : colors.primary,
              opacity: pressed || (!isConnected && !isRecording) ? 0.45 : 1,
            },
          ]}
        >
          <Ionicons
            color={
              isRecording
                ? colors.destructiveForeground
                : colors.primaryForeground
            }
            name={isRecording ? "stop" : "mic"}
            size={21}
          />
        </Pressable>

        {!isRecording ? (
          <Pressable
            accessibilityLabel={t("aiSend")}
            accessibilityRole="button"
            disabled={!canSend}
            onPress={send}
            style={({ pressed }) => [
              styles.roundButton,
              {
                backgroundColor: canSend ? colors.primaryDark : colors.muted,
                opacity: pressed ? 0.55 : 1,
              },
            ]}
          >
            <Ionicons
              color={
                canSend ? colors.primaryForeground : colors.mutedForeground
              }
              name="arrow-up"
              size={22}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  composer: {
    alignItems: "flex-end",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    minHeight: 52,
    padding: 5,
  },
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
    paddingBottom: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  iconButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 38,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    maxHeight: 108,
    minHeight: 40,
    paddingHorizontal: 4,
    paddingVertical: 9,
  },
  listening: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  listeningText: {
    fontSize: 13,
    lineHeight: 20,
  },
  preview: {
    borderRadius: 14,
    height: 78,
    width: 104,
  },
  previewWrap: {
    alignSelf: "flex-start",
    marginTop: 2,
    position: "relative",
  },
  recordingDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  removeImage: {
    alignItems: "center",
    borderRadius: 12,
    height: 24,
    justifyContent: "center",
    position: "absolute",
    right: -8,
    top: -8,
    width: 24,
  },
  roundButton: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  speaking: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  speakingText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
