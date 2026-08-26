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

const STORAGE_KEY = "kisaan-ai-onboarding-complete";

type OnboardingContextValue = {
  isComplete: boolean;
  isReady: boolean;
  markComplete: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined,
);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [isComplete, setIsComplete] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (active) {
          setIsComplete(value === "true");
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

  const markComplete = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEY, "true").catch(() => undefined);
    setIsComplete(true);
  }, []);

  const resetOnboarding = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
    setIsComplete(false);
  }, []);

  const value = useMemo(
    () => ({ isComplete, isReady, markComplete, resetOnboarding }),
    [isComplete, isReady, markComplete, resetOnboarding],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }

  return context;
}
