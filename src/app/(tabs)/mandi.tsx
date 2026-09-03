import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Image } from "expo-image";
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

import { AppText } from "@/components/ui/app-text";
import { AppTextInput } from "@/components/ui/app-text-input";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage, type TranslationKey } from "@/providers/language-provider";
import { useNetwork } from "@/providers/network-provider";
import {
  readCachedMandiRates,
  writeCachedMandiRates,
} from "@/services/mandi/device-cache";
import { fetchMandiRates } from "@/services/mandi/fetch-mandi-rates";
import {
  MANDI_CITIES,
  type MandiCity,
  type MandiRate,
  type MandiSnapshot,
} from "@/services/mandi/types";

const CITY_LABELS: Record<MandiCity, TranslationKey> = {
  lahore: "mandiCityLahore",
  karachi: "mandiCityKarachi",
  multan: "mandiCityMultan",
  islamabad: "mandiCityIslamabad",
};

const NUMBER_FORMATTER = new Intl.NumberFormat("en-PK", {
  maximumFractionDigits: 1,
});

function formatNumber(value: number) {
  return NUMBER_FORMATTER.format(value);
}

function formatUnit(unit: string) {
  if (unit.toLowerCase() === "dozen") return "/dozen";
  return `/${unit.toLowerCase()}`;
}

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
      <FlatList
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="automatic"
        data={filteredRates}
        keyboardDismissMode="on-drag"
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptySearch}>
            <AppText style={styles.stateEmoji}>🌾</AppText>
            <AppText variant="label" style={{ color: colors.foreground }}>
              {t("mandiNoResults")}
            </AppText>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.header}>
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
      />
    </ScreenFrame>
  );
}

function ScreenFrame({ children }: { children: React.ReactNode }) {
  const { colors } = useThemeManager();
  const { isOffline } = useNetwork();

  return (
    <SafeAreaView
      edges={{ bottom: true, top: !isOffline }}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {children}
    </SafeAreaView>
  );
}

function MandiRateCard({ rate }: { rate: MandiRate }) {
  const { colors } = useThemeManager();
  const { t } = useLanguage();
  const isUp = rate.change > 0;
  const isDown = rate.change < 0;
  const trendColor = isUp ? colors.success : isDown ? colors.red : colors.mutedForeground;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.imageFrame, { backgroundColor: colors.muted }]}>
          {rate.imageUrl ? (
            <Image
              accessibilityLabel={rate.name}
              contentFit="cover"
              source={{ uri: rate.imageUrl }}
              style={styles.cropImage}
              transition={150}
            />
          ) : (
            <AppText style={styles.imageFallback}>🌾</AppText>
          )}
        </View>

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

        <View style={styles.priceBlock}>
          <AppText selectable variant="label" style={[styles.average, styles.ltrText, { color: colors.foreground }]}>
            {`Rs ${formatNumber(rate.average)}`}
          </AppText>
          <AppText style={[styles.unit, styles.ltrText, { color: colors.mutedForeground }]}>
            {formatUnit(rate.unit)}
          </AppText>
          <AppText variant="label" style={[styles.trend, styles.ltrText, { color: trendColor }]}>
            {isUp ? "▲ " : isDown ? "▼ " : "— "}
            {`${rate.change > 0 ? "+" : ""}${formatNumber(rate.change)}%`}
          </AppText>
        </View>
      </View>

      <View style={[styles.cityList, { borderTopColor: colors.border }]}>
        {MANDI_CITIES.map((city) => {
          const cityRate = rate.cityRates[city];
          if (!cityRate) return null;

          return (
            <View key={city} style={styles.cityRow}>
              <AppText style={[styles.cityName, { color: colors.mutedForeground }]}>
                {t(CITY_LABELS[city])}
              </AppText>
              <AppText selectable variant="label" style={[styles.cityPrice, styles.ltrText, { color: colors.foreground }]}>
                {`Rs ${formatNumber(cityRate.min)}–${formatNumber(cityRate.max)} ${formatUnit(rate.unit)}`}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  listContent: { gap: 12, paddingBottom: 32, paddingHorizontal: 16 },
  header: { gap: 14, paddingBottom: 4, paddingTop: 12 },
  titleRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  headerCopy: { flex: 1 },
  title: { fontSize: 26, lineHeight: 42 },
  subtitle: { fontSize: 14, lineHeight: 23 },
  countPill: { borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  sourceRow: { alignItems: "center", borderRadius: 14, flexDirection: "row", gap: 7, paddingHorizontal: 12, paddingVertical: 9 },
  sourceText: { flex: 1, fontSize: 12, lineHeight: 20 },
  savedNotice: { fontSize: 13, lineHeight: 21 },
  card: { borderRadius: 20, borderWidth: 1, direction: "ltr", padding: 14 },
  cardHeader: { alignItems: "center", flexDirection: "row", gap: 11 },
  imageFrame: { alignItems: "center", borderRadius: 15, height: 56, justifyContent: "center", overflow: "hidden", width: 56 },
  cropImage: { height: "100%", width: "100%" },
  imageFallback: { fontSize: 25 },
  cropNames: { flex: 1, minWidth: 0 },
  cropName: { fontSize: 15, lineHeight: 22 },
  urduName: { fontSize: 14, lineHeight: 24 },
  priceBlock: { alignItems: "flex-end" },
  average: { fontSize: 16, lineHeight: 23 },
  unit: { fontSize: 11, lineHeight: 16 },
  trend: { fontSize: 12, lineHeight: 18, marginTop: 2 },
  cityList: { borderTopWidth: StyleSheet.hairlineWidth, gap: 7, marginTop: 12, paddingTop: 11 },
  cityRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  cityName: { flex: 1, fontSize: 12, lineHeight: 19 },
  cityPrice: { fontSize: 12, lineHeight: 19 },
  ltrText: { textAlign: "left", writingDirection: "ltr" },
  rtlText: { textAlign: "left", writingDirection: "rtl" },
  centerState: { alignItems: "center", flex: 1, gap: 10, justifyContent: "center", paddingHorizontal: 32 },
  stateEmoji: { fontSize: 38 },
  stateTitle: { fontSize: 21, lineHeight: 34, textAlign: "center" },
  stateBody: { fontSize: 14, lineHeight: 23, textAlign: "center" },
  retryButton: { borderRadius: 16, marginTop: 8, paddingHorizontal: 18, paddingVertical: 12 },
  emptySearch: { alignItems: "center", gap: 8, paddingVertical: 48 },
  pressed: { opacity: 0.65 },
});
