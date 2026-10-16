import { Ionicons } from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useState, type ComponentProps, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-screens/experimental";

import {
  PreferenceSelector,
  type PreferenceOption,
} from "@/components/profile/preference-selector";
import { AppText } from "@/components/ui/app-text";
import { getDistrict, getDistrictName } from "@/constants/districts";
import { getCropLabelKey } from "@/constants/crops";
import { Fonts } from "@/constants/theme";
import useThemeManager from "@/hooks/use-theme-manager";
import { useAuth } from "@/providers/auth-provider";
import {
  useLanguage,
  type LanguageCode,
} from "@/providers/language-provider";
import { useNetwork } from "@/providers/network-provider";
import { useOnboarding } from "@/providers/onboarding-provider";
import { useProfile } from "@/providers/profile-provider";
import type { ThemePreference } from "@/providers/theme-provider";
import { formatPakistaniMobile } from "@/utils/phone";

const LANGUAGE_OPTIONS: PreferenceOption<LanguageCode>[] = [
  {
    value: "en",
    label: "English",
    icon: "Aa",
    fontFamily: Fonts.interSemiBold,
    writingDirection: "ltr",
  },
  {
    value: "ur",
    label: "اردو",
    icon: "ا",
    fontFamily: Fonts.notoNastaliqUrdu,
    writingDirection: "rtl",
  },
];

