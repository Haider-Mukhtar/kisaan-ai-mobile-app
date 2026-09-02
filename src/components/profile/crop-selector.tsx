import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { AppTextInput } from "@/components/ui/app-text-input";
import { CROPS } from "@/constants/crops";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";

const BUILT_IN_CROP_IDS = new Set(CROPS.map((crop) => crop.id));

type CropSelectorProps = {
  selected: string[];
  onToggle: (cropId: string) => void;
};

export function CropSelector({ selected, onToggle }: CropSelectorProps) {
  const { colors, isDarkMode } = useThemeManager();
  const { t } = useLanguage();
  const [customCrop, setCustomCrop] = useState("");
  const selectedColor = isDarkMode ? colors.ring : colors.primaryDark;
  const customCrops = selected.filter((crop) => !BUILT_IN_CROP_IDS.has(crop));
  const normalizedCustomCrop = customCrop.trim().replace(/\s+/g, " ");
  const normalizedLower = normalizedCustomCrop.toLocaleLowerCase();
  const isDuplicate =
    selected.some((crop) => crop.toLocaleLowerCase() === normalizedLower) ||
    CROPS.some(
      (crop) =>
        crop.id === normalizedLower ||
        t(crop.labelKey).toLocaleLowerCase() === normalizedLower,
    );
  const canAddCustom = normalizedCustomCrop.length >= 2 && !isDuplicate;

  const addCustomCrop = () => {
    if (!canAddCustom) return;
    onToggle(normalizedCustomCrop);
    setCustomCrop("");
  };

  const options = [
    ...CROPS.map((crop) => ({
      id: crop.id,
      icon: crop.icon,
      label: t(crop.labelKey),
    })),
    ...customCrops.map((crop) => ({ id: crop, icon: "🌱", label: crop })),
  ];

  return (
    <View>
      <View accessibilityRole="list" style={styles.options}>
        {options.map((crop) => {
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
                {crop.label}
              </AppText>
              <View
                style={[
                  styles.check,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : "transparent",
                    borderColor: isSelected ? selectedColor : colors.border,
                  },
                ]}
              >
                {isSelected ? (
                  <AppText
                    style={[
                      styles.checkMark,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    ✓
                  </AppText>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View
        style={[
          styles.customCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <AppText
          variant="label"
          style={[styles.customTitle, { color: colors.foreground }]}
        >
          {t("cropCustomTitle")}
        </AppText>
        <AppText
          style={[styles.customHint, { color: colors.mutedForeground }]}
        >
          {t("cropCustomDescription")}
        </AppText>
        <AppTextInput
          autoCapitalize="words"
          maxLength={50}
          onChangeText={setCustomCrop}
          onSubmitEditing={addCustomCrop}
          placeholder={t("cropCustomPlaceholder")}
          returnKeyType="done"
          value={customCrop}
        />
        {isDuplicate && normalizedCustomCrop ? (
          <AppText
            style={[styles.duplicateHint, { color: colors.warning }]}
          >
            {t("cropCustomDuplicate")}
          </AppText>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canAddCustom }}
          disabled={!canAddCustom}
          onPress={addCustomCrop}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
            !canAddCustom && styles.disabled,
          ]}
        >
          <AppText
            variant="label"
            style={[styles.addButtonText, { color: colors.primaryForeground }]}
          >
            {t("cropCustomAdd")}
          </AppText>
        </Pressable>
      </View>
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
  customCard: {
    borderCurve: "continuous",
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 18,
    padding: 16,
  },
  customTitle: { fontSize: 16, lineHeight: 27 },
  customHint: { fontSize: 13, lineHeight: 23, marginBottom: 12, marginTop: 2 },
  duplicateHint: { fontSize: 12, lineHeight: 21, marginTop: 6 },
  addButton: {
    alignItems: "center",
    borderRadius: 15,
    justifyContent: "center",
    marginTop: 12,
    minHeight: 48,
    paddingHorizontal: 18,
  },
  addButtonText: { fontSize: 14, lineHeight: 24, textAlign: "center" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.995 }] },
  disabled: { opacity: 0.5 },
});
