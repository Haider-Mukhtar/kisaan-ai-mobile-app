import { router } from "expo-router";
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-screens/experimental";

import {
  PreferenceSelector,
  type PreferenceOption,
} from "@/components/profile/preference-selector";
import { AppText } from "@/components/ui/app-text";
import { getDistrict, getDistrictName } from "@/constants/districts";
import { Fonts } from "@/constants/theme";
import useThemeManager from "@/hooks/use-theme-manager";
import { useAuth } from "@/providers/auth-provider";
import {
  useLanguage,
  type LanguageCode,
  type TranslationKey,
} from "@/providers/language-provider";
import { useNetwork } from "@/providers/network-provider";
import { useOnboarding } from "@/providers/onboarding-provider";
import { useProfile } from "@/providers/profile-provider";
import type { ThemePreference } from "@/providers/theme-provider";
import { formatPakistaniMobile } from "@/utils/phone";

const CROP_LABELS: Record<string, TranslationKey> = {
  potato: "cropPotato",
  tomato: "cropTomato",
  wheat: "cropWheat",
};

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
  const crops =
    profile?.crops
      .map((crop) => (CROP_LABELS[crop] ? t(CROP_LABELS[crop]) : crop))
      .join(", ") || t("settingsNotProvided");
  const displayName = profile?.fullName || t("settingsNotProvided");
  const initial = profile?.fullName?.trim().charAt(0).toLocaleUpperCase() || "K";
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
      edges={{ bottom: true, top: !isOffline }}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
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

        <View
          style={[
            styles.identityCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[styles.avatar, { backgroundColor: colors.primary }]}
          >
            <AppText
              variant="title"
              style={[styles.avatarText, { color: colors.primaryForeground }]}
            >
              {initial}
            </AppText>
          </View>
          <View style={styles.identityCopy}>
            <AppText
              selectable
              variant="label"
              style={[styles.displayName, { color: colors.foreground }]}
            >
              {displayName}
            </AppText>
            <AppText
              selectable
              style={[styles.phone, { color: colors.mutedForeground }]}
            >
              {profile?.phone
                ? formatPakistaniMobile(profile.phone)
                : t("settingsNotProvided")}
            </AppText>
            <View style={styles.signedInRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <AppText
                style={[styles.signedInText, { color: colors.success }]}
              >
                {t("profileSignedIn")}
              </AppText>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/edit-profile")}
            style={({ pressed }) => [
              styles.editButton,
              { backgroundColor: colors.accent, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <AppText
              variant="label"
              style={[styles.editButtonText, { color: colors.foreground }]}
            >
              {`✎ ${t("editProfileAction")}`}
            </AppText>
          </Pressable>
        </View>

        <Section title={t("settingsFarmTitle")}>
          <InfoRow label={t("settingsVillage")} value={profile?.village || t("settingsNotProvided")} />
          <Divider />
          <InfoRow label={t("settingsCity")} value={profile?.city || t("settingsNotProvided")} />
          <Divider />
          <InfoRow
            label={t("settingsFarmSize")}
            value={
              profile?.farmSizeAcres !== null && profile?.farmSizeAcres !== undefined
                ? t("settingsAcres", { value: profile.farmSizeAcres })
                : t("settingsNotProvided")
            }
          />
          <Divider />
          <InfoRow label={t("settingsCrops")} value={crops} />
          <Divider />
          <InfoRow
            label={t("settingsDistrict")}
            value={district ? getDistrictName(district, language) : t("settingsNotProvided")}
          />
        </Section>

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

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useThemeManager();

  return (
    <View style={styles.infoRow}>
      <AppText style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</AppText>
      <AppText
        selectable
        variant="label"
        style={[styles.infoValue, { color: colors.foreground }]}
      >
        {value}
      </AppText>
    </View>
  );
}

function Divider() {
  const { colors } = useThemeManager();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
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
  const textColor = destructive ? colors.destructive : colors.foreground;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View
        style={[
          styles.actionIcon,
          { backgroundColor: destructive ? colors.destructive : colors.muted },
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
        style={[styles.actionLabel, { color: textColor }]}
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
    alignSelf: "center",
    borderCurve: "continuous",
    borderRadius: 14,
    borderWidth: 1,
    marginStart: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  editButtonText: { fontSize: 13, lineHeight: 22 },
  subtitle: { fontSize: 14, lineHeight: 25, marginTop: 2 },
  identityCard: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 20,
    padding: 18,
  },
  avatar: { alignItems: "center", borderRadius: 31, height: 62, justifyContent: "center", width: 62 },
  avatarText: { fontSize: 26, lineHeight: 40, textAlign: "center" },
  identityCopy: { flex: 1, marginStart: 16 },
  displayName: { fontSize: 18, lineHeight: 30 },
  phone: { fontSize: 13, lineHeight: 22, marginTop: 1 },
  signedInRow: { alignItems: "center", flexDirection: "row", marginTop: 5 },
  statusDot: { borderRadius: 4, height: 8, marginEnd: 7, width: 8 },
  signedInText: { fontSize: 12, lineHeight: 20 },
  sectionBlock: { marginTop: 24 },
  sectionHeading: { fontSize: 13, lineHeight: 23, marginBottom: 8 },
  actionsHeading: { marginTop: 24 },
  card: { borderCurve: "continuous", borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  paddedCard: { padding: 14 },
  infoRow: { alignItems: "flex-start", flexDirection: "row", gap: 16, minHeight: 58, paddingHorizontal: 16, paddingVertical: 14 },
  infoLabel: { flex: 0.42, fontSize: 13, lineHeight: 23 },
  infoValue: { flex: 0.58, fontSize: 14, lineHeight: 24 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
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
