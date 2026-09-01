import { NativeTabs } from "expo-router/unstable-native-tabs";

import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";

export default function TabsLayout() {
  const { colors, effectiveTheme } = useThemeManager();
  const { fonts, t } = useLanguage();
  const selectedColor =
    effectiveTheme === "dark" ? colors.ring : colors.primaryDark;

  return (
    <NativeTabs
      backgroundColor={colors.background}
      blurEffect="systemMaterial"
      iconColor={{ default: colors.mutedForeground, selected: selectedColor }}
      indicatorColor={colors.primary}
      labelStyle={{
        default: {
          color: colors.mutedForeground,
          fontFamily: fonts.label,
          fontSize: 12,
        },
        selected: {
          color: selectedColor,
          fontFamily: fonts.label,
          fontSize: 12,
        },
      }}
      labelVisibilityMode="labeled"
      minimizeBehavior="onScrollDown"
      rippleColor={colors.accent}
      tintColor={selectedColor}
    >
      <NativeTabs.Trigger name="index" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon
          md={{ default: "home", selected: "home" }}
          sf={{ default: "house", selected: "house.fill" }}
        />
        <NativeTabs.Trigger.Label>{t("tabHome")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="ai" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon
          md={{ default: "auto_awesome", selected: "auto_awesome" }}
          sf={{ default: "sparkles", selected: "sparkles" }}
        />
        <NativeTabs.Trigger.Label>{t("tabAi")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon
          md={{ default: "person", selected: "person" }}
          sf={{ default: "person", selected: "person.fill" }}
        />
        <NativeTabs.Trigger.Label>{t("tabProfile")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
