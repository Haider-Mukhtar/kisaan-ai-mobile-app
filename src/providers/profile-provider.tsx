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

import { useAuth } from "@/providers/auth-provider";
import { useLanguage } from "@/providers/language-provider";
import { useNetwork } from "@/providers/network-provider";
import {
  loadOrSeedProfile,
  saveFarmProfile,
  type FarmProfileDraft,
  type FarmerProfile,
} from "@/services/supabase/profiles";
import { normalizePakistaniMobile } from "@/utils/phone";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

type ProfileContextValue = {
  profile: FarmerProfile | null;
  /** False while the profile for the current session is still loading. */
  isReady: boolean;
  isSaving: boolean;
  /** True once post-login onboarding has been completed. */
  isComplete: boolean;
  saveProfile: (draft: FarmProfileDraft) => Promise<boolean>;
};

/**
 * The loaded profile is tagged with the user it belongs to so that everything
 * exposed below can be derived. A stale tag after sign-out or a user switch
 * reads as "not loaded yet" without needing to reset state from an effect.
 */
type LoadedProfile = {
  userId: string;
  profile: FarmerProfile | null;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined,
);

export function ProfileProvider({ children }: PropsWithChildren) {
  const { t } = useLanguage();
  const { ensureOnline } = useNetwork();
  const { isAuthenticated, isReady: isAuthReady, user } = useAuth();
  const tRef = useRef(t);
  const [loaded, setLoaded] = useState<LoadedProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const userId = user?.id ?? null;
  /**
   * Signup metadata is only a fallback for seeding the farmer's own row, which
   * RLS already restricts to them. It is never used for authorization, since
   * user metadata is editable by the user.
   */
  const metadataPhone = normalizePakistaniMobile(
    typeof user?.user_metadata?.phone === "string"
      ? user.user_metadata.phone
      : "",
  );

  useEffect(() => {
    if (!isAuthReady || !userId) {
      return;
    }

    let active = true;

    void loadOrSeedProfile(userId, metadataPhone)
      .then(({ data, error }) => {
        if (!active) {
          return;
        }

        if (error) {
          showErrorToast(tRef.current("profileLoadErrorTitle"), error.message);
        }

        setLoaded({ userId, profile: error ? null : data });
      })
      .catch(() => {
        if (active) {
          setLoaded({ userId, profile: null });
        }
      });

    return () => {
      active = false;
    };
  }, [isAuthReady, metadataPhone, userId]);

  const saveProfile = useCallback(
    async (draft: FarmProfileDraft) => {
      if (!userId || !ensureOnline()) {
        return false;
      }

      setIsSaving(true);

      try {
        const { data, error } = await saveFarmProfile(userId, draft);

        if (error) {
          showErrorToast(tRef.current("profileSaveErrorTitle"), error.message);
          return false;
        }

        setLoaded({ userId, profile: data });
        showSuccessToast(tRef.current("profileSaveSuccessTitle"));
        return true;
      } catch {
        showErrorToast(tRef.current("profileSaveErrorTitle"));
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [ensureOnline, userId],
  );

  const value = useMemo(() => {
    const isCurrent = userId !== null && loaded?.userId === userId;
    const profile = isCurrent ? loaded.profile : null;

    return {
      profile,
      // Signed-out users have nothing to load, so readiness follows auth.
      isReady: isAuthReady && (userId === null || isCurrent),
      isSaving,
      isComplete: Boolean(isAuthenticated && profile?.isComplete),
      saveProfile,
    };
  }, [isAuthReady, isAuthenticated, isSaving, loaded, saveProfile, userId]);

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }

  return context;
}
