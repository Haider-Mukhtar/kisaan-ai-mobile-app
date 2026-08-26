import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";
import { useThemeContext } from "@/providers/theme-provider";

export type { ThemeColors } from "@/constants/theme";

export default function useThemeManager() {
  const systemTheme = useColorScheme();
  const { storedTheme, setTheme, isReady } = useThemeContext();

  const effectiveTheme: "light" | "dark" = useMemo(() => {
    if (storedTheme !== "system") {
      return storedTheme;
    }

    return systemTheme === "dark" ? "dark" : "light";
  }, [storedTheme, systemTheme]);

  const colors = Colors[effectiveTheme];

  return useMemo(
    () => ({
      colors,
      effectiveTheme,
      storedTheme,
      isDarkMode: effectiveTheme === "dark",
      setTheme,
      isReady,
    }),
    [colors, effectiveTheme, isReady, setTheme, storedTheme],
  );
}
