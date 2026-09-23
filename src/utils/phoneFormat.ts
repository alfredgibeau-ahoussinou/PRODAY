/** Nettoie et valide un numéro de téléphone international (ex: +33612345678) */
export function formatPhoneNumberE164(phone: string, defaultCountryCode = '+33'): string {
  const trimmed = phone.trim().replace(/\s+/g, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) {
    return trimmed;
  }
  if (trimmed.startsWith('00')) {
    return `+${trimmed.slice(2)}`;
  }
  if (trimmed.startsWith('0')) {
    return `${defaultCountryCode}${trimmed.slice(1)}`;
  }
  return `${defaultCountryCode}${trimmed}`;
}

export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumberE164(phone);
  // Format international E.164: + suivi de 7 à 15 chiffres
  return /^\+[1-9]\d{6,14}$/.test(formatted);
}
