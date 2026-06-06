export function maskPhoneNumber(phone: string | null | undefined) {
  const trimmedPhone = phone?.trim();

  if (!trimmedPhone) {
    return "";
  }

  const digits = trimmedPhone.replace(/\D/g, "");

  if (digits.length <= 4) {
    return "*".repeat(digits.length);
  }

  const lastFourDigits = digits.slice(-4);

  if (digits.length >= 10) {
    return `${digits.slice(0, 3)}-****-${lastFourDigits}`;
  }

  return `****-${lastFourDigits}`;
}
