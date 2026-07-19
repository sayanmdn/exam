// Validation for Indian mobile numbers.
//
// A valid Indian mobile number is 10 digits and starts with 6, 7, 8 or 9.
// We accept common prefixes people type (+91, 91, or a leading 0) and any
// spaces/hyphens, then normalise to the canonical `+91XXXXXXXXXX` form.

/**
 * Normalises a raw phone string to `+91XXXXXXXXXX`, or returns `null` if it is
 * not a valid Indian mobile number.
 */
export function normalizeIndianPhone(raw: string): string | null {
  // Keep digits only (drops spaces, hyphens, parentheses, leading "+").
  const digits = raw.replace(/\D/g, "");

  // Strip an optional country code (91) or trunk prefix (0).
  let local = digits;
  if (local.length === 12 && local.startsWith("91")) {
    local = local.slice(2);
  } else if (local.length === 11 && local.startsWith("0")) {
    local = local.slice(1);
  }

  // Must now be exactly 10 digits starting 6-9.
  if (!/^[6-9]\d{9}$/.test(local)) return null;

  return `+91${local}`;
}

/** HTML input pattern accepting the same range of inputs as the normaliser. */
export const INDIAN_PHONE_PATTERN =
  "(\\+?91[\\s\\-]?|0)?[6-9](?:[\\s\\-]?\\d){9}";

export const INDIAN_PHONE_TITLE =
  "Enter a valid 10-digit Indian mobile number (starting with 6-9), optionally prefixed with +91.";
