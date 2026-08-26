import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Fonts } from "@/constants/theme";
import useThemeManager from "@/hooks/use-theme-manager";

type OnboardingButtonProps = {
  label?: string;
  englishLabel?: string;
  urduLabel?: string;
  onPress: () => void;
  disabled?: boolean;
};

export function OnboardingButton({
  label,
  englishLabel,
  urduLabel,
  onPress,
  disabled = false,
}: OnboardingButtonProps) {
  const { colors } = useThemeManager();

  return (
    <Pressable
      accessibilityLabel={label ?? `${englishLabel}, ${urduLabel}`}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.primary },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {englishLabel && urduLabel ? (
        <View style={styles.bilingualLabel}>
          <Text
            style={[styles.englishLabel, { color: colors.primaryForeground }]}
          >
            {englishLabel}
          </Text>
          <View
            style={[
              styles.labelDivider,
              { backgroundColor: colors.primaryForeground },
            ]}
          />
          <Text
            style={[styles.urduLabel, { color: colors.primaryForeground }]}
          >
            {urduLabel}
          </Text>
        </View>
      ) : (
        <AppText
          variant="label"
          style={[styles.label, { color: colors.primaryForeground }]}
        >
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
  },
  label: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: "center",
  },
  bilingualLabel: {
    alignItems: "center",
    direction: "ltr",
    flexDirection: "row",
    justifyContent: "center",
  },
  englishLabel: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 15,
    lineHeight: 22,
  },
  labelDivider: {
    height: 16,
    marginHorizontal: 12,
    opacity: 0.32,
    width: 1,
  },
  urduLabel: {
    fontFamily: Fonts.notoNaskhArabic,
    fontSize: 16,
    lineHeight: 24,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.55,
  },
});
