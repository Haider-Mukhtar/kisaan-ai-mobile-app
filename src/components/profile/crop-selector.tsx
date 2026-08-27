import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage, type TranslationKey } from "@/providers/language-provider";

const CROPS: { id: string; icon: string; labelKey: TranslationKey }[] = [
  { id: "tomato", icon: "🍅", labelKey: "cropTomato" },
  { id: "potato", icon: "🥔", labelKey: "cropPotato" },
  { id: "wheat", icon: "🌾", labelKey: "cropWheat" },
];

type CropSelectorProps = {
  selected: string[];
  onToggle: (cropId: string) => void;
};

export function CropSelector({ selected, onToggle }: CropSelectorProps) {
  const { colors, isDarkMode } = useThemeManager();
  const { t } = useLanguage();
  const selectedColor = isDarkMode ? colors.ring : colors.primaryDark;

  return (
    <View accessibilityRole="list" style={styles.options}>
      {CROPS.map((crop) => {
        const isSelected = selected.includes(crop.id);

        return (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            key={crop.id}
            onPress={() => onToggle(crop.id)}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: isSelected ? colors.accent : colors.card,
                borderColor: isSelected ? selectedColor : colors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <AppText style={styles.icon}>{crop.icon}</AppText>
            <AppText
              variant="label"
              style={[styles.label, { color: colors.foreground }]}
            >
              {t(crop.labelKey)}
            </AppText>
            <View
              style={[
                styles.check,
                {
                  backgroundColor: isSelected ? colors.primary : "transparent",
                  borderColor: isSelected ? selectedColor : colors.border,
                },
              ]}
            >
              {isSelected ? (
                <AppText
                  style={[styles.checkMark, { color: colors.primaryForeground }]}
                >
                  ✓
                </AppText>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  options: { gap: 10 },
  option: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 18,
    borderWidth: 1.5,
    flexDirection: "row",
    minHeight: 62,
    paddingHorizontal: 16,
  },
  icon: { fontSize: 25, lineHeight: 36 },
  label: { flex: 1, fontSize: 15, lineHeight: 26, marginHorizontal: 14 },
  check: {
    alignItems: "center",
    borderRadius: 11,
    borderWidth: 1.5,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  checkMark: { fontSize: 12, lineHeight: 18, textAlign: "center" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.995 }] },
});
