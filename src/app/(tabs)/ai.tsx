import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-screens/experimental";

import { AiChatBubble } from "@/components/ai/chat-bubble";
import { AiChatComposer } from "@/components/ai/chat-composer";
import { AiEmptyChat } from "@/components/ai/empty-chat";
import { AiLiveStatus } from "@/components/ai/live-status";
import { AppText } from "@/components/ui/app-text";
import { useGeminiLiveChat } from "@/hooks/use-gemini-live-chat";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import { useNetwork } from "@/providers/network-provider";
import type { GeminiChatMessage } from "@/services/gemini/types";

export default function AiScreen() {
  const { colors } = useThemeManager();
  const { t } = useLanguage();
  const { isOffline } = useNetwork();
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList<GeminiChatMessage>>(null);
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

  return (
    <SafeAreaView
      edges={{ bottom: true, top: !isOffline }}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled
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

        <AiLiveStatus
          errorCode={errorCode}
          onDismissError={dismissError}
          onRetry={reconnect}
          status={status}
        />

        <FlatList
          contentContainerStyle={[
            styles.messages,
            messages.length === 0 && styles.emptyMessages,
          ]}
          data={messages}
          keyExtractor={(message) => message.id}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <AiEmptyChat onSelectSuggestion={setDraft} />
          }
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: messages.length > 1 })
          }
          ref={listRef}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
        />

        <AiChatComposer
          image={image}
          isModelSpeaking={isModelSpeaking}
          isRecording={isRecording}
          onChangeText={setDraft}
          onChooseImage={() => void chooseFromLibrary()}
          onClearImage={clearImage}
          onSend={sendMessage}
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
  headerCopy: {
    flex: 1,
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
