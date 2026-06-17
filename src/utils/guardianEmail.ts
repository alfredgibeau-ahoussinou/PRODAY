export function normalizeGuardianEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

export function guardianEmailsMatch(
  guardianEmail: string | null | undefined,
  accountEmail: string | null | undefined,
): boolean {
  const a = normalizeGuardianEmail(guardianEmail);
  const b = normalizeGuardianEmail(accountEmail);
  return Boolean(a && b && a === b);
}

export function isGuardianForMinorSettings(
  settings: { guardian_email?: string; guardian_email_secondary?: string } | undefined,
  accountEmail: string | null | undefined,
): boolean {
  if (!settings) return false;
  return (
    guardianEmailsMatch(settings.guardian_email, accountEmail)
    || guardianEmailsMatch(settings.guardian_email_secondary, accountEmail)
  );
}

export function generateGuardianInviteCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
