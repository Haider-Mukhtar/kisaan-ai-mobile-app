import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "kisaan-ai-theme-preference";

type ThemeContextValue = {
  storedTheme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  isReady: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [storedTheme, setStoredTheme] = useState<ThemePreference>("system");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (
          active &&
          (value === "system" || value === "light" || value === "dark")
        ) {
          setStoredTheme(value);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setIsReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const setTheme = useCallback((theme: ThemePreference) => {
    setStoredTheme(theme);
    AsyncStorage.setItem(STORAGE_KEY, theme).catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({ storedTheme, setTheme, isReady }),
    [isReady, setTheme, storedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }

  return context;
}
