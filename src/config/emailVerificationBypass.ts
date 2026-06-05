/**
 * Comptes test / beta :
 * - pas de vérification email ni d’écran documents à l’onboarding ;
 * - accès à tous les pôles (Man, Woman, Pro) sans déconnexion ;
 * - sur Pro : expérience praticien (physio) pour tester le dashboard médical.
 */
export const BETA_ACCOUNT_BYPASS_EMAILS: readonly string[] = [
  'alfredgibeauahoussinou@gmail.com',
];

/** Compte démo partenaire — Pro Day Pro, rôle sponsor. */
export const PARTNER_POLE_TEST_EMAILS: readonly string[] = ['part@gmail.com'];

/** Alias — comptes autorisés sur les 3 univers. */
export const UNIVERSAL_POLE_TEST_EMAILS = BETA_ACCOUNT_BYPASS_EMAILS;

/** @deprecated Utiliser BETA_ACCOUNT_BYPASS_EMAILS */
export const EMAIL_VERIFICATION_BYPASS = BETA_ACCOUNT_BYPASS_EMAILS;

export function normalizeEmailForBypass(email: string): string {
  return email.trim().toLowerCase();
}

function isListedTestEmail(
  email: string | null | undefined,
  list: readonly string[]
): boolean {
  if (!email?.trim()) return false;
  const normalized = normalizeEmailForBypass(email);
  return list.some((e) => e === normalized);
}

export function isPartnerPoleTestAccount(email: string | null | undefined): boolean {
  return isListedTestEmail(email, PARTNER_POLE_TEST_EMAILS);
}

export function isBetaAccountBypassed(email: string | null | undefined): boolean {
  return (
    isListedTestEmail(email, BETA_ACCOUNT_BYPASS_EMAILS) ||
    isPartnerPoleTestAccount(email)
  );
}

/** Alias — email + documents */
export function isEmailVerificationBypassed(email: string | null | undefined): boolean {
  return isBetaAccountBypassed(email);
}

export function isOnboardingDocumentsBypassed(email: string | null | undefined): boolean {
  return isBetaAccountBypassed(email);
}

export function isUniversalPoleTestAccount(email: string | null | undefined): boolean {
  return isBetaAccountBypassed(email);
}
