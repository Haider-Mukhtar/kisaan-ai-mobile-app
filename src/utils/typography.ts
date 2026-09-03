import { Platform, type TextStyle } from "react-native";

import { Fonts } from "@/constants/theme";

/**
 * Noto Nastaliq hangs far below a Latin baseline. Android clips those
 * descenders unless the line box is taller than typical heading metrics.
 * iOS already measures this font correctly.
 */
const NASTALIQ_ANDROID_LINE_HEIGHT_RATIO = 2.15;
const NASTALIQ_ANDROID_BOTTOM_PADDING_RATIO = 0.12;

export function isNastaliqFont(fontFamily: string | undefined): boolean {
  return fontFamily === Fonts.notoNastaliqUrdu;
}

export function androidNastaliqTextStyle(
  fontFamily: string | undefined,
  metrics?: { fontSize?: number; lineHeight?: number },
): TextStyle | undefined {
  if (Platform.OS !== "android" || !isNastaliqFont(fontFamily)) {
    return undefined;
  }

  const fontSize = metrics?.fontSize ?? 16;
  const minLineHeight = Math.ceil(
    fontSize * NASTALIQ_ANDROID_LINE_HEIGHT_RATIO,
  );

  return {
    includeFontPadding: true,
    lineHeight: Math.max(metrics?.lineHeight ?? 0, minLineHeight),
    paddingBottom: Math.max(
      4,
      Math.round(fontSize * NASTALIQ_ANDROID_BOTTOM_PADDING_RATIO),
    ),
    textAlignVertical: "center",
  };
}

export function androidNastaliqHeadingStyle(
  fontSize: number,
  lineHeight?: number,
): TextStyle {
  return (
    androidNastaliqTextStyle(Fonts.notoNastaliqUrdu, { fontSize, lineHeight }) ??
    {}
  );
}
