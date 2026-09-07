import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useNavigation } from "expo-router";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
import { OfflineChatComposer } from "@/components/offline/offline-composer";
import { OfflineEmptyChat } from "@/components/offline/offline-empty-chat";
import { OfflineStatePanel } from "@/components/offline/offline-state-panel";
import {
  OfflineErrorBanner,
  OfflineStatusPill,
} from "@/components/offline/offline-status";
import { AppText } from "@/components/ui/app-text";
import { useOfflineLlm } from "@/hooks/use-offline-llm";
import { useOfflineModelStatus } from "@/hooks/use-offline-model-status";
import { useSpeechPlayback } from "@/hooks/use-speech-playback";
import useThemeManager from "@/hooks/use-theme-manager";
import {
  useLanguage,
  type TranslationKey,
} from "@/providers/language-provider";
import { useNetwork } from "@/providers/network-provider";
import { useProfile } from "@/providers/profile-provider";
import { describeFarmerForGemini } from "@/services/gemini/farmer-context";
import {
  formatOfflineSize,
  OFFLINE_MODEL_SIZE_FALLBACK_BYTES,
} from "@/services/offline-llm/config";
import { getOfflineModelDownloadBytes } from "@/services/offline-llm/runtime";
import type {
  OfflineChatMessage,
  OfflineLlmErrorCode,
} from "@/services/offline-llm/types";

const NEAR_BOTTOM_THRESHOLD = 80;
const COMPOSER_NATIVE_ID = "offline-chat-composer";

const ERROR_COPY: Record<OfflineLlmErrorCode, TranslationKey> = {
  download: "offlineErrorDownload",
  generate: "offlineErrorGenerate",
  interrupted: "offlineErrorInterrupted",
  load: "offlineErrorLoad",
  memory: "offlineErrorMemory",
  unknown: "offlineErrorUnknown",
  unsupported: "offlineErrorUnsupported",
};

export default function OfflineAdvisorScreen() {
  const { refresh, status, supported } = useOfflineModelStatus();
  const { t } = useLanguage();
  const { ensureOnline, isOffline } = useNetwork();
  const [engineKey, setEngineKey] = useState(0);
  const [wantsEngine, setWantsEngine] = useState(false);
  const [downloadBytes, setDownloadBytes] = useState<number | null>(null);
  const showEngine = supported && (wantsEngine || status === "downloaded");

  const startEngine = useCallback(() => {
    if (isOffline) {
      ensureOnline();
      return;
    }

    setWantsEngine(true);
  }, [ensureOnline, isOffline]);

  const retryEngine = useCallback(() => {
    setEngineKey((value) => value + 1);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (showEngine || isOffline || status !== "missing") {
      return;
    }

    let active = true;
    void getOfflineModelDownloadBytes().then((bytes) => {
      if (active) {
        setDownloadBytes(bytes);
      }
    });

    return () => {
      active = false;
    };
  }, [isOffline, showEngine, status]);

  if (!supported || status === "unsupported") {
    return (
      <ScreenShell>
        <OfflineStatePanel
          body={t("offlineUnsupportedDescription")}
          emoji="📵"
          title={t("offlineUnsupportedTitle")}
        />
      </ScreenShell>
    );
  }

  if (status === "checking" && !wantsEngine) {
    return (
      <ScreenShell>
        <OfflineStatePanel
          body={t("offlineCheckingDescription")}
          emoji="⏳"
          title={t("offlineCheckingTitle")}
        />
      </ScreenShell>
    );
  }

  if (!showEngine) {
    const size = formatOfflineSize(
      downloadBytes ?? OFFLINE_MODEL_SIZE_FALLBACK_BYTES,
    );

    return (
      <ScreenShell>
        <OfflineStatePanel
          body={
            isOffline
              ? t("offlineDownloadOffline")
              : `${t("offlineDownloadDescription", { size })}\n\n${t("offlineDownloadWifi")}`
          }
          emoji="🌾"
          primaryAction={{
            label: isOffline
              ? t("offlineDownloadOfflineAction")
              : t("offlineDownloadAction"),
            onPress: startEngine,
          }}
          title={t("offlineDownloadTitle")}
        />
      </ScreenShell>
    );
  }

  return (
    <OfflineAdvisorEngine
      isModelCached={status === "downloaded"}
      key={engineKey}
      onRetry={retryEngine}
    />
  );
}

