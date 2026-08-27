import { forwardRef } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Fonts } from "@/constants/theme";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";

type AppTextInputProps = TextInputProps & {
  label?: string;
  hint?: string;
  /** Static leading text, e.g. a `+92` dial code. */
  prefix?: string;
  hasError?: boolean;
  /**
   * Forces left-to-right entry regardless of app language. Numbers read LTR
   * even in Urdu, so phone and OTP fields set this.
   */
  forceLTR?: boolean;
};

export const AppTextInput = forwardRef<TextInput, AppTextInputProps>(
  function AppTextInput(
    { label, hint, prefix, hasError = false, forceLTR = false, style, ...props },
    ref,
  ) {
    const { colors } = useThemeManager();
    const { fonts, textAlign } = useLanguage();

    return (
      <View style={styles.container}>
        {label ? (
          <AppText
            variant="label"
            style={[styles.label, { color: colors.foreground }]}
          >
            {label}
          </AppText>
        ) : null}

        <View
          style={[
            styles.field,
            {
              backgroundColor: colors.input,
              borderColor: hasError ? colors.red : colors.border,
            },
            forceLTR && styles.fieldLTR,
          ]}
        >
          {prefix ? (
            <>
              <AppText
                variant="label"
                style={[styles.prefix, { color: colors.mutedForeground }]}
              >
                {prefix}
              </AppText>
              <View
                style={[styles.prefixDivider, { backgroundColor: colors.border }]}
              />
            </>
          ) : null}

          <TextInput
            ref={ref}
            placeholderTextColor={colors.mutedForeground}
            {...props}
            style={[
              styles.input,
              {
                color: colors.foreground,
                fontFamily: forceLTR ? Fonts.interRegular : fonts.body,
                textAlign: forceLTR ? "left" : textAlign,
              },
              style,
            ]}
          />
        </View>

        {hint ? (
          <AppText
            style={[
              styles.hint,
              { color: hasError ? colors.red : colors.mutedForeground },
            ]}
          >
            {hint}
          </AppText>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 8,
  },
  field: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 58,
    paddingHorizontal: 18,
  },
  fieldLTR: {
    direction: "ltr",
  },
  prefix: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 16,
    lineHeight: 26,
  },
  prefixDivider: {
    height: 24,
    marginHorizontal: 12,
    width: 1,
  },
  input: {
    flex: 1,
    fontSize: 17,
    lineHeight: 26,
    paddingVertical: 14,
  },
  hint: {
    fontSize: 13,
    lineHeight: 22,
    marginTop: 8,
  },
});
