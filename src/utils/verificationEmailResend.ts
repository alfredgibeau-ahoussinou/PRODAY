/** UIDs pour lesquels l’envoi initial à l’inscription a échoué — relance auto à l’écran vérif. */
const pendingAutoResend = new Set<string>();

export function markVerificationEmailResend(uid: string): void {
  if (uid) pendingAutoResend.add(uid);
}

export function consumeVerificationEmailAutoResend(uid: string): boolean {
  if (!uid || !pendingAutoResend.has(uid)) return false;
  pendingAutoResend.delete(uid);
  return true;
}
