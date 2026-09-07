import { ActivityIndicator, StyleSheet, View } from "react-native";

import { OnboardingButton } from "@/components/onboarding/onboarding-button";
import { AppText } from "@/components/ui/app-text";
import { SecondaryButton } from "@/components/ui/secondary-button";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";

type Props = {
  body: string;
  emoji: string;
  progress?: number;
  primaryAction?: {
    disabled?: boolean;
    label: string;
    onPress: () => void;
  };
  secondaryAction?: {
    disabled?: boolean;
    label: string;
    onPress: () => void;
  };
  title: string;
};

export function OfflineStatePanel({
  body,
  emoji,
  progress,
  primaryAction,
  secondaryAction,
  title,
}: Props) {
  const { colors } = useThemeManager();
  const { t } = useLanguage();
  const showSpinner = progress === undefined && !primaryAction;

  return (
    <View style={styles.panel}>
      <AppText style={styles.emoji}>{emoji}</AppText>
      <AppText
        variant="label"
        style={[styles.title, { color: colors.foreground }]}
      >
        {title}
      </AppText>
      <AppText style={[styles.body, { color: colors.mutedForeground }]}>
        {body}
      </AppText>

      {progress !== undefined ? (
        <View style={styles.progressBlock}>
          <View
            style={[
              styles.track,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.fill,
                {
                  backgroundColor: colors.primaryDark,
                  width: `${Math.max(2, Math.min(100, Math.round(progress * 100)))}%`,
                },
              ]}
            />
          </View>
          <AppText
            variant="label"
            style={[styles.progressLabel, { color: colors.foreground }]}
          >
            {t("offlineProgress", {
              value: Math.max(0, Math.min(100, Math.round(progress * 100))),
            })}
          </AppText>
        </View>
      ) : null}

      {showSpinner ? (
        <ActivityIndicator
          color={colors.primaryDark}
          style={styles.spinner}
        />
      ) : null}

      {primaryAction ? (
        <View style={styles.action}>
          <OnboardingButton
            disabled={primaryAction.disabled}
            label={primaryAction.label}
            onPress={primaryAction.onPress}
          />
        </View>
      ) : null}

      {secondaryAction ? (
        <View style={styles.action}>
          <SecondaryButton
            disabled={secondaryAction.disabled}
            label={secondaryAction.label}
            onPress={secondaryAction.onPress}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    marginTop: 16,
    width: "100%",
  },
  body: {
    fontSize: 14,
    lineHeight: 25,
    marginTop: 6,
    textAlign: "center",
  },
  emoji: {
    fontSize: 44,
    lineHeight: 56,
    textAlign: "center",
  },
  fill: {
    borderRadius: 999,
    height: "100%",
  },
  panel: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 36,
  },
  progressBlock: {
    marginTop: 22,
    width: "100%",
  },
  progressLabel: {
    fontSize: 13,
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center",
  },
  spinner: {
    marginTop: 22,
  },
  title: {
    fontSize: 20,
    lineHeight: 32,
    marginTop: 8,
    textAlign: "center",
  },
  track: {
    borderRadius: 999,
    borderWidth: 1,
    height: 10,
    overflow: "hidden",
    width: "100%",
  },
});
