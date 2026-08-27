/**
 * Pakistani mobile number handling.
 *
 * Canonical form throughout the app is E.164: +92 followed by the 10-digit
 * national number, which always starts with 3 for mobile lines.
 */

const COUNTRY_CODE = "92";
const NATIONAL_NUMBER_LENGTH = 10;

/**
 * Assigned mobile network codes: 030x-034x for Jazz, Zong, Ufone and Telenor,
 * plus 0355 for SCO in Azad Kashmir and Gilgit-Baltistan.
 */
const NATIONAL_NUMBER_PATTERN = /^3(?:[0-4]\d|55)\d{7}$/;

export const PHONE_NATIONAL_NUMBER_LENGTH = NATIONAL_NUMBER_LENGTH;

function toDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Strips whichever dial prefix the input carries. Unconditional stripping is
 * safe because a Pakistani mobile national number always starts with 3, so a
 * leading 0 or 92 can never be part of the number itself.
 */
function stripDialPrefix(digits: string): string {
  if (digits.startsWith(`00${COUNTRY_CODE}`)) {
    return digits.slice(2 + COUNTRY_CODE.length);
  }

  if (digits.startsWith(COUNTRY_CODE)) {
    return digits.slice(COUNTRY_CODE.length);
  }

  if (digits.startsWith("0")) {
    return digits.slice(1);
  }

  return digits;
}

/**
 * Reduces any accepted input shape to the bare 10-digit national number.
 * Handles `03001234567`, `3001234567`, `+923001234567`, `00923001234567`
 * and any of those with spaces or dashes.
 */
function toNationalNumber(value: string): string {
  return stripDialPrefix(toDigits(value));
}

export function isValidPakistaniMobile(value: string): boolean {
  return NATIONAL_NUMBER_PATTERN.test(toNationalNumber(value));
}

/**
 * Returns the E.164 form, or null when the input is not a valid Pakistani
 * mobile number. Callers should treat null as a validation failure.
 */
export function normalizePakistaniMobile(value: string): string | null {
  const nationalNumber = toNationalNumber(value);

  if (!NATIONAL_NUMBER_PATTERN.test(nationalNumber)) {
    return null;
  }

  return `+${COUNTRY_CODE}${nationalNumber}`;
}

/**
 * Formats for display as `0300 1234567`, the grouping farmers recognise.
 * Falls back to the raw input when it is not yet a complete number.
 */
export function formatPakistaniMobile(value: string): string {
  const nationalNumber = toNationalNumber(value);

  if (nationalNumber.length !== NATIONAL_NUMBER_LENGTH) {
    return value;
  }

  return `0${nationalNumber.slice(0, 3)} ${nationalNumber.slice(3)}`;
}

/**
 * Keeps the on-screen value tidy while the farmer types: digits only, capped
 * at the national number length, grouped as `0300 1234567`.
 */
export function formatPhoneInput(value: string): string {
  const nationalNumber = toNationalNumber(value).slice(
    0,
    NATIONAL_NUMBER_LENGTH,
  );

  if (nationalNumber.length === 0) {
    return "";
  }

  if (nationalNumber.length <= 3) {
    return `0${nationalNumber}`;
  }

  return `0${nationalNumber.slice(0, 3)} ${nationalNumber.slice(3)}`;
}
