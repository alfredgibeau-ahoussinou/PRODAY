/** Prénom affiché — premier mot du nom complet. */
export function firstNameFromDisplayName(displayName: string | undefined | null): string {
  const raw = displayName?.trim();
  if (!raw) return '';
  const token = raw.split(/\s+/)[0] ?? raw;
  if (!token) return '';
  return token.charAt(0).toUpperCase() + token.slice(1);
}
