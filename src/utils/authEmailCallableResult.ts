export type AuthEmailCallableResult = { enabled: boolean; sent: boolean };

export type AuthEmailSendStrategy = 'custom-sent' | 'skip' | 'firebase-fallback';

/** Interprète la réponse de sendAuthVerificationEmail côté client. */
export function resolveAuthEmailSendStrategy(
  result: AuthEmailCallableResult
): AuthEmailSendStrategy {
  if (result.enabled && result.sent) return 'custom-sent';
  if (result.enabled && !result.sent) return 'skip';
  return 'firebase-fallback';
}
