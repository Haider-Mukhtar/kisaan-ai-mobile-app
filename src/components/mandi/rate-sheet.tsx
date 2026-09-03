import { Ionicons } from "@react-native-vector-icons/ionicons";
import * as Speech from "expo-speech";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MandiCropImage } from "@/components/mandi/crop-image";
import {
  CITY_LABELS,
  formatPrice,
  formatPriceRange,
  formatUnit,
  getTrendAppearance,
} from "@/components/mandi/format";
import {
  buildMandiSpeechText,
  pickSpeechVoice,
  SPEECH_LANGUAGE,
} from "@/components/mandi/speech";
import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import { useNetwork } from "@/providers/network-provider";
import {
  readCachedMandiRates,
  writeCachedMandiRates,
} from "@/services/mandi/device-cache";
import { fetchMandiRates } from "@/services/mandi/fetch-mandi-rates";
import {
  findRememberedMandiRate,
  getRememberedMandiSnapshot,
  rememberMandiSnapshot,
} from "@/services/mandi/memory";
import { MANDI_CITIES, type MandiRate } from "@/services/mandi/types";
import { showErrorToast } from "@/utils/toast";

type SheetStatus = "loading" | "ready" | "missing" | "error";

function readParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

function closeSheet() {
  void Speech.stop();

  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace("/mandi");
}

