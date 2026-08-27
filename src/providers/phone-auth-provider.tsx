import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import { useAuth } from "@/providers/auth-provider";
import { useLanguage } from "@/providers/language-provider";
import { useNetwork } from "@/providers/network-provider";
import { ensureProfile } from "@/services/supabase/profiles";
import {
  createDummyOtp,
  isOtpExpired,
  OTP_RESEND_COOLDOWN_MS,
  type DummyOtp,
} from "@/utils/otp";
import { formatPakistaniMobile, normalizePakistaniMobile } from "@/utils/phone";
import { showErrorToast, showInfoToast } from "@/utils/toast";

type PhoneAuthContextValue = {
  /** E.164 number awaiting verification, or null when no code is pending. */
  pendingPhone: string | null;
  isVerifying: boolean;
  canResendAt: number;
  requestOtp: (rawPhone: string) => boolean;
  resendOtp: () => boolean;
  verifyOtp: (code: string) => Promise<boolean>;
  reset: () => void;
};

const PhoneAuthContext = createContext<PhoneAuthContextValue | undefined>(
  undefined,
);

export function PhoneAuthProvider({ children }: PropsWithChildren) {
  const { t } = useLanguage();
  const { ensureOnline } = useNetwork();
  const { signInWithPhone } = useAuth();
  const otpRef = useRef<DummyOtp | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [canResendAt, setCanResendAt] = useState(0);

  const deliverOtp = useCallback(
    (phoneE164: string) => {
      const otp = createDummyOtp(phoneE164);
      otpRef.current = otp;
      setCanResendAt(Date.now() + OTP_RESEND_COOLDOWN_MS);

      // Stands in for an SMS until a provider is wired up.
      showInfoToast(
        t("otpSentTitle", { phone: formatPakistaniMobile(phoneE164) }),
        t("otpSentDescription", { code: otp.code }),
      );
    },
    [t],
  );

  const requestOtp = useCallback(
    (rawPhone: string) => {
      const phoneE164 = normalizePakistaniMobile(rawPhone);

      if (!phoneE164) {
        showErrorToast(t("otpInvalidPhoneTitle"), t("otpInvalidPhoneHint"));
        return false;
      }

      setPendingPhone(phoneE164);
      deliverOtp(phoneE164);
      return true;
    },
    [deliverOtp, t],
  );

  const resendOtp = useCallback(() => {
    if (!pendingPhone) {
      return false;
    }

    if (Date.now() < canResendAt) {
      showInfoToast(t("otpResendCooldownTitle"));
      return false;
    }

    deliverOtp(pendingPhone);
    return true;
  }, [canResendAt, deliverOtp, pendingPhone, t]);

  const verifyOtp = useCallback(
    async (code: string) => {
      const otp = otpRef.current;

      if (!otp || !pendingPhone) {
        showErrorToast(t("otpMissingTitle"));
        return false;
      }

      if (isOtpExpired(otp)) {
        showErrorToast(t("otpExpiredTitle"), t("otpExpiredDescription"));
        return false;
      }

      if (code !== otp.code) {
        showErrorToast(t("otpIncorrectTitle"), t("otpIncorrectDescription"));
        return false;
      }

      if (!ensureOnline()) {
        return false;
      }

      setIsVerifying(true);

      try {
        const session = await signInWithPhone(pendingPhone);

        if (!session) {
          return false;
        }

        // The signup trigger normally seeds this row; the upsert covers auth
        // users that predate the trigger.
        const { error } = await ensureProfile(session.user.id, pendingPhone);

        if (error) {
          showErrorToast(t("profileSaveErrorTitle"), error.message);
          return false;
        }

        otpRef.current = null;
        setPendingPhone(null);
        return true;
      } finally {
        setIsVerifying(false);
      }
    },
    [ensureOnline, pendingPhone, signInWithPhone, t],
  );

  const reset = useCallback(() => {
    otpRef.current = null;
    setPendingPhone(null);
    setCanResendAt(0);
  }, []);

  const value = useMemo(
    () => ({
      pendingPhone,
      isVerifying,
      canResendAt,
      requestOtp,
      resendOtp,
      verifyOtp,
      reset,
    }),
    [
      canResendAt,
      isVerifying,
      pendingPhone,
      requestOtp,
      resendOtp,
      reset,
      verifyOtp,
    ],
  );

  return (
    <PhoneAuthContext.Provider value={value}>
      {children}
    </PhoneAuthContext.Provider>
  );
}

export function usePhoneAuth() {
  const context = useContext(PhoneAuthContext);

  if (!context) {
    throw new Error("usePhoneAuth must be used within a PhoneAuthProvider");
  }

  return context;
}
