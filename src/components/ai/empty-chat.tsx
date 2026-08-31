import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import {
  useLanguage,
  type TranslationKey,
} from "@/providers/language-provider";

const SUGGESTIONS: Array<{
  icon: React.ComponentProps<typeof Ionicons>["name"];
  key: TranslationKey;
}> = [
  { icon: "leaf-outline", key: "aiSuggestionCrop" },
  { icon: "water-outline", key: "aiSuggestionWater" },
  { icon: "partly-sunny-outline", key: "aiSuggestionWeather" },
];

type Props = {
  onSelectSuggestion: (text: string) => void;
};

export function AiEmptyChat({ onSelectSuggestion }: Props) {
  const { colors } = useThemeManager();
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={[styles.icon, { backgroundColor: colors.primary }]}>
        <Ionicons
          color={colors.primaryForeground}
          name="sparkles"
          size={28}
        />
      </View>
      <AppText
        variant="title"
        style={[styles.title, { color: colors.foreground }]}
      >
        {t("aiEmptyTitle")}
      </AppText>
      <AppText
        style={[styles.description, { color: colors.mutedForeground }]}
      >
        {t("aiEmptyDescription")}
      </AppText>

      <View style={styles.suggestions}>
        {SUGGESTIONS.map((suggestion) => {
          const label = t(suggestion.key);
          return (
            <Pressable
              accessibilityRole="button"
              key={suggestion.key}
              onPress={() => onSelectSuggestion(label)}
              style={({ pressed }) => [
                styles.suggestion,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.65 : 1,
                },
              ]}
            >
              <Ionicons
                color={colors.primaryDark}
                name={suggestion.icon}
                size={19}
              />
              <AppText
                variant="label"
                style={[styles.suggestionText, { color: colors.foreground }]}
              >
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  description: {
    fontSize: 13,
    lineHeight: 22,
    marginTop: 7,
    maxWidth: 390,
    textAlign: "center",
  },
  icon: {
    alignItems: "center",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  suggestion: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 21,
  },
  suggestions: {
    gap: 8,
    marginTop: 22,
    maxWidth: 420,
    width: "100%",
  },
  title: {
    fontSize: 21,
    lineHeight: 34,
    marginTop: 14,
    textAlign: "center",
  },
});
