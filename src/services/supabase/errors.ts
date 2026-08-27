import type { AuthError } from "@supabase/supabase-js";

import type { TranslationKey } from "@/providers/language-provider";

const AUTH_ERROR_KEYS: Record<string, TranslationKey> = {
  invalid_credentials: "authInvalidCredentials",
  email_not_confirmed: "authEmailNotConfirmed",
  user_already_exists: "authUserAlreadyExists",
  user_not_found: "authUserNotFound",
  weak_password: "authWeakPassword",
  over_request_rate_limit: "authRateLimited",
  over_email_send_rate_limit: "authRateLimited",
  signup_disabled: "authSignupDisabled",
};

const AUTH_MESSAGE_KEYS: Record<string, TranslationKey> = {
  "Invalid login credentials": "authInvalidCredentials",
  "Email not confirmed": "authEmailNotConfirmed",
  "User already registered": "authUserAlreadyExists",
  "Password should be at least 6 characters.": "authWeakPassword",
  "Signup requires a valid password": "authWeakPassword",
};

export function getAuthErrorTranslationKey(
  error: AuthError | Error | null | undefined,
): TranslationKey {
  if (!error) {
    return "authGenericError";
  }

  const authError = error as AuthError;
  const code = authError.code?.toLowerCase();

  if (code && AUTH_ERROR_KEYS[code]) {
    return AUTH_ERROR_KEYS[code];
  }

  if (AUTH_MESSAGE_KEYS[error.message]) {
    return AUTH_MESSAGE_KEYS[error.message];
  }

  return "authGenericError";
}

export function getAuthErrorFallbackMessage(
  error: AuthError | Error | null | undefined,
): string | undefined {
  if (!error?.message) {
    return undefined;
  }

  const key = getAuthErrorTranslationKey(error);
  return key === "authGenericError" ? error.message : undefined;
}