export default function ProfileScreen() {
  const { colors, storedTheme, setTheme } = useThemeManager();
  const { language, setLanguage, t } = useLanguage();
  const { isBusy, signOut } = useAuth();
  const { isOffline } = useNetwork();
  const { resetOnboarding } = useOnboarding();
  const { profile } = useProfile();
  const [isResetting, setIsResetting] = useState(false);

  const district = getDistrict(profile?.location?.districtId);
  const districtName = district
    ? getDistrictName(district, language)
    : t("settingsNotProvided");
  const cropLabels =
    profile?.crops.map((crop) => {
      const labelKey = getCropLabelKey(crop);
      return labelKey ? t(labelKey) : crop;
    }) ?? [];
  const displayName = profile?.fullName || t("settingsNotProvided");
  const initial = profile?.fullName?.trim().charAt(0).toLocaleUpperCase() || "K";
  const phone = profile?.phone
    ? formatPakistaniMobile(profile.phone)
    : t("settingsNotProvided");
  const farmSize =
    profile?.farmSizeAcres !== null && profile?.farmSizeAcres !== undefined
      ? t("settingsAcres", { value: profile.farmSizeAcres })
      : t("settingsNotProvided");
  const themeOptions: PreferenceOption<ThemePreference>[] = [
    { value: "system", label: t("themeSystem"), icon: "◐" },
    { value: "light", label: t("themeLight"), icon: "☀" },
    { value: "dark", label: t("themeDark"), icon: "☾" },
  ];

  const handleResetOnboarding = async () => {
    if (isResetting) return;
    setIsResetting(true);
    await resetOnboarding();
  };

  return (
    <SafeAreaView
      collapsable={false}
      edges={{ top: !isOffline }}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppText
          variant="title"
          style={[styles.title, { color: colors.foreground }]}
        >
          {t("profileTitle")}
        </AppText>
        <AppText
          style={[styles.subtitle, { color: colors.mutedForeground }]}
        >
          {t("profileDescription")}
        </AppText>

        <ProfileIdentityCard
          displayName={displayName}
          initial={initial}
          isRTL={language === "ur"}
          onEdit={() => router.push("/edit-profile")}
          phone={phone}
          signedInLabel={t("profileSignedIn")}
          editLabel={t("editProfileAction")}
        />

        <FarmOverview
          city={profile?.city || t("settingsNotProvided")}
          cityLabel={t("settingsCity")}
          crops={cropLabels}
          cropsLabel={t("settingsCrops")}
          district={districtName}
          districtLabel={t("settingsDistrict")}
          farmSize={farmSize}
          farmSizeLabel={t("settingsFarmSize")}
          isRTL={language === "ur"}
          title={t("settingsFarmTitle")}
          village={profile?.village || t("settingsNotProvided")}
          villageLabel={t("settingsVillage")}
        />

        <Section title={t("profilePreferencesTitle")} padded>
          <PreferenceBlock title={t("languageTitle")}>
            <PreferenceSelector
              accessibilityLabel={t("profileLanguageAccessibility")}
              onChange={setLanguage}
              options={LANGUAGE_OPTIONS}
              value={language}
            />
          </PreferenceBlock>
          <View style={styles.preferenceGap} />
          <PreferenceBlock title={t("appearanceTitle")}>
            <PreferenceSelector
              accessibilityLabel={t("profileThemeAccessibility")}
              onChange={setTheme}
              options={themeOptions}
              value={storedTheme}
            />
          </PreferenceBlock>
        </Section>

        <AppText
          variant="label"
          style={[
            styles.sectionHeading,
            styles.actionsHeading,
            { color: colors.mutedForeground },
          ]}
        >
          {t("settingsActionsTitle")}
        </AppText>
        <ActionButton
          icon="📍"
          label={t("locationChangeTitle")}
          onPress={() => router.push("/change-location")}
        />
        <ActionButton
          disabled={isResetting}
          icon="↻"
          label={isResetting ? t("resettingOnboarding") : t("resetOnboarding")}
          onPress={() => void handleResetOnboarding()}
        />
        <ActionButton
          destructive
          disabled={isBusy}
          icon="↪"
          label={isBusy ? t("authSigningOut") : t("authSignOut")}
          onPress={() => void signOut()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileIdentityCard({
  displayName,
  editLabel,
  initial,
  isRTL,
  onEdit,
  phone,
  signedInLabel,
}: {
  displayName: string;
  editLabel: string;
  initial: string;
  isRTL: boolean;
  onEdit: () => void;
  phone: string;
  signedInLabel: string;
}) {
  const { colors, isDarkMode } = useThemeManager();
  const statusColor = isDarkMode ? colors.ring : colors.success;

  return (
    <View
      style={[
        styles.identityCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.identityMain, isRTL && styles.rowReverse]}>
        <View
          style={[
            styles.avatarRing,
            { backgroundColor: colors.muted, borderColor: colors.primary },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <AppText
              variant="title"
              style={[styles.avatarText, { color: colors.primaryForeground }]}
            >
              {initial}
            </AppText>
          </View>
        </View>

        <View style={styles.identityCopy}>
          <AppText
            numberOfLines={1}
            selectable
            variant="label"
            style={[styles.displayName, { color: colors.foreground }]}
          >
            {displayName}
          </AppText>
          <View style={[styles.phoneRow, isRTL && styles.rowReverse]}>
            <Ionicons
              color={colors.mutedForeground}
              name="call-outline"
              size={14}
            />
            <AppText
              numberOfLines={1}
              selectable
              style={[styles.phone, { color: colors.mutedForeground }]}
            >
              {phone}
            </AppText>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onEdit}
          style={({ pressed }) => [
            styles.editButton,
            { backgroundColor: colors.muted },
            isRTL && styles.rowReverse,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            color={colors.primaryForeground}
            name="pencil-outline"
            size={16}
          />
          <AppText
            variant="label"
            style={[styles.editButtonText, { color: colors.primaryForeground }]}
          >
            {editLabel}
          </AppText>
        </Pressable>
      </View>

      <View
        style={[
          styles.identityStatus,
          { backgroundColor: colors.muted },
          isRTL && styles.rowReverse,
        ]}
      >
        <Ionicons color={statusColor} name="shield-checkmark" size={17} />
        <AppText
          variant="label"
          style={[styles.signedInText, { color: statusColor }]}
        >
          {signedInLabel}
        </AppText>
      </View>
    </View>
  );
}

type IoniconName = ComponentProps<typeof Ionicons>["name"];

function FarmOverview({
  city,
  cityLabel,
  crops,
  cropsLabel,
  district,
  districtLabel,
  farmSize,
  farmSizeLabel,
  isRTL,
  title,
  village,
  villageLabel,
}: {
  city: string;
  cityLabel: string;
  crops: string[];
  cropsLabel: string;
  district: string;
  districtLabel: string;
  farmSize: string;
  farmSizeLabel: string;
  isRTL: boolean;
  title: string;
  village: string;
  villageLabel: string;
}) {
  const { colors, isDarkMode } = useThemeManager();
  const accentColor = isDarkMode ? colors.ring : colors.primaryDark;

  return (
    <View style={styles.sectionBlock}>
      <AppText
        variant="label"
        style={[styles.sectionHeading, { color: colors.mutedForeground }]}
      >
        {title}
      </AppText>

      <View
        style={[
          styles.farmCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[styles.farmHero, isRTL && styles.rowReverse]}>
          <View style={[styles.farmIcon, { backgroundColor: colors.primary }]}>
            <Ionicons
              color={colors.primaryForeground}
              name="home-outline"
              size={25}
            />
          </View>
          <View style={styles.farmHeroCopy}>
            <AppText
              variant="label"
              style={[styles.farmEyebrow, { color: accentColor }]}
            >
              {villageLabel}
            </AppText>
            <AppText
              selectable
              variant="title"
              style={[styles.farmName, { color: colors.foreground }]}
            >
              {village}
            </AppText>
          </View>
        </View>

        <View style={styles.farmRows}>
          <FarmMeta
            icon="business-outline"
            isRTL={isRTL}
            label={cityLabel}
            value={city}
          />
          <FarmMeta
            icon="location-outline"
            isRTL={isRTL}
            label={districtLabel}
            value={district}
          />
          <FarmMeta
            icon="resize-outline"
            isRTL={isRTL}
            label={farmSizeLabel}
            value={farmSize}
          />
          <CollapsibleCropsMeta
            crops={crops}
            isRTL={isRTL}
            label={cropsLabel}
          />
        </View>
      </View>
    </View>
  );
}

function FarmMeta({
  icon,
  isRTL,
  label,
  value,
}: {
  icon: IoniconName;
  isRTL: boolean;
  label: string;
  value: string;
}) {
  const { colors, isDarkMode } = useThemeManager();
  const accentColor = isDarkMode ? colors.ring : colors.primaryDark;

  return (
    <View
      style={[
        styles.farmMeta,
        { backgroundColor: colors.muted },
        isRTL && styles.rowReverse,
      ]}
    >
      <Ionicons color={accentColor} name={icon} size={17} />
      <View style={[styles.farmMetaCopy, isRTL && styles.rowReverse]}>
        <AppText style={[styles.farmMetaLabel, { color: colors.mutedForeground }]}>
          {label}
        </AppText>
        <AppText
          selectable
          variant="label"
          style={[
            styles.farmMetaValue,
            {
              color: colors.foreground,
              textAlign: isRTL ? "left" : "right",
            },
          ]}
        >
          {value}
        </AppText>
      </View>
    </View>
  );
}

function CollapsibleCropsMeta({
  crops,
  isRTL,
  label,
}: {
  crops: string[];
  isRTL: boolean;
  label: string;
}) {
  const { colors, isDarkMode } = useThemeManager();
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const accentColor = isDarkMode ? colors.ring : colors.primaryDark;
  const hiddenCount = Math.max(0, crops.length - 3);
  const visibleCrops = isExpanded ? crops : crops.slice(0, 3);
  const value =
    visibleCrops.length > 0
      ? visibleCrops.join(", ")
      : t("settingsNotProvided");

  return (
    <View
      style={[
        styles.farmMeta,
        { backgroundColor: colors.muted },
        isRTL && styles.rowReverse,
      ]}
    >
      <Ionicons color={accentColor} name="leaf-outline" size={17} />
      <View style={styles.cropsContent}>
        <View style={[styles.farmMetaCopy, isRTL && styles.rowReverse]}>
          <AppText
            style={[styles.farmMetaLabel, { color: colors.mutedForeground }]}
          >
            {label}
          </AppText>
          <AppText
            selectable
            variant="label"
            style={[
              styles.farmMetaValue,
              {
                color: colors.foreground,
                textAlign: isRTL ? "left" : "right",
              },
            ]}
          >
            {value}
          </AppText>
        </View>

        {hiddenCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: isExpanded }}
            hitSlop={6}
            onPress={() => setIsExpanded((current) => !current)}
            style={({ pressed }) => [
              styles.cropsToggle,
              {
                alignSelf: isRTL ? "flex-start" : "flex-end",
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
              isRTL && styles.rowReverse,
              pressed && styles.pressed,
            ]}
          >
            <AppText
              variant="label"
              style={[styles.cropsToggleText, { color: accentColor }]}
            >
              {isExpanded
                ? t("profileShowLessCrops")
                : t("profileMoreCrops", { count: hiddenCount })}
            </AppText>
            <Ionicons
              color={accentColor}
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={14}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function Section({
  children,
  padded = false,
  title,
}: {
  children: ReactNode;
  padded?: boolean;
  title: string;
}) {
  const { colors } = useThemeManager();

  return (
    <View style={styles.sectionBlock}>
      <AppText
        variant="label"
        style={[styles.sectionHeading, { color: colors.mutedForeground }]}
      >
        {title}
      </AppText>
      <View
        style={[
          styles.card,
          padded && styles.paddedCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function PreferenceBlock({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const { colors } = useThemeManager();

  return (
    <View>
      <AppText
        variant="label"
        style={[styles.preferenceTitle, { color: colors.foreground }]}
      >
        {title}
      </AppText>
      {children}
    </View>
  );
}

function ActionButton({
  destructive = false,
  disabled = false,
  icon,
  label,
  onPress,
}: {
  destructive?: boolean;
  disabled?: boolean;
  icon: string;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useThemeManager();
  // Dark `destructive` is a fill color and disappears as text; `red` stays readable.
  const accentColor = destructive ? colors.red : colors.foreground;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: colors.card,
          borderColor: destructive ? colors.red : colors.border,
        },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View
        style={[
          styles.actionIcon,
          { backgroundColor: destructive ? colors.red : colors.muted },
        ]}
      >
        <AppText
          style={[
            styles.actionIconText,
            {
              color: destructive
                ? colors.destructiveForeground
                : colors.foreground,
            },
          ]}
        >
          {icon}
        </AppText>
      </View>
      <AppText
        variant="label"
        style={[styles.actionLabel, { color: accentColor }]}
      >
        {label}
      </AppText>
      <AppText style={[styles.chevron, { color: colors.mutedForeground }]}>›</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  title: { fontSize: 28, lineHeight: 46 },
  editButton: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 15,
    flexDirection: "row",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 13,
  },
  editButtonText: { fontSize: 13, lineHeight: 22 },
  subtitle: { fontSize: 14, lineHeight: 25, marginTop: 2 },
  identityCard: {
    borderCurve: "continuous",
    borderRadius: 24,
    borderWidth: 1,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.055)",
    gap: 16,
    marginTop: 20,
    padding: 16,
  },
  identityMain: {
    alignItems: "center",
    flexDirection: "row",
    gap: 13,
  },
  avatarRing: {
    alignItems: "center",
    borderRadius: 38,
    borderWidth: 2,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  avatar: { alignItems: "center", borderRadius: 31, height: 60, justifyContent: "center", width: 60 },
  avatarText: { fontSize: 26, lineHeight: 40, textAlign: "center" },
  identityCopy: { flex: 1, minWidth: 0 },
  displayName: { fontSize: 20, lineHeight: 31 },
  phoneRow: { alignItems: "center", flexDirection: "row", gap: 6, marginTop: 1 },
  phone: { flexShrink: 1, fontSize: 13, lineHeight: 22 },
  identityStatus: {
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  signedInText: { fontSize: 12, lineHeight: 20 },
  rowReverse: { flexDirection: "row-reverse" },
  sectionBlock: { marginTop: 24 },
  sectionHeading: { fontSize: 13, lineHeight: 23, marginBottom: 8 },
  actionsHeading: { marginTop: 24 },
  card: { borderCurve: "continuous", borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  paddedCard: { padding: 14 },
  farmCard: {
    borderCurve: "continuous",
    borderRadius: 24,
    borderWidth: 1,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.055)",
    padding: 16,
  },
  farmHero: { alignItems: "center", flexDirection: "row", gap: 12 },
  farmIcon: {
    alignItems: "center",
    borderRadius: 18,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  farmHeroCopy: { flex: 1, minWidth: 0 },
  farmEyebrow: { fontSize: 11, lineHeight: 19 },
  farmName: { fontSize: 20, lineHeight: 32 },
  farmRows: { gap: 10, marginTop: 16 },
  farmMeta: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    gap: 9,
    minHeight: 58,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  farmMetaCopy: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minWidth: 0,
  },
  farmMetaLabel: { flexShrink: 0, fontSize: 13, lineHeight: 22 },
  farmMetaValue: { flexShrink: 1, fontSize: 15, lineHeight: 25 },
  cropsContent: { flex: 1, minWidth: 0 },
  cropsToggle: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    marginTop: 8,
    minHeight: 32,
    paddingHorizontal: 10,
  },
  cropsToggleText: { fontSize: 11, lineHeight: 19 },
  preferenceTitle: { fontSize: 15, lineHeight: 26, marginBottom: 10 },
  preferenceGap: { height: 20 },
  action: { alignItems: "center", borderCurve: "continuous", borderRadius: 18, borderWidth: 1, flexDirection: "row", marginBottom: 10, minHeight: 62, paddingHorizontal: 14 },
  actionIcon: { alignItems: "center", borderRadius: 14, height: 38, justifyContent: "center", width: 38 },
  actionIconText: { fontSize: 19, lineHeight: 28, textAlign: "center" },
  actionLabel: { flex: 1, fontSize: 15, lineHeight: 26, marginStart: 12 },
  chevron: { fontSize: 28, lineHeight: 32, marginStart: 8 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.995 }] },
  disabled: { opacity: 0.55 },
});
