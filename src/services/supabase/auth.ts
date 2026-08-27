import type { AuthError, Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export type AuthResult<T> =
  | { data: T; error: null }
  | { data: null; error: AuthError };

export type SignInCredentials = {
  email: string;
  password: string;
};

export type SignUpCredentials = SignInCredentials & {
  fullName?: string;
};

export async function getSession(): Promise<AuthResult<Session | null>> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return { data: null, error };
  }

  return { data: data.session, error: null };
}

export async function getCurrentUser(): Promise<AuthResult<User | null>> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { data: null, error };
  }

  return { data: data.user, error: null };
}

export async function signInWithEmail({
  email,
  password,
}: SignInCredentials): Promise<AuthResult<Session>> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return { data: null, error };
  }

  if (!data.session) {
    return {
      data: null,
      error: {
        name: "AuthError",
        message: "Email not confirmed",
        status: 400,
        code: "email_not_confirmed",
      } as AuthError,
    };
  }

  return { data: data.session, error: null };
}

export async function signUpWithEmail({
  email,
  password,
  fullName,
}: SignUpCredentials): Promise<
  AuthResult<{ user: User | null; session: Session | null }>
> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: fullName ? { full_name: fullName.trim() } : undefined,
    },
  });

  if (error) {
    return { data: null, error };
  }

  return {
    data: { user: data.user, session: data.session },
    error: null,
  };
}

export async function signOut(): Promise<AuthResult<null>> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { data: null, error };
  }

  return { data: null, error: null };
}

export async function resetPasswordForEmail(
  email: string,
): Promise<AuthResult<null>> {
  const redirectTo = "kisaanai://auth/reset-password";
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo },
  );

  if (error) {
    return { data: null, error };
  }

  return { data: null, error: null };
}
