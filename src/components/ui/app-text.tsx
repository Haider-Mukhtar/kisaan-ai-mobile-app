import { StyleSheet, Text, type TextProps, type TextStyle } from "react-native";

import { useLanguage } from "@/providers/language-provider";
import { androidNastaliqTextStyle } from "@/utils/typography";

type AppTextVariant = "body" | "label" | "title";

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
};

export function AppText({
  style,
  variant = "body",
  ...props
}: AppTextProps) {
  const { fonts, isRTL, language, textAlign } = useLanguage();
  const flattened = StyleSheet.flatten(style) as TextStyle | undefined;
  const fontFamily = flattened?.fontFamily ?? fonts[variant];

  return (
    <Text
      accessibilityLanguage={language}
      {...props}
      style={[
        {
          fontFamily: fonts[variant],
          textAlign,
          writingDirection: isRTL ? "rtl" : "ltr",
        },
        style,
        androidNastaliqTextStyle(fontFamily, {
          fontSize:
            typeof flattened?.fontSize === "number"
              ? flattened.fontSize
              : undefined,
          lineHeight:
            typeof flattened?.lineHeight === "number"
              ? flattened.lineHeight
              : undefined,
        }),
      ]}
    />
  );
}
