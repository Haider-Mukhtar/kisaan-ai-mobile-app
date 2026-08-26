import { Text, type TextProps } from "react-native";

import { useLanguage } from "@/providers/language-provider";

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
      ]}
    />
  );
}
