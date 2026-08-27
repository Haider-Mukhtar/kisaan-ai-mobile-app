import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AuthShell } from "@/components/auth/auth-shell";
import { OnboardingButton } from "@/components/onboarding/onboarding-button";
import { AppText } from "@/components/ui/app-text";
import { OtpInput } from "@/components/ui/otp-input";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import { usePhoneAuth } from "@/providers/phone-auth-provider";
import { OTP_LENGTH } from "@/utils/otp";
import { formatPakistaniMobile } from "@/utils/phone";

export default function VerifyScreen() {
  const { colors } = useThemeManager();
  const { t } = useLanguage();
  const { canResendAt, isVerifying, pendingPhone, resendOtp, reset, verifyOtp } =
    usePhoneAuth();
  const [code, setCode] = useState("");
  const [hasError, setHasError] = useState(false);
  const [secondsUntilResend, setSecondsUntilResend] = useState(0);

  useEffect(() => {
    const tick = () => {
      setSecondsUntilResend(
        Math.max(0, Math.ceil((canResendAt - Date.now()) / 1000)),
      );
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [canResendAt]);

  // Guards against landing here without a code in flight, e.g. via deep link.
  if (!pendingPhone) {
    return <Redirect href="/(auth)/phone" />;
  }

  const handleSubmit = async (submitted: string) => {
    if (submitted.length !== OTP_LENGTH || isVerifying) {
      return;
    }

    const verified = await verifyOtp(submitted);

    if (!verified) {
      setHasError(true);
      setCode("");
      return;
    }

    // On success the root layout guard swaps this group for profile setup.
    setHasError(false);
  };

  const handleChangeNumber = () => {
    reset();
    router.back();
  };

  return (
    <AuthShell
      footer={
        <OnboardingButton
          disabled={code.length !== OTP_LENGTH || isVerifying}
          label={isVerifying ? t("otpVerifying") : t("otpVerify")}
          onPress={() => void handleSubmit(code)}
        />
      }
      onBack={handleChangeNumber}
    >
      <View style={styles.body}>
        <AppText
          variant="title"
          style={[styles.title, { color: colors.foreground }]}
        >
          {t("otpTitle")}
        </AppText>
        <AppText
          style={[styles.description, { color: colors.mutedForeground }]}
        >
          {t("otpDescription", { phone: formatPakistaniMobile(pendingPhone) })}
        </AppText>

        <View style={styles.otp}>
          <OtpInput
            autoFocus
            editable={!isVerifying}
            hasError={hasError}
            onChange={(value) => {
              setCode(value);
              setHasError(false);
            }}
            onComplete={(value) => void handleSubmit(value)}
            value={code}
          />
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            disabled={secondsUntilResend > 0 || isVerifying}
            hitSlop={8}
            onPress={() => resendOtp()}
          >
            <AppText
              variant="label"
              style={[
                styles.actionText,
                {
                  color:
                    secondsUntilResend > 0
                      ? colors.mutedForeground
                      : colors.primaryDark,
                },
              ]}
            >
              {secondsUntilResend > 0
                ? t("otpResendIn", { seconds: secondsUntilResend })
                : t("otpResend")}
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isVerifying}
            hitSlop={8}
            onPress={handleChangeNumber}
          >
            <AppText
              variant="label"
              style={[styles.actionText, { color: colors.mutedForeground }]}
            >
              {t("otpChangeNumber")}
            </AppText>
          </Pressable>
        </View>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 30,
    lineHeight: 48,
  },
  description: {
    fontSize: 16,
    lineHeight: 28,
    marginTop: 6,
  },
  otp: {
    marginTop: 32,
  },
  actions: {
    alignItems: "center",
    gap: 18,
    marginTop: 30,
  },
  actionText: {
    fontSize: 14,
    lineHeight: 24,
    textAlign: "center",
  },
});
