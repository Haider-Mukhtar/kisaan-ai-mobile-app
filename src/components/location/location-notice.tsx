import { Linking, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import type { LocationNotice as Notice } from "@/hooks/use-farm-location";
import { useLanguage } from "@/providers/language-provider";

type LocationNoticeProps = {
  notice: Notice;
};

/**
 * Shown when the device location could not be used. It always explains the
 * fallback, so declining the permission never looks like a dead end.
 */
export function LocationNotice({ notice }: LocationNoticeProps) {
  const { colors } = useThemeManager();
  const { t } = useLanguage();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.muted, borderColor: colors.border },
      ]}
    >
      <AppText variant="label" style={[styles.title, { color: colors.foreground }]}>
        {t(notice.titleKey)}
      </AppText>
      <AppText style={[styles.body, { color: colors.mutedForeground }]}>
        {t(notice.bodyKey)}
      </AppText>

      {notice.canOpenSettings ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => void Linking.openSettings()}
          style={({ pressed }) => [styles.settings, pressed && styles.pressed]}
        >
          <AppText variant="label" style={[styles.settingsText, { color: colors.info }]}>
            {t("locationOpenSettings")}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 20,
    padding: 16,
  },
  title: {
    fontSize: 15,
    lineHeight: 26,
  },
  body: {
    fontSize: 14,
    lineHeight: 25,
    marginTop: 4,
  },
  settings: {
    marginTop: 10,
    paddingVertical: 4,
  },
  settingsText: {
    fontSize: 14,
    lineHeight: 24,
  },
  pressed: {
    opacity: 0.7,
  },
});
