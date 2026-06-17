/**
 * Comptes démo partenaire (bypass onboarding + accès Pro sponsor).
 * Les comptes joueurs réels ne sont plus listés ici.
 */
export const BETA_ACCOUNT_BYPASS_EMAILS: readonly string[] = [];

/** Compte démo partenaire — Pro Day Pro, rôle sponsor. */
export const PARTNER_POLE_TEST_EMAILS: readonly string[] = ['part@gmail.com'];

/** @deprecated Plus de compte multi-pôles universel — liste vide. */
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

export function isBetaBypassAllowed(): boolean {
  return __DEV__ || process.env.EXPO_PUBLIC_APP_ENV !== 'production';
}

export function isBetaAccountBypassed(email: string | null | undefined): boolean {
  if (!isBetaBypassAllowed()) return false;
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
