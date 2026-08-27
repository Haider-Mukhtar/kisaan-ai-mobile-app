import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";

type SecondaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Emoji or symbol shown before the label, e.g. 📍 on location actions. */
  icon?: string;
};

/** Outlined counterpart to `OnboardingButton`, for the lower-weight action. */
export function SecondaryButton({
  label,
  onPress,
  disabled = false,
  icon,
}: SecondaryButtonProps) {
  const { colors } = useThemeManager();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {icon ? <AppText style={styles.icon}>{icon}</AppText> : null}
        <AppText
          variant="label"
          style={[styles.label, { color: colors.foreground }]}
        >
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 20,
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  icon: {
    fontSize: 17,
    lineHeight: 26,
    marginEnd: 10,
  },
  label: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.55,
  },
});
