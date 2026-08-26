import { Pressable, StyleSheet } from "react-native";

import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";

type OnboardingButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function OnboardingButton({
  label,
  onPress,
  disabled = false,
}: OnboardingButtonProps) {
  const { colors } = useThemeManager();

  return (
    <Pressable
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
      <AppText
        variant="label"
        style={[styles.label, { color: colors.primaryForeground }]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 56,
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
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.55,
  },
});
