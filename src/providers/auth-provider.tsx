import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/providers/language-provider";
import {
  resetPasswordForEmail,
  signInWithEmail,
  signOut as signOutRequest,
  signUpWithEmail,
  type SignInCredentials,
  type SignUpCredentials,
} from "@/services/supabase/auth";
import {
  getAuthErrorFallbackMessage,
  getAuthErrorTranslationKey,
} from "@/services/supabase/errors";
import { signInWithPhone as signInWithPhoneRequest } from "@/services/supabase/phone-auth";
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "@/utils/toast";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isReady: boolean;
  isBusy: boolean;
  signIn: (credentials: SignInCredentials) => Promise<boolean>;
  /** Resolves to the new session, or null when sign-in failed. */
  signInWithPhone: (phoneE164: string) => Promise<Session | null>;
  signUp: (credentials: SignUpCredentials) => Promise<boolean>;
  signOut: () => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const { t } = useLanguage();
  const tRef = useRef(t);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const showAuthError = useCallback((error: Error | null | undefined) => {
    const key = getAuthErrorTranslationKey(error);
    const fallback = getAuthErrorFallbackMessage(error);
    showErrorToast(tRef.current(key), fallback);
  }, []);

  useEffect(() => {
    let active = true;

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) {
          return;
        }

        if (error) {
          showAuthError(error);
          setSession(null);
          setUser(null);
          return;
        }

        setSession(data.session);
        setUser(data.session?.user ?? null);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        showAuthError(error instanceof Error ? error : null);
        setSession(null);
        setUser(null);
      })
      .finally(() => {
        if (active) {
          setIsReady(true);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [showAuthError]);

  const signIn = useCallback(
    async (credentials: SignInCredentials) => {
      setIsBusy(true);

      try {
        const { error } = await signInWithEmail(credentials);

        if (error) {
          showAuthError(error);
          return false;
        }

        showSuccessToast(tRef.current("authSignInSuccess"));
        return true;
      } catch (error) {
        showAuthError(error instanceof Error ? error : null);
        return false;
      } finally {
        setIsBusy(false);
      }
    },
    [showAuthError],
  );

  const signInWithPhone = useCallback(
    async (phoneE164: string) => {
      setIsBusy(true);

      try {
        const { data, error } = await signInWithPhoneRequest(phoneE164);

        if (error) {
          showAuthError(error);
          return null;
        }

        showSuccessToast(tRef.current("authSignInSuccess"));
        return data;
      } catch (error) {
        showAuthError(error instanceof Error ? error : null);
        return null;
      } finally {
        setIsBusy(false);
      }
    },
    [showAuthError],
  );

  const signUp = useCallback(
    async (credentials: SignUpCredentials) => {
      setIsBusy(true);

      try {
        const { data, error } = await signUpWithEmail(credentials);

        if (error) {
          showAuthError(error);
          return false;
        }

        if (data.session) {
          showSuccessToast(tRef.current("authSignUpSuccess"));
        } else {
          showInfoToast(
            tRef.current("authSignUpConfirmTitle"),
            tRef.current("authSignUpConfirmDescription"),
          );
        }

        return true;
      } catch (error) {
        showAuthError(error instanceof Error ? error : null);
        return false;
      } finally {
        setIsBusy(false);
      }
    },
    [showAuthError],
  );

  const signOut = useCallback(async () => {
    setIsBusy(true);

    try {
      const { error } = await signOutRequest();

      if (error) {
        showAuthError(error);
        return false;
      }

      showSuccessToast(tRef.current("authSignOutSuccess"));
      return true;
    } catch (error) {
      showAuthError(error instanceof Error ? error : null);
      return false;
    } finally {
      setIsBusy(false);
    }
  }, [showAuthError]);

  const sendPasswordReset = useCallback(
    async (email: string) => {
      setIsBusy(true);

      try {
        const { error } = await resetPasswordForEmail(email);

        if (error) {
          showAuthError(error);
          return false;
        }

        showInfoToast(
          tRef.current("authPasswordResetTitle"),
          tRef.current("authPasswordResetDescription"),
        );
        return true;
      } catch (error) {
        showAuthError(error instanceof Error ? error : null);
        return false;
      } finally {
        setIsBusy(false);
      }
    },
    [showAuthError],
  );

  const value = useMemo(
    () => ({
      session,
      user,
      isAuthenticated: Boolean(session?.user),
      isReady,
      isBusy,
      signIn,
      signInWithPhone,
      signUp,
      signOut,
      sendPasswordReset,
    }),
    [
      isBusy,
      isReady,
      sendPasswordReset,
      session,
      signIn,
      signInWithPhone,
      signOut,
      signUp,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
