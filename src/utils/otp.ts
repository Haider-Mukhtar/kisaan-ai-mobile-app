/**
 * Local stand-in for an SMS one-time password.
 *
 * No SMS provider is wired up yet, so the code is generated on-device and
 * surfaced to the farmer in a toast. Math.random is deliberate: the code is
 * shown to the user anyway, so unpredictability buys nothing here.
 */

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000;

export type DummyOtp = {
  code: string;
  phone: string;
  expiresAt: number;
};

export function generateOtpCode(): string {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH - 1;

  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

export function createDummyOtp(phone: string): DummyOtp {
  return {
    code: generateOtpCode(),
    phone,
    expiresAt: Date.now() + OTP_TTL_MS,
  };
}

export function isOtpExpired(otp: DummyOtp, now = Date.now()): boolean {
  return now >= otp.expiresAt;
}

export function sanitizeOtpInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, OTP_LENGTH);
}
