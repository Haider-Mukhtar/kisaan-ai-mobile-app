import { StyleSheet, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/app-text";
import { Colors } from "@/constants/theme";
import { useLanguage } from "@/providers/language-provider";
import { useNetwork } from "@/providers/network-provider";

export function NetworkBanner() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { isOffline } = useNetwork();

  if (!isOffline) {
    return null;
  }

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        styles.bar,
        {
          backgroundColor: Colors.light.warning,
          paddingTop: insets.top + 8,
        },
      ]}
    >
      <Ionicons
        color={Colors.light.background}
        name="cloud-offline-outline"
        size={18}
      />
      <View style={styles.copy}>
        <AppText variant="label" style={styles.title}>
          {t("networkOfflineTitle")}
        </AppText>
        <AppText style={styles.description}>
          {t("networkOfflineDescription")}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  title: {
    color: Colors.light.background,
    fontSize: 13,
    lineHeight: 20,
  },
  description: {
    color: Colors.light.background,
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.92,
  },
});
