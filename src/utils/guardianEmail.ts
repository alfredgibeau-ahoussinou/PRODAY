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