export function MandiRateSheet({ id: rawId }: { id: string | string[] | undefined }) {
  const { colors } = useThemeManager();
  const { language, t } = useLanguage();
  const { isOffline } = useNetwork();
  const insets = useSafeAreaInsets();
  const id = readParam(rawId);

  const [rate, setRate] = useState<MandiRate | null>(() => findRememberedMandiRate(id));
  const [sourceUpdatedAt, setSourceUpdatedAt] = useState(
    () => getRememberedMandiSnapshot()?.sourceUpdatedAt ?? null,
  );
  const [status, setStatus] = useState<SheetStatus>(() =>
    !id ? "missing" : findRememberedMandiRate(id) ? "ready" : "loading",
  );
  const [isSpeaking, setIsSpeaking] = useState(false);

  const loadRate = useCallback(async () => {
    if (!id) {
      setRate(null);
      setStatus("missing");
      return;
    }

    const remembered = findRememberedMandiRate(id);
    if (remembered) {
      setRate(remembered);
      setSourceUpdatedAt(getRememberedMandiSnapshot()?.sourceUpdatedAt ?? null);
      setStatus("ready");
      return;
    }

    setRate(null);
    setStatus("loading");

    try {
      const cached = await readCachedMandiRates();
      const cachedRate = cached?.rates.find((item) => item.id === id);

      if (cachedRate && cached) {
        setRate(cachedRate);
        setSourceUpdatedAt(cached.sourceUpdatedAt);
        setStatus("ready");
        return;
      }

      if (isOffline) {
        setRate(null);
        setStatus("error");
        return;
      }

      const live = await fetchMandiRates();
      rememberMandiSnapshot(live);
      await writeCachedMandiRates(live);

      const liveRate = live.rates.find((item) => item.id === id);
      setRate(liveRate ?? null);
      setSourceUpdatedAt(live.sourceUpdatedAt);
      setStatus(liveRate ? "ready" : "missing");
    } catch {
      setRate(null);
      setStatus("error");
    }
  }, [id, isOffline]);

  useEffect(() => {
    // Use an IIFE inside useEffect to avoid calling setState synchronously
    (async () => {
      await loadRate();
    })();
  }, [loadRate]);

  useEffect(() => {
    return () => {
      void Speech.stop();
    };
  }, []);

  useEffect(() => {
    void Speech.stop();
    setIsSpeaking(false);
  }, [language]);

  const stopSpeech = useCallback(async () => {
    await Speech.stop();
    setIsSpeaking(false);
  }, []);

  const speakRate = useCallback(async () => {
    if (!rate) return;

    if (isSpeaking || (await Speech.isSpeakingAsync())) {
      await stopSpeech();
      return;
    }

    const text = buildMandiSpeechText(rate, language, t).trim();
    if (!text) return;

    const voice = await pickSpeechVoice(language);

    setIsSpeaking(true);

    Speech.speak(text, {
      language: SPEECH_LANGUAGE[language],
      pitch: 1,
      rate: language === "ur" ? 0.88 : 0.94,
      useApplicationAudioSession: false,
      voice: voice?.identifier,
      onDone: () => setIsSpeaking(false),
      onError: () => {
        setIsSpeaking(false);
        showErrorToast(t("mandiSpeakErrorTitle"), t("mandiSpeakErrorDescription"));
      },
      onStart: () => setIsSpeaking(true),
      onStopped: () => setIsSpeaking(false),
    });
  }, [isSpeaking, language, rate, stopSpeech, t]);

  const availableCities = useMemo(
    () => (rate ? MANDI_CITIES.filter((city) => rate.cityRates[city]) : []),
    [rate],
  );

  return (
    <View style={[styles.sheet, { backgroundColor: colors.card }]}>
      {Platform.OS === "android" ? (
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
      ) : null}

      <View style={styles.topBar}>
        <View style={styles.topBarCopy}>
          <AppText variant="title" style={[styles.sheetTitle, { color: colors.foreground }]}>
            {t("mandiDetailTitle")}
          </AppText>
        </View>
        <Pressable
          accessibilityLabel={t("mandiDetailClose")}
          accessibilityRole="button"
          hitSlop={8}
          onPress={closeSheet}
          style={({ pressed }) => [
            styles.closeButton,
            { backgroundColor: colors.muted },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons color={colors.foreground} name="close" size={18} />
        </Pressable>
      </View>

      {status === "loading" ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primaryDark} size="large" />
          <AppText style={[styles.stateBody, { color: colors.mutedForeground }]}>
            {t("mandiLoading")}
          </AppText>
        </View>
      ) : null}

      {status === "error" ? (
        <View style={styles.centerState}>
          <AppText style={styles.stateEmoji}>📈</AppText>
          <AppText variant="title" style={[styles.stateTitle, { color: colors.foreground }]}>
            {t("mandiDetailLoadErrorTitle")}
          </AppText>
          <AppText style={[styles.stateBody, { color: colors.mutedForeground }]}>
            {isOffline ? t("mandiDetailLoadErrorOffline") : t("mandiDetailLoadErrorDescription")}
          </AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadRate()}
            style={({ pressed }) => [
              styles.retryButton,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}
          >
            <AppText variant="label" style={{ color: colors.primaryForeground }}>
              {t("mandiRetry")}
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {status === "missing" ? (
        <View style={styles.centerState}>
          <AppText style={styles.stateEmoji}>🌾</AppText>
          <AppText variant="title" style={[styles.stateTitle, { color: colors.foreground }]}>
            {t("mandiDetailNotFoundTitle")}
          </AppText>
          <AppText style={[styles.stateBody, { color: colors.mutedForeground }]}>
            {t("mandiDetailNotFoundDescription")}
          </AppText>
          <Pressable
            accessibilityRole="button"
            onPress={closeSheet}
            style={({ pressed }) => [
              styles.retryButton,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}
          >
            <AppText variant="label" style={{ color: colors.primaryForeground }}>
              {t("mandiDetailClose")}
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {status === "ready" && rate ? (
        <ScrollView
          bounces={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 20) + 12 },
          ]}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <View style={styles.cropRow}>
            <MandiCropImage name={rate.name} size={76} uri={rate.imageUrl} />
            <View style={styles.cropNames}>
              <AppText
                selectable
                variant="label"
                style={[styles.cropName, styles.ltrText, { color: colors.foreground }]}
              >
                {rate.name}
              </AppText>
              {rate.urdu ? (
                <AppText
                  selectable
                  style={[styles.urduName, styles.rtlText, { color: colors.mutedForeground }]}
                >
                  {rate.urdu}
                </AppText>
              ) : null}
            </View>
          </View>

          <Pressable
            accessibilityLabel={isSpeaking ? t("mandiSpeakStop") : t("mandiSpeak")}
            accessibilityRole="button"
            onPress={() => void speakRate()}
            style={({ pressed }) => [
              styles.speakButton,
              { backgroundColor: isSpeaking ? colors.muted : colors.primary },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              color={isSpeaking ? colors.foreground : colors.primaryForeground}
              name={isSpeaking ? "stop" : "volume-high"}
              size={20}
            />
            <AppText
              variant="label"
              style={{ color: isSpeaking ? colors.foreground : colors.primaryForeground }}
            >
              {isSpeaking ? t("mandiSpeakStop") : t("mandiSpeak")}
            </AppText>
          </Pressable>

          <AverageCard rate={rate} />

          <AppText variant="label" style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("mandiDetailCityPrices")}
          </AppText>

          {availableCities.length === 0 ? (
            <View style={[styles.emptyCities, { backgroundColor: colors.muted }]}>
              <AppText style={[styles.emptyCitiesText, { color: colors.mutedForeground }]}>
                {t("mandiDetailNoCities")}
              </AppText>
            </View>
          ) : (
            <View style={[styles.cityList, { borderTopColor: colors.border }]}>
              {MANDI_CITIES.map((city) => {
                const cityRate = rate.cityRates[city];
                if (!cityRate) return null;

                return (
                  <View key={city} style={styles.cityRow}>
                    <AppText style={[styles.cityName, { color: colors.mutedForeground }]}>
                      {t(CITY_LABELS[city])}
                    </AppText>
                    <AppText
                      selectable
                      variant="label"
                      style={[styles.cityPrice, styles.ltrText, { color: colors.foreground }]}
                    >
                      {`${formatPriceRange(cityRate.min, cityRate.max, t)} ${formatUnit(rate.unit, t)}`}
                    </AppText>
                  </View>
                );
              })}
            </View>
          )}

          {sourceUpdatedAt ? (
            <View style={[styles.sourceRow, { backgroundColor: colors.muted }]}>
              <Ionicons color={colors.primaryDark} name="checkmark-circle" size={16} />
              <AppText selectable style={[styles.sourceText, { color: colors.mutedForeground }]}>
                {sourceUpdatedAt}
              </AppText>
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}

function AverageCard({ rate }: { rate: MandiRate }) {
  const { colors } = useThemeManager();
  const { t } = useLanguage();
  const trend = getTrendAppearance(rate.change, colors);

  return (
    <View style={[styles.averageCard, { backgroundColor: colors.muted }]}>
      <AppText style={[styles.averageLabel, { color: colors.mutedForeground }]}>
        {t("mandiDetailAverageLabel")}
      </AppText>
      <View style={styles.averageRow}>
        <AppText
          selectable
          variant="title"
          style={[styles.averageValue, styles.ltrText, { color: colors.foreground }]}
        >
          {formatPrice(rate.average, t)}
        </AppText>
        <AppText style={[styles.averageUnit, { color: colors.mutedForeground }]}>
          {formatUnit(rate.unit, t)}
        </AppText>
      </View>
      <AppText variant="label" style={[styles.averageTrend, styles.ltrText, { color: trend.color }]}>
        {rate.change === 0
          ? `${trend.marker} ${t("mandiChangeNone")}`
          : `${trend.marker} ${trend.text}`}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  handle: {
    alignSelf: "center",
    borderRadius: 2,
    height: 4,
    marginTop: 8,
    width: 40,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 14,
  },
  topBarCopy: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 22,
    lineHeight: 34,
  },
  closeButton: {
    alignItems: "center",
    borderRadius: 17,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  content: {
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cropRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  cropNames: {
    flex: 1,
    minWidth: 0,
  },
  cropName: {
    fontSize: 20,
    lineHeight: 28,
  },
  urduName: {
    fontSize: 16,
    lineHeight: 28,
    marginTop: 2,
  },
  speakButton: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  averageCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  averageLabel: {
    fontSize: 13,
    lineHeight: 20,
  },
  averageRow: {
    alignItems: "baseline",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  averageValue: {
    fontSize: 28,
    lineHeight: 36,
  },
  averageUnit: {
    fontSize: 14,
    lineHeight: 22,
  },
  averageTrend: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 15,
    lineHeight: 24,
  },
  emptyCities: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  emptyCitiesText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  cityList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 7,
    paddingTop: 11,
  },
  cityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  cityName: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
  },
  cityPrice: {
    fontSize: 12,
    lineHeight: 19,
  },
  sourceRow: {
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  sourceText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 20,
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  stateEmoji: {
    fontSize: 38,
  },
  stateTitle: {
    fontSize: 21,
    lineHeight: 34,
    textAlign: "center",
  },
  stateBody: {
    fontSize: 14,
    lineHeight: 23,
    textAlign: "center",
  },
  retryButton: {
    borderRadius: 16,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  ltrText: {
    textAlign: "left",
    writingDirection: "ltr",
  },
  rtlText: {
    textAlign: "left",
    writingDirection: "rtl",
  },
  pressed: {
    opacity: 0.65,
  },
});
