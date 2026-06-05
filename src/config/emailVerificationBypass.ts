/**
 * Comptes test / beta : pas de vérification email ni d’écran documents à l’onboarding.
 * Ajoutez une adresse par ligne (minuscules).
 */
export const BETA_ACCOUNT_BYPASS_EMAILS: readonly string[] = [
  'alfredgibeauahoussinou@gmail.com',
];

/** @deprecated Utiliser BETA_ACCOUNT_BYPASS_EMAILS */
export const EMAIL_VERIFICATION_BYPASS = BETA_ACCOUNT_BYPASS_EMAILS;

export function normalizeEmailForBypass(email: string): string {
  return email.trim().toLowerCase();
}

export function isBetaAccountBypassed(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  const normalized = normalizeEmailForBypass(email);
  return BETA_ACCOUNT_BYPASS_EMAILS.some((e) => e === normalized);
}

/** Alias — email + documents */
export function isEmailVerificationBypassed(email: string | null | undefined): boolean {
  return isBetaAccountBypassed(email);
}

export function isOnboardingDocumentsBypassed(email: string | null | undefined): boolean {
  return isBetaAccountBypassed(email);
}
