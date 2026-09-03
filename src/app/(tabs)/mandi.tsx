import { Ionicons } from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-screens/experimental";

import { MandiCropImage } from "@/components/mandi/crop-image";
import {
  formatPrice,
  formatUnit,
  getTrendAppearance,
} from "@/components/mandi/format";
import { AppText } from "@/components/ui/app-text";
import { AppTextInput } from "@/components/ui/app-text-input";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import { useNetwork } from "@/providers/network-provider";
import {
  readCachedMandiRates,
  writeCachedMandiRates,
} from "@/services/mandi/device-cache";
import { fetchMandiRates } from "@/services/mandi/fetch-mandi-rates";
import { rememberMandiSnapshot } from "@/services/mandi/memory";
import type { MandiRate, MandiSnapshot } from "@/services/mandi/types";

export default function MandiScreen() {
  const { colors } = useThemeManager();
  const { isOffline } = useNetwork();
  const { t } = useLanguage();
  const [snapshot, setSnapshot] = useState<MandiSnapshot | null>(null);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showingSaved, setShowingSaved] = useState(false);
  const snapshotRef = useRef<MandiSnapshot | null>(null);

  const commitSnapshot = useCallback((next: MandiSnapshot) => {
    rememberMandiSnapshot(next);
    snapshotRef.current = next;
    setSnapshot(next);
  }, []);

  const loadRates = useCallback(
    async ({ refresh = false }: { refresh?: boolean } = {}) => {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      setHasError(false);

      try {
        const cached = refresh ? null : await readCachedMandiRates();

        if (cached) {
          commitSnapshot(cached);
          setShowingSaved(true);
          setIsLoading(false);
        }

        if (isOffline) {
          if (!cached && !snapshotRef.current) setHasError(true);
          return;
        }

        const live = await fetchMandiRates();
        commitSnapshot(live);
        setShowingSaved(false);
        await writeCachedMandiRates(live);
      } catch {
        setHasError(!snapshotRef.current);
        setShowingSaved(Boolean(snapshotRef.current));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [commitSnapshot, isOffline],
  );

  useEffect(() => {
    const task = setTimeout(() => void loadRates(), 0);

    return () => clearTimeout(task);
  }, [loadRates]);

  const filteredRates = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return snapshot?.rates ?? [];

    return (snapshot?.rates ?? []).filter((rate) =>
      `${rate.name} ${rate.urdu}`.toLocaleLowerCase().includes(normalized),
    );
  }, [query, snapshot]);

  if (isLoading && !snapshot) {
    return (
      <ScreenFrame>
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primaryDark} size="large" />
          <AppText style={[styles.stateBody, { color: colors.mutedForeground }]}>
            {t("mandiLoading")}
          </AppText>
        </View>
      </ScreenFrame>
    );
  }

  if (hasError && !snapshot) {
    return (
      <ScreenFrame>
        <View style={styles.centerState}>
          <AppText style={styles.stateEmoji}>📈</AppText>
          <AppText variant="title" style={[styles.stateTitle, { color: colors.foreground }]}>
            {t("mandiErrorTitle")}
          </AppText>
          <AppText style={[styles.stateBody, { color: colors.mutedForeground }]}>
            {isOffline ? t("mandiErrorOffline") : t("mandiErrorDescription")}
          </AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadRates({ refresh: true })}
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
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.titleRow}>
          <View style={styles.headerCopy}>
            <AppText variant="title" style={[styles.title, { color: colors.foreground }]}>
              {t("mandiTitle")}
            </AppText>
            <AppText style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {t("mandiDescription")}
            </AppText>
          </View>
          <View style={[styles.countPill, { backgroundColor: colors.primary }]}>
            <AppText variant="label" style={{ color: colors.primaryForeground }}>
              {t("mandiCropCount", { count: snapshot?.rates.length ?? 0 })}
            </AppText>
          </View>
        </View>

        {snapshot?.sourceUpdatedAt ? (
          <View style={[styles.sourceRow, { backgroundColor: colors.muted }]}>
            <Ionicons color={colors.primaryDark} name="checkmark-circle" size={17} />
            <AppText selectable style={[styles.sourceText, { color: colors.mutedForeground }]}>
              {snapshot.sourceUpdatedAt}
            </AppText>
          </View>
        ) : null}

        {showingSaved ? (
          <AppText style={[styles.savedNotice, { color: colors.warning }]}>
            {t("mandiSavedNotice")}
          </AppText>
        ) : null}

        <AppTextInput
          accessibilityLabel={t("mandiSearchPlaceholder")}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder={t("mandiSearchPlaceholder")}
          returnKeyType="search"
          value={query}
        />
      </View>

      <FlatList
        contentContainerStyle={[
          styles.listContent,
          filteredRates.length === 0 && styles.listEmptyContent,
        ]}
        contentInsetAdjustmentBehavior="automatic"
        data={filteredRates}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptySearch}>
            <AppText style={styles.stateEmoji}>🌾</AppText>
            <AppText variant="label" style={{ color: colors.foreground }}>
              {t("mandiNoResults")}
            </AppText>
          </View>
        }
        refreshControl={
          <RefreshControl
            colors={[colors.primaryDark]}
            onRefresh={() => void loadRates({ refresh: true })}
            refreshing={isRefreshing}
            tintColor={colors.primaryDark}
          />
        }
        renderItem={({ item }) => <MandiRateCard rate={item} />}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </ScreenFrame>
  );
}

