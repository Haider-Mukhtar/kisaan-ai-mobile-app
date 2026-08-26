import type { PropsWithChildren, ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import {
  OnboardingShell,
  type OnboardingStep,
} from "@/components/onboarding/onboarding-shell";
import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";

type OnboardingFrameProps = PropsWithChildren<{
  step: OnboardingStep;
  title: string;
  description: string;
  footer: ReactNode;
  onBack?: () => void;
}>;

export function OnboardingFrame({
  step,
  title,
  description,
  footer,
  onBack,
  children,
}: OnboardingFrameProps) {
  const { colors } = useThemeManager();

  return (
    <OnboardingShell
      contentStyle={styles.content}
      footer={footer}
      onBack={onBack}
      step={step}
    >
      <View style={styles.copyBlock}>
        <AppText
          variant="title"
          style={[styles.title, { color: colors.foreground }]}
        >
          {title}
        </AppText>
        <AppText
          style={[styles.description, { color: colors.mutedForeground }]}
        >
          {description}
        </AppText>
      </View>

      <View style={styles.options}>{children}</View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 28,
    justifyContent: "center",
  },
  copyBlock: {
    width: "100%",
  },
  title: {
    fontSize: 30,
    lineHeight: 46,
  },
  description: {
    fontSize: 15,
    lineHeight: 25,
    marginTop: 6,
  },
  options: {
    gap: 12,
    width: "100%",
  },
});
