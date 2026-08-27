import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AuthShell } from "@/components/auth/auth-shell";
import { OnboardingButton } from "@/components/onboarding/onboarding-button";
import { AppText } from "@/components/ui/app-text";
import { AppTextInput } from "@/components/ui/app-text-input";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import { usePhoneAuth } from "@/providers/phone-auth-provider";
import {
  formatPhoneInput,
  isValidPakistaniMobile,
  PHONE_NATIONAL_NUMBER_LENGTH,
} from "@/utils/phone";

export default function PhoneScreen() {
  const { colors } = useThemeManager();
  const { t } = useLanguage();
  const { requestOtp } = usePhoneAuth();
  const [phone, setPhone] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const digitCount = phone.replace(/\D/g, "").length;
  const isComplete = digitCount >= PHONE_NATIONAL_NUMBER_LENGTH;
  const isValid = isValidPakistaniMobile(phone);
  const showError = hasSubmitted && !isValid;

  const handleContinue = () => {
    setHasSubmitted(true);

    if (!isValid) {
      return;
    }

    if (requestOtp(phone)) {
      router.push("/(auth)/verify");
    }
  };

  return (
    <AuthShell
      footer={
        <OnboardingButton
          disabled={!isComplete}
          label={t("phoneContinue")}
          onPress={handleContinue}
        />
      }
    >
      <View style={styles.body}>
        <AppText
          variant="title"
          style={[styles.title, { color: colors.foreground }]}
        >
          {t("phoneTitle")}
        </AppText>
        <AppText
          style={[styles.description, { color: colors.mutedForeground }]}
        >
          {t("phoneDescription")}
        </AppText>

        <View style={styles.field}>
          <AppTextInput
            autoComplete="tel"
            autoFocus
            forceLTR
            hasError={showError}
            hint={showError ? t("phoneInvalidHint") : t("phoneHint")}
            keyboardType="phone-pad"
            label={t("phoneLabel")}
            maxLength={12}
            onChangeText={(value) => setPhone(formatPhoneInput(value))}
            onSubmitEditing={handleContinue}
            placeholder="0300 1234567"
            prefix="+92"
            returnKeyType="done"
            textContentType="telephoneNumber"
            value={phone}
          />
        </View>

        <View
          style={[
            styles.notice,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <AppText style={[styles.noticeText, { color: colors.mutedForeground }]}>
            {t("phoneDummyOtpNotice")}
          </AppText>
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
  field: {
    marginTop: 30,
  },
  notice: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 24,
    padding: 16,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 24,
  },
});
