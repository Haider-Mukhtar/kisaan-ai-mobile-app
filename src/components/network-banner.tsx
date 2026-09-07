import { StyleSheet, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import { useNetwork } from "@/providers/network-provider";

const LABEL_COLOR = "#FFFFFF";

export function NetworkBanner() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeManager();
  const { t } = useLanguage();
  const { isOffline } = useNetwork();

  if (!isOffline) {
    return null;
  }

  return (
    <View
      accessibilityHint={t("networkOfflineDescription")}
      accessibilityLabel={t("networkOfflineTitle")}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        styles.bar,
        {
          backgroundColor: colors.warning,
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons color={LABEL_COLOR} name="cloud-offline-outline" size={14} />
        <AppText numberOfLines={1} variant="label" style={styles.title}>
          {t("networkOfflineTitle")}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexShrink: 0,
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    paddingBottom: 6,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  title: {
    color: LABEL_COLOR,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});
