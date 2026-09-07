import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useCallback } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import { OFFLINE_MAX_INPUT_LENGTH } from "@/services/offline-llm/config";

type Props = {
  disabled: boolean;
  isGenerating: boolean;
  nativeID?: string;
  onChangeText: (value: string) => void;
  onSend: (text: string) => void;
  onStop: () => void;
  text: string;
};

export function OfflineChatComposer({
  disabled,
  isGenerating,
  nativeID,
  onChangeText,
  onSend,
  onStop,
  text,
}: Props) {
  const { colors } = useThemeManager();
  const { fonts, t, textAlign } = useLanguage();
  const canSend = !disabled && !isGenerating && Boolean(text.trim());

  const send = useCallback(() => {
    if (!canSend) {
      return;
    }

    onSend(text);
    onChangeText("");
  }, [canSend, onChangeText, onSend, text]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
    >
      {isGenerating ? (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.generating,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <Ionicons color={colors.info} name="hourglass-outline" size={16} />
          <AppText
            variant="label"
            style={[styles.generatingText, { color: colors.foreground }]}
          >
            {t("offlineStatusGenerating")}
          </AppText>
        </View>
      ) : null}

      <View
        style={[
          styles.composer,
          { backgroundColor: colors.input, borderColor: colors.border },
        ]}
      >
        <TextInput
          accessibilityLabel={t("offlineTypePlaceholder")}
          editable={!disabled && !isGenerating}
          maxLength={OFFLINE_MAX_INPUT_LENGTH}
          multiline
          nativeID={nativeID}
          onChangeText={onChangeText}
          placeholder={t("offlineTypePlaceholder")}
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

        {isGenerating ? (
          <Pressable
            accessibilityLabel={t("offlineStop")}
            accessibilityRole="button"
            onPress={onStop}
            style={({ pressed }) => [
              styles.roundButton,
              {
                backgroundColor: colors.red,
                opacity: pressed ? 0.55 : 1,
              },
            ]}
          >
            <Ionicons
              color={colors.destructiveForeground}
              name="stop"
              size={18}
            />
          </Pressable>
        ) : (
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
        )}
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
  generating: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  generatingText: {
    fontSize: 12,
    lineHeight: 18,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    maxHeight: 108,
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  roundButton: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
});