function OfflineAdvisorEngine({
  isModelCached,
  onRetry,
}: {
  isModelCached: boolean;
  onRetry: () => void;
}) {
  const { colors } = useThemeManager();
  const { language, t } = useLanguage();
  const { isOffline } = useNetwork();
  const { profile } = useProfile();
  const navigation = useNavigation();
  const farmerContext = describeFarmerForGemini(profile);
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList<OfflineChatMessage>>(null);
  const isNearBottomRef = useRef(true);
  const generatingRef = useRef(false);
  const leavingRef = useRef(false);
  const leaveAlertOpenRef = useRef(false);
  const {
    clearMessages,
    dismissError,
    downloadProgress,
    errorCode,
    interrupt,
    isGenerating,
    isReady,
    loadError,
    messages,
    phase,
    sendMessage,
  } = useOfflineLlm({ farmerContext, isModelCached, language });
  const { speakingId, stop: stopSpeech, toggle: toggleSpeech } =
    useSpeechPlayback();

  useLayoutEffect(() => {
    generatingRef.current = isGenerating;
  }, [isGenerating]);

  const confirmClear = useCallback(() => {
    Alert.alert(t("aiClearChat"), t("offlineClearConfirm"), [
      { style: "cancel", text: t("aiCancel") },
      {
        onPress: () => {
          void stopSpeech();
          clearMessages();
        },
        style: "destructive",
        text: t("aiClearChat"),
      },
    ]);
  }, [clearMessages, stopSpeech, t]);

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
      void stopSpeech();
      void sendMessage(text);
    },
    [sendMessage, stopSpeech],
  );

  const handleSpeakPress = useCallback(
    (message: OfflineChatMessage) => {
      void toggleSpeech(message.id, message.text);
    },
    [toggleSpeech],
  );

  useEffect(() => {
    if (
      speakingId &&
      !messages.some(
        (message) =>
          message.id === speakingId &&
          message.role === "model" &&
          !message.isStreaming &&
          message.text.trim(),
      )
    ) {
      void stopSpeech();
    }
  }, [messages, speakingId, stopSpeech]);

  useEffect(() => {
    const show = KeyboardEvents.addListener("keyboardDidShow", () => {
      if (!isNearBottomRef.current) return;
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    });

    return () => show.remove();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (event) => {
      if (isGenerating) {
        event.preventDefault();
        if (leavingRef.current) {
          return;
        }

        leavingRef.current = true;
        interrupt();

        const startedAt = Date.now();
        const waitToLeave = () => {
          if (!generatingRef.current || Date.now() - startedAt > 8_000) {
            navigation.dispatch(event.data.action);
            return;
          }

          requestAnimationFrame(waitToLeave);
        };

        waitToLeave();
        return;
      }

      if (phase === "downloading" || phase === "loading") {
        event.preventDefault();
        if (leaveAlertOpenRef.current) {
          return;
        }

        leaveAlertOpenRef.current = true;
        Alert.alert(
          t(
            phase === "loading"
              ? "offlineLeaveLoadTitle"
              : "offlineLeaveDownloadTitle",
          ),
          t(
            phase === "loading"
              ? "offlineLeaveLoadDescription"
              : "offlineLeaveDownloadDescription",
          ),
          [
            {
              onPress: () => {
                leaveAlertOpenRef.current = false;
              },
              style: "cancel",
              text: t("offlineLeaveStay"),
            },
            {
              onPress: () => {
                leaveAlertOpenRef.current = false;
                navigation.dispatch(event.data.action);
              },
              style: "destructive",
              text: t("offlineLeaveAnyway"),
            },
          ],
        );
      }
    });

    return unsubscribe;
  }, [interrupt, isGenerating, navigation, phase, t]);

  if (loadError) {
    return (
      <ScreenShell>
        <OfflineStatePanel
          body={t(ERROR_COPY[loadError])}
          emoji={loadError === "memory" ? "🧠" : "📡"}
          primaryAction={{
            label: t("offlineRetry"),
            onPress: onRetry,
          }}
          title={t("offlineErrorTitle")}
        />
      </ScreenShell>
    );
  }

  if (!isReady) {
    const downloading = phase === "downloading";
    return (
      <ScreenShell>
        <OfflineStatePanel
          body={
            downloading
              ? `${t("offlineDownloadingDescription")}\n\n${t("offlineStayOpen")}`
              : t("offlineLoadingDescription")
          }
          emoji={downloading ? "⬇️" : "📦"}
          progress={downloading ? downloadProgress : undefined}
          title={
            downloading
              ? t("offlineDownloadingTitle")
              : t("offlineLoadingTitle")
          }
        />
      </ScreenShell>
    );
  }

  return (
    <SafeAreaView
      edges={{ bottom: true, top: false }}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        automaticOffset
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 40}
        style={styles.flex}
      >
        <View style={[styles.header, { borderColor: colors.border }]}>
          <View style={styles.headerCopy}>
            <AppText
              numberOfLines={1}
              style={[styles.subtitle, { color: colors.mutedForeground }]}
            >
              {isOffline ? t("offlineReadyOffline") : t("offlineReadyOnline")}
            </AppText>
          </View>

          <View style={styles.headerActions}>
            <OfflineStatusPill phase={phase} />
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

        {errorCode && errorCode !== loadError ? (
          <OfflineErrorBanner
            message={t(ERROR_COPY[errorCode])}
            onDismiss={dismissError}
          />
        ) : null}

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
            extraData={speakingId}
            keyExtractor={(message) => message.id}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <OfflineEmptyChat onSelectSuggestion={setDraft} />
            }
            onContentSizeChange={() =>
              scrollToBottomIfPinned(messages.length > 1)
            }
            onScroll={handleScroll}
            ref={listRef}
            renderItem={({ item }) => (
              <AiChatBubble
                isSpeaking={speakingId === item.id}
                message={item}
                onSpeakPress={
                  item.role === "model"
                    ? () => handleSpeakPress(item)
                    : undefined
                }
              />
            )}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            style={styles.flex}
          />
        </KeyboardGestureArea>

        <OfflineChatComposer
          disabled={!isReady}
          isGenerating={isGenerating}
          nativeID={COMPOSER_NATIVE_ID}
          onChangeText={setDraft}
          onSend={handleSend}
          onStop={interrupt}
          text={draft}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ScreenShell({ children }: { children: ReactNode }) {
  const { colors } = useThemeManager();

  return (
    <SafeAreaView
      edges={{ bottom: true, top: false }}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {children}
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
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  },
});
