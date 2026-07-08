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

export function oauthProviderLabel(provider: 'google' | 'apple'): string {
  return provider === 'google' ? 'Google' : 'Apple';
}
