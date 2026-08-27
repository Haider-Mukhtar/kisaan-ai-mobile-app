import { ComponentProps } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { BaseToastProps } from "react-native-toast-message";

import { Colors, Fonts } from "@/constants/theme";
import useThemeManager from "@/hooks/use-theme-manager";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface CustomToastProps extends BaseToastProps {
  text1?: string;
  text2?: string;
}

type ToastVariant = "success" | "error" | "warning" | "info";

const VARIANT_CONFIG: Record<
  ToastVariant,
  {
    background: (theme: typeof Colors.light) => string;
    foreground: (theme: typeof Colors.light) => string;
    icon: IoniconName;
  }
> = {
  success: {
    background: (theme) => theme.success,
    foreground: () => Colors.light.background,
    icon: "checkmark-circle-outline",
  },
  error: {
    background: (theme) => theme.red,
    foreground: () => Colors.light.background,
    icon: "close-circle-outline",
  },
  warning: {
    background: (theme) => theme.warning,
    foreground: () => Colors.light.background,
    icon: "alert-circle-outline",
  },
  info: {
    background: (theme) => theme.info,
    foreground: () => Colors.light.background,
    icon: "information-circle-outline",
  },
};

function CustomToast({
  variant,
  text1,
  text2,
}: CustomToastProps & { variant: ToastVariant }) {
  const { colors: theme } = useThemeManager();
  const { background, foreground, icon } = VARIANT_CONFIG[variant];
  const backgroundColor = background(theme);
  const foregroundColor = foreground(theme);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Ionicons name={icon} size={22} color={foregroundColor} />
      <View style={styles.textContainer}>
        {text1 ? (
          <Text style={[styles.title, { color: foregroundColor }]}>
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text style={[styles.subtitle, { color: foregroundColor }]}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const toastConfig = {
  success: (props: CustomToastProps) => (
    <CustomToast variant="success" {...props} />
  ),
  error: (props: CustomToastProps) => (
    <CustomToast variant="error" {...props} />
  ),
  warning: (props: CustomToastProps) => (
    <CustomToast variant="warning" {...props} />
  ),
  info: (props: CustomToastProps) => <CustomToast variant="info" {...props} />,
};

const styles = StyleSheet.create({
  container: {
    width: "92%",
    maxWidth: 400,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: Platform.OS === "ios" ? 8 : 0,
    ...Platform.select({
      ios: {
        shadowColor: Colors.light.foreground,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  subtitle: {
    fontFamily: Fonts.interRegular,
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.92,
  },
});

export default toastConfig;
