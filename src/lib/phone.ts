/**
 * Sanitize a phone number input by stripping country code prefixes (+91, 91)
 * and non-digit characters, then limiting to 10 digits.
 * Used everywhere except the login/OTP interface.
 */
export function sanitizePhone(value: string): string {
  // Remove all non-digit characters
  let digits = value.replace(/\D/g, '');
  // Strip leading "91" country code if the result would be > 10 digits
  if (digits.length > 10 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  // Limit to 10 digits
  return digits.slice(0, 10);
}
