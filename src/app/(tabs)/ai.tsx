import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import {
  KeyboardAvoidingView,
  KeyboardEvents,
  KeyboardGestureArea,
} from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-screens/experimental";

import { AiChatBubble } from "@/components/ai/chat-bubble";
import { AiChatComposer } from "@/components/ai/chat-composer";
import { AiEmptyChat } from "@/components/ai/empty-chat";
import { AiLiveError, AiLiveStatus } from "@/components/ai/live-status";
import { AppText } from "@/components/ui/app-text";
import { useGeminiLiveChat } from "@/hooks/use-gemini-live-chat";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import { useNetwork } from "@/providers/network-provider";
import type { GeminiChatMessage } from "@/services/gemini/types";

const NEAR_BOTTOM_THRESHOLD = 80;
const COMPOSER_NATIVE_ID = "ai-chat-composer";

export default function AiScreen() {
  const { colors } = useThemeManager();
  const { t } = useLanguage();
  const { isOffline } = useNetwork();
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList<GeminiChatMessage>>(null);
  const isNearBottomRef = useRef(true);
  const {
    chooseFromLibrary,
    clearImage,
    clearMessages,
    dismissError,
    errorCode,
    image,
    isModelSpeaking,
    isRecording,
    messages,
    reconnect,
    sendMessage,
    status,
    stopModelAudio,
    takePhoto,
    toggleMic,
  } = useGeminiLiveChat();

  const renderMessage = useCallback(
    ({ item }: { item: GeminiChatMessage }) => (
      <AiChatBubble message={item} />
    ),
    [],
  );

  const confirmClear = useCallback(() => {
    Alert.alert(t("aiClearChat"), t("aiClearConfirm"), [
      { style: "cancel", text: t("aiCancel") },
      { onPress: clearMessages, style: "destructive", text: t("aiClearChat") },
    ]);
  }, [clearMessages, t]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      isNearBottomRef.current =
        contentOffset.y + layoutMeasurement.height >=
        contentSize.height - NEAR_BOTTOM_THRESHOLD;
    },
    [],
  );

  const scrollToBottomIfPinned = useCallback((animated: boolean) => {
    if (!isNearBottomRef.current) return;
    listRef.current?.scrollToEnd({ animated });
  }, []);

  const handleSend = useCallback(
    (text: string) => {
      isNearBottomRef.current = true;
      return sendMessage(text);
    },
    [sendMessage],
  );

  useEffect(() => {
    const show = KeyboardEvents.addListener("keyboardDidShow", () => {
      if (!isNearBottomRef.current) return;
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    });

    return () => show.remove();
  }, []);

  return (
    <SafeAreaView
      edges={{ bottom: true, top: !isOffline }}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        automaticOffset
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 40}
        style={styles.flex}
      >
        <View
          style={[styles.header, { borderColor: colors.border }]}
        >
          <View style={styles.headerCopy}>
            <AppText
              variant="title"
              style={[styles.title, { color: colors.foreground }]}
            >
              {t("aiTitle")}
            </AppText>
            <AppText
              numberOfLines={1}
              style={[styles.subtitle, { color: colors.mutedForeground }]}
            >
              {t("aiLiveSubtitle")}
            </AppText>
          </View>

          <View style={styles.headerActions}>
            <AiLiveStatus onRetry={reconnect} status={status} />

            {messages.length > 0 ? (
              <Pressable
                accessibilityLabel={t("aiClearChat")}
                accessibilityRole="button"
                hitSlop={8}
                onPress={confirmClear}
                style={({ pressed }) => [
                  styles.clearButton,
                  { opacity: pressed ? 0.5 : 1 },
                ]}
              >
                <Ionicons
                  color={colors.mutedForeground}
                  name="trash-outline"
                  size={19}
                />
              </Pressable>
            ) : null}
          </View>
        </View>

        <AiLiveError errorCode={errorCode} onDismissError={dismissError} />

        <KeyboardGestureArea
          interpolator="ios"
          style={styles.flex}
          textInputNativeID={COMPOSER_NATIVE_ID}
        >
          <FlatList
            contentContainerStyle={[
              styles.messages,
              messages.length === 0 && styles.emptyMessages,
            ]}
            data={messages}
            keyExtractor={(message) => message.id}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <AiEmptyChat onSelectSuggestion={setDraft} />
            }
            onContentSizeChange={() => scrollToBottomIfPinned(messages.length > 1)}
            onScroll={handleScroll}
            ref={listRef}
            renderItem={renderMessage}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            style={styles.flex}
          />
        </KeyboardGestureArea>

        <AiChatComposer
          image={image}
          isModelSpeaking={isModelSpeaking}
          isRecording={isRecording}
          nativeID={COMPOSER_NATIVE_ID}
          onChangeText={setDraft}
          onChooseImage={() => void chooseFromLibrary()}
          onClearImage={clearImage}
          onSend={handleSend}
          onStopModelAudio={stopModelAudio}
          onTakePhoto={() => void takePhoto()}
          onToggleMic={toggleMic}
          status={status}
          text={draft}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 32,
  },
  emptyMessages: {
    flexGrow: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 10,
    minHeight: 68,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 2,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  messages: {
    paddingBottom: 12,
    paddingTop: 8,
  },
  safeArea: { flex: 1 },
  subtitle: {
    fontSize: 12,
    lineHeight: 19,
    marginTop: -1,
  },
  title: {
    fontSize: 19,
    lineHeight: 30,
  },
});
