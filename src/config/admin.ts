/** Emails autorisés pour la console admin (custom claim `admin` requis côté Firestore). */
export const PLATFORM_ADMIN_EMAILS = ['proday.admin@gmail.com'] as const;

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return PLATFORM_ADMIN_EMAILS.includes(
    email.trim().toLowerCase() as (typeof PLATFORM_ADMIN_EMAILS)[number]
  );
}
