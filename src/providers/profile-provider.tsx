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
  readCachedProfile,
  writeCachedProfile,
} from "@/services/profile/device-cache";
import {
  loadOrSeedProfile,
  saveFarmLocation,
  saveFarmProfile,
  type FarmLocation,
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
  /**
   * Stores the farm's coordinates. This is the last step of post-login
   * onboarding, so the first successful call also completes the profile.
   */
  saveLocation: (location: FarmLocation) => Promise<boolean>;
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
  const { ensureOnline, isOnline } = useNetwork();
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

    void (async () => {
      // Paint the on-device copy first so crops and location stay available
      // offline, then replace it with the server row when we have a signal.
      const cached = await readCachedProfile(userId);

      if (!active) {
        return;
      }

      if (cached) {
        setLoaded({ userId, profile: cached });
      }

      if (!isOnline) {
        if (!cached) {
          setLoaded({ userId, profile: null });
        }
        return;
      }

      try {
        const { data, error } = await loadOrSeedProfile(userId, metadataPhone);

        if (!active) {
          return;
        }

        if (error) {
          if (!cached) {
            showErrorToast(tRef.current("profileLoadErrorTitle"), error.message);
            setLoaded({ userId, profile: null });
          }
          return;
        }

        setLoaded({ userId, profile: data });
        if (data) {
          void writeCachedProfile(data);
        }
      } catch {
        if (active && !cached) {
          setLoaded({ userId, profile: null });
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [isAuthReady, isOnline, metadataPhone, userId]);

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
        void writeCachedProfile(data);
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

  const saveLocation = useCallback(
    async (location: FarmLocation) => {
      if (!userId || !ensureOnline()) {
        return false;
      }

      const wasComplete = Boolean(
        loaded?.userId === userId && loaded.profile?.isComplete,
      );

      setIsSaving(true);

      try {
        const { data, error } = await saveFarmLocation(userId, location, {
          completeSetup: !wasComplete,
        });

        if (error) {
          showErrorToast(tRef.current("locationSaveErrorTitle"), error.message);
          return false;
        }

        setLoaded({ userId, profile: data });
        void writeCachedProfile(data);
        showSuccessToast(tRef.current("locationSaveSuccessTitle"));
        return true;
      } catch {
        showErrorToast(tRef.current("locationSaveErrorTitle"));
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [ensureOnline, loaded, userId],
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
      saveLocation,
    };
  }, [
    isAuthReady,
    isAuthenticated,
    isSaving,
    loaded,
    saveLocation,
    saveProfile,
    userId,
  ]);

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
