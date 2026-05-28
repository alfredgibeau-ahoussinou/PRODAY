import { AuthNeedsProfileError } from '../services/auth.service';

export function getErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code: string }).code);
  }
  return '';
}

export function getErrorMessage(
  error: unknown,
  fallback = 'Une erreur est survenue. Réessayez.'
): string {
  if (error instanceof AuthNeedsProfileError) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  const code = getErrorCode(error);
  if (code && __DEV__) return `Erreur (${code}). Réessayez.`;
  return fallback;
}

export function isAuthNeedsProfile(error: unknown): error is AuthNeedsProfileError {
  return error instanceof AuthNeedsProfileError;
}
