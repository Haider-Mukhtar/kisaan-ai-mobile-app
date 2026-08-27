import { useRef } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Fonts } from "@/constants/theme";
import useThemeManager from "@/hooks/use-theme-manager";
import { OTP_LENGTH, sanitizeOtpInput } from "@/utils/otp";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  hasError?: boolean;
  editable?: boolean;
  autoFocus?: boolean;
};

/**
 * Renders one box per digit. A single transparent TextInput stretched over the
 * boxes captures input, which keeps caret and backspace behaviour native
 * instead of juggling focus across six separate fields.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  hasError = false,
  editable = true,
  autoFocus = false,
}: OtpInputProps) {
  const { colors } = useThemeManager();
  const inputRef = useRef<TextInput>(null);
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index]);

  const handleChangeText = (next: string) => {
    const sanitized = sanitizeOtpInput(next);
    onChange(sanitized);

    if (sanitized.length === OTP_LENGTH) {
      onComplete?.(sanitized);
    }
  };

  return (
    <Pressable
      accessibilityLabel="One time password"
      accessibilityRole="none"
      onPress={() => inputRef.current?.focus()}
      style={styles.container}
    >
      <View style={styles.boxes} pointerEvents="none">
        {digits.map((digit, index) => {
          const isFilled = digit !== undefined;
          const isActive = editable && index === value.length;

          return (
            <View
              key={index}
              style={[
                styles.box,
                {
                  backgroundColor: colors.input,
                  borderColor: hasError
                    ? colors.red
                    : isActive
                      ? colors.ring
                      : colors.border,
                  borderWidth: isActive || hasError ? 2 : 1,
                },
              ]}
            >
              <AppText
                style={[
                  styles.digit,
                  {
                    color: isFilled ? colors.foreground : colors.mutedForeground,
                  },
                ]}
              >
                {digit ?? ""}
              </AppText>
            </View>
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        autoComplete="sms-otp"
        autoFocus={autoFocus}
        caretHidden
        editable={editable}
        keyboardType="number-pad"
        maxLength={OTP_LENGTH}
        onChangeText={handleChangeText}
        style={styles.hiddenInput}
        textContentType="oneTimeCode"
        value={value}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    direction: "ltr",
    width: "100%",
  },
  boxes: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  box: {
    alignItems: "center",
    borderRadius: 14,
    flex: 1,
    justifyContent: "center",
    maxWidth: 56,
    minHeight: 62,
  },
  digit: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 24,
    lineHeight: 34,
    textAlign: "center",
  },
  hiddenInput: {
    bottom: 0,
    color: "transparent",
    left: 0,
    opacity: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
