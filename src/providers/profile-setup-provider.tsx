import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { useProfile } from "@/providers/profile-provider";

export type ProfileSetupDraft = {
  fullName: string;
  village: string;
  city: string;
  farmSize: string;
  crops: string[];
};

type ProfileSetupContextValue = {
  draft: ProfileSetupDraft;
  isSaving: boolean;
  setField: <Key extends keyof ProfileSetupDraft>(
    key: Key,
    value: ProfileSetupDraft[Key],
  ) => void;
  toggleCrop: (cropId: string) => void;
  saveDetails: () => Promise<boolean>;
};

const ProfileSetupContext = createContext<
  ProfileSetupContextValue | undefined
>(undefined);

export function parseFarmSize(value: string): number | null {
  const normalized = value.trim().replace(",", ".");

  if (!/^\d{1,4}(?:\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed > 0 && parsed <= 9999.99
    ? parsed
    : null;
}

export function ProfileSetupProvider({ children }: PropsWithChildren) {
  const { isSaving, profile, saveProfile } = useProfile();
  const [draft, setDraft] = useState<ProfileSetupDraft>(() => ({
    fullName: profile?.fullName ?? "",
    village: profile?.village ?? "",
    city: profile?.city ?? "",
    farmSize: profile?.farmSizeAcres ? String(profile.farmSizeAcres) : "",
    crops: profile?.crops ?? [],
  }));

  const setField = useCallback(
    <Key extends keyof ProfileSetupDraft>(
      key: Key,
      value: ProfileSetupDraft[Key],
    ) => {
      setDraft((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const toggleCrop = useCallback((cropId: string) => {
    setDraft((current) => ({
      ...current,
      crops: current.crops.includes(cropId)
        ? current.crops.filter((item) => item !== cropId)
        : [...current.crops, cropId],
    }));
  }, []);

  const saveDetails = useCallback(
    () =>
      saveProfile({
        fullName: draft.fullName,
        village: draft.village,
        city: draft.city,
        farmSizeAcres: parseFarmSize(draft.farmSize),
        crops: draft.crops,
      }),
    [draft, saveProfile],
  );

  const value = useMemo(
    () => ({ draft, isSaving, setField, toggleCrop, saveDetails }),
    [draft, isSaving, saveDetails, setField, toggleCrop],
  );

  return (
    <ProfileSetupContext.Provider value={value}>
      {children}
    </ProfileSetupContext.Provider>
  );
}

export function useProfileSetup() {
  const context = useContext(ProfileSetupContext);

  if (!context) {
    throw new Error(
      "useProfileSetup must be used within a ProfileSetupProvider",
    );
  }

  return context;
}
