import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { Fonts } from "@/constants/theme";
import en from "@/locales/en.json";
import ur from "@/locales/ur.json";

export type LanguageCode = "en" | "ur";
export type TranslationKey = keyof typeof en;
export type TranslationParams = Record<string, string | number>;

const STORAGE_KEY = "kisaan-ai-language";

const translations: Record<
  LanguageCode,
  Record<TranslationKey, string>
> = { en, ur };

const languageFonts = {
  en: {
    body: Fonts.interRegular,
    label: Fonts.interSemiBold,
    title: Fonts.interSemiBold,
  },
  ur: {
    body: Fonts.notoNaskhArabic,
    label: Fonts.notoSansArabic,
    title: Fonts.notoNastaliqUrdu,
  },
} as const;

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
  fonts: (typeof languageFonts)[LanguageCode];
  isRTL: boolean;
  direction: "ltr" | "rtl";
  textAlign: "left" | "right";
  isReady: boolean;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

function getDeviceLanguage(): LanguageCode {
  return getLocales()[0]?.languageCode === "ur" ? "ur" : "en";
}

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setStoredLanguage] = useState<LanguageCode>(getDeviceLanguage);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (active && (value === "en" || value === "ur")) {
          setStoredLanguage(value);
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

  const setLanguage = useCallback((nextLanguage: LanguageCode) => {
    setStoredLanguage(nextLanguage);
    AsyncStorage.setItem(STORAGE_KEY, nextLanguage).catch(() => undefined);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => {
      const value = translations[language][key] ?? translations.en[key];

      if (!params) {
        return value;
      }

      return Object.entries(params).reduce(
        (result, [name, replacement]) =>
          result.replaceAll(`{{${name}}}`, String(replacement)),
        value,
      );
    },
    [language],
  );

  const isRTL = language === "ur";
  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      fonts: languageFonts[language],
      isRTL,
      direction: isRTL ? ("rtl" as const) : ("ltr" as const),
      textAlign: isRTL ? ("right" as const) : ("left" as const),
      isReady,
    }),
    [isRTL, isReady, language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}
