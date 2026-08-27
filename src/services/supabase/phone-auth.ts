import type { AuthError, Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import type { AuthResult } from "@/services/supabase/auth";

/**
 * Bridges phone-number login onto Supabase's email/password provider.
 *
 * Supabase's real phone OTP (`signInWithOtp`) needs a configured SMS provider,
 * which this project does not have yet. Until then a deterministic credential
 * is derived from the phone number so that the same farmer always lands on the
 * same auth user, and every other part of the app gets a genuine session with
 * a working `auth.uid()` for RLS.
 *
 * SECURITY: the derivation is not a secret. It ships inside the app bundle, so
 * knowing a phone number is effectively enough to sign in as that farmer. This
 * is acceptable for a prototype with a dummy OTP, but real phone OTP must
 * replace `signInWithPhone` before any production release. When that happens
 * only this file needs to change.
 */

const SYNTHETIC_EMAIL_DOMAIN = "phone.kisaanai.app";
const CREDENTIAL_SCHEME = "kisaan-phone-v1";

function toSyntheticEmail(phoneE164: string): string {
  return `${phoneE164.replace("+", "")}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

function toSyntheticPassword(phoneE164: string): string {
  return `${CREDENTIAL_SCHEME}:${phoneE164}`;
}

function isUnknownUserError(error: AuthError | null): boolean {
  if (!error) {
    return false;
  }

  return (
    error.code === "invalid_credentials" ||
    error.message === "Invalid login credentials"
  );
}

function emailConfirmationRequiredError(): AuthError {
  return {
    name: "AuthError",
    message:
      "Signup succeeded without a session. Disable 'Confirm email' in Supabase Auth settings.",
    status: 400,
    code: "email_not_confirmed",
  } as AuthError;
}

/**
 * Signs the farmer in, creating the auth user on first use. The profile row is
 * seeded by the `on_auth_user_created` trigger from the `phone` metadata below.
 */
export async function signInWithPhone(
  phoneE164: string,
): Promise<AuthResult<Session>> {
  const email = toSyntheticEmail(phoneE164);
  const password = toSyntheticPassword(phoneE164);

  const signIn = await supabase.auth.signInWithPassword({ email, password });

  if (signIn.data.session) {
    return { data: signIn.data.session, error: null };
  }

  if (!isUnknownUserError(signIn.error)) {
    return {
      data: null,
      error: signIn.error ?? emailConfirmationRequiredError(),
    };
  }

  const signUp = await supabase.auth.signUp({
    email,
    password,
    options: { data: { phone: phoneE164 } },
  });

  if (signUp.error) {
    return { data: null, error: signUp.error };
  }

  if (!signUp.data.session) {
    return { data: null, error: emailConfirmationRequiredError() };
  }

  return { data: signUp.data.session, error: null };
}