function ScreenFrame({ children }: { children: React.ReactNode }) {
  const { colors } = useThemeManager();
  const { isOffline } = useNetwork();

  return (
    <SafeAreaView
      collapsable={false}
      edges={{ top: !isOffline }}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {children}
    </SafeAreaView>
  );
}

function MandiRateCard({ rate }: { rate: MandiRate }) {
  const { colors } = useThemeManager();
  const { isRTL, t } = useLanguage();
  const trend = getTrendAppearance(rate.change, colors);

  const openDetails = () => {
    router.push({
      pathname: "/mandi-rate/[id]",
      params: { id: rate.id },
    });
  };

  return (
    <Pressable
      accessibilityHint={t("mandiOpenCrop", { name: rate.name })}
      accessibilityLabel={rate.urdu ? `${rate.name}, ${rate.urdu}` : rate.name}
      accessibilityRole="button"
      onPress={openDetails}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardHeader}>
        <MandiCropImage name={rate.name} size={56} uri={rate.imageUrl} />

        <View style={styles.cropNames}>
          <AppText
            numberOfLines={2}
            variant="label"
            style={[styles.cropName, styles.ltrText, { color: colors.foreground }]}
          >
            {rate.name}
          </AppText>
          {rate.urdu ? (
            <AppText
              numberOfLines={1}
              style={[styles.urduName, styles.rtlText, { color: colors.mutedForeground }]}
            >
              {rate.urdu}
            </AppText>
          ) : null}
        </View>

        <View style={styles.priceBlock}>
          <AppText variant="label" style={[styles.average, styles.ltrText, { color: colors.foreground }]}>
            {formatPrice(rate.average, t)}
          </AppText>
          <AppText style={[styles.unit, styles.ltrText, { color: colors.mutedForeground }]}>
            {formatUnit(rate.unit, t)}
          </AppText>
          <AppText variant="label" style={[styles.trend, styles.ltrText, { color: trend.color }]}>
            {`${trend.marker} ${trend.text}`}
          </AppText>
        </View>

        <Ionicons
          color={colors.mutedForeground}
          name={isRTL ? "chevron-back" : "chevron-forward"}
          size={18}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { gap: 14, paddingBottom: 12, paddingHorizontal: 16, paddingTop: 12 },
  list: { flex: 1 },
  listContent: { gap: 12, paddingBottom: 32, paddingHorizontal: 16, paddingTop: 4 },
  listEmptyContent: { flexGrow: 1 },
  titleRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  headerCopy: { flex: 1 },
  title: { fontSize: 26, lineHeight: 42 },
  subtitle: { fontSize: 14, lineHeight: 23 },
  countPill: { borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  sourceRow: { alignItems: "center", borderRadius: 14, flexDirection: "row", gap: 7, paddingHorizontal: 12, paddingVertical: 9 },
  sourceText: { flex: 1, fontSize: 12, lineHeight: 20 },
  savedNotice: { fontSize: 13, lineHeight: 21 },
  card: { borderRadius: 20, borderWidth: 1, padding: 14 },
  cardPressed: { opacity: 0.82 },
  cardHeader: { alignItems: "center", flexDirection: "row", gap: 11 },
  cropNames: { flex: 1, minWidth: 0 },
  cropName: { fontSize: 15, lineHeight: 22 },
  urduName: { fontSize: 14, lineHeight: 24 },
  priceBlock: { alignItems: "flex-end" },
  average: { fontSize: 16, lineHeight: 23 },
  unit: { fontSize: 11, lineHeight: 16 },
  trend: { fontSize: 12, lineHeight: 18, marginTop: 2 },
  ltrText: { textAlign: "left", writingDirection: "ltr" },
  rtlText: { textAlign: "left", writingDirection: "rtl" },
  centerState: { alignItems: "center", flex: 1, gap: 10, justifyContent: "center", paddingHorizontal: 32 },
  stateEmoji: { fontSize: 38 },
  stateTitle: { fontSize: 21, lineHeight: 34, textAlign: "center" },
  stateBody: { fontSize: 14, lineHeight: 23, textAlign: "center" },
  retryButton: { borderRadius: 16, marginTop: 8, paddingHorizontal: 18, paddingVertical: 12 },
  emptySearch: { alignItems: "center", flexGrow: 1, gap: 8, justifyContent: "center", paddingVertical: 48 },
  pressed: { opacity: 0.65 },
});
