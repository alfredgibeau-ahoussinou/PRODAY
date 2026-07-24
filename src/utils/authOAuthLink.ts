type OAuthProviderData = { providerId: string };

/** Connexion Google ou Apple (pas email/mot de passe seul). */
export function isOAuthProviderUser(
  fbUser: { providerData: OAuthProviderData[] } | null | undefined
): boolean {
  return (
    fbUser?.providerData.some(
      (p) => p.providerId === 'google.com' || p.providerId === 'apple.com'
    ) ?? false
  );
}

export interface SignupOAuthState {
  isOAuthCompletion: boolean;
  providerEmail: string;
  isEmailEditable: boolean;
}

/** État OAuth pour l’inscription : verrouiller l’email seulement si le fournisseur en a fourni un. */
export function resolveSignupOAuthState(
  fbUser: { email?: string | null; providerData: OAuthProviderData[] } | null | undefined,
  initialEmail?: string
): SignupOAuthState {
  const isOAuthCompletion = isOAuthProviderUser(fbUser);
  const providerEmail = (initialEmail ?? fbUser?.email ?? '').trim();
  const isEmailEditable = !isOAuthCompletion || !providerEmail;
  return { isOAuthCompletion, providerEmail, isEmailEditable };
}

/** Décode l’email d’un JWT OAuth (Google id_token, Apple identityToken). */
export function decodeJwtEmail(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json =
      typeof atob === 'function'
        ? atob(base64)
        : Buffer.from(base64, 'base64').toString('utf8');
    const payload = JSON.parse(json) as { email?: string };
    const email = payload.email?.trim().toLowerCase();
    return email || null;
  } catch {
    return null;
  }
}

export function normalizeAuthEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase();
  return trimmed || null;
}

export function getFirebaseAuthErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code: string }).code);
  }
  return '';
}

export const AUTH_RATE_LIMIT_MESSAGE =
  'Trop de tentatives d’envoi. Attendez 15 à 60 minutes, vérifiez vos spams, ou ouvrez le lien déjà reçu.';

export const AUTH_EMAIL_CONFIG_MESSAGE =
  'Envoi e-mail temporairement indisponible (configuration ProDay). Contactez contact@proday.app. Nous vous enverrons le lien manuellement.';

/** Évite d’afficher le JSON brut Firebase (ex. TOO_MANY_ATTEMPTS_TRY_LATER). */
export function humanizeAuthErrorText(text: string): string {
  const msg = text.trim();
  if (!msg) return '';

  const upper = msg.toUpperCase();
  if (
    upper.includes('TOO_MANY_ATTEMPTS') ||
    upper.includes('TOO-MANY-REQUESTS') ||
    upper.includes('RESOURCE-EXHAUSTED')
  ) {
    return AUTH_RATE_LIMIT_MESSAGE;
  }

  if (
    upper.includes('UNAUTHORIZED-CONTINUE-URI') ||
    upper.includes('NOT ALLOWLISTED') ||
    upper.includes('DOMAIN NOT ALLOWLISTED')
  ) {
    return AUTH_EMAIL_CONFIG_MESSAGE;
  }

  if (
    msg.includes('Raw server response') ||
    /"error"\s*:\s*\{/.test(msg) ||
    msg.startsWith('An internal error has occurred')
  ) {
    if (upper.includes('TOO_MANY')) return AUTH_RATE_LIMIT_MESSAGE;
    if (upper.includes('ALLOWLIST') || upper.includes('CONTINUE')) return AUTH_EMAIL_CONFIG_MESSAGE;
    return 'Erreur serveur temporaire. Réessayez dans quelques minutes.';
  }

  return msg;
}

export function oauthProviderLabel(provider: 'google' | 'apple'): string {
  return provider === 'google' ? 'Google' : 'Apple';
}
