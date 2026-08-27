import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";

export type PreferenceOption<Value extends string> = {
  value: Value;
  label: string;
  icon: string;
  fontFamily?: string;
  writingDirection?: "ltr" | "rtl";
};

type PreferenceSelectorProps<Value extends string> = {
  accessibilityLabel: string;
  value: Value;
  options: PreferenceOption<Value>[];
  onChange: (value: Value) => void;
};

export function PreferenceSelector<Value extends string>({
  accessibilityLabel,
  value,
  options,
  onChange,
}: PreferenceSelectorProps<Value>) {
  const { colors, isDarkMode } = useThemeManager();
  const selectedColor = isDarkMode ? colors.ring : colors.primaryDark;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radiogroup"
      style={styles.options}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: selected ? colors.accent : colors.card,
                borderColor: selected ? selectedColor : colors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.icon,
                {
                  backgroundColor: selected ? colors.primary : colors.muted,
                },
              ]}
            >
              <AppText
                style={[
                  styles.iconText,
                  { color: selected ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {option.icon}
              </AppText>
            </View>
            <AppText
              variant="label"
              style={[
                styles.label,
                { color: colors.foreground },
                option.fontFamily
                  ? {
                      fontFamily: option.fontFamily,
                      writingDirection: option.writingDirection,
                    }
                  : null,
              ]}
            >
              {option.label}
            </AppText>
            <View
              style={[
                styles.radio,
                { borderColor: selected ? selectedColor : colors.border },
              ]}
            >
              {selected ? (
                <View
                  style={[styles.radioDot, { backgroundColor: selectedColor }]}
                />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  options: {
    flexDirection: "row",
    gap: 10,
  },
  option: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 18,
    borderWidth: 1.5,
    flex: 1,
    minHeight: 104,
    padding: 12,
  },
  icon: {
    alignItems: "center",
    borderRadius: 14,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  iconText: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: "center",
  },
  label: {
    fontSize: 13,
    lineHeight: 22,
    marginTop: 7,
    textAlign: "center",
  },
  radio: {
    alignItems: "center",
    borderRadius: 7,
    borderWidth: 1.5,
    height: 14,
    justifyContent: "center",
    marginTop: 5,
    width: 14,
  },
  radioDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});
