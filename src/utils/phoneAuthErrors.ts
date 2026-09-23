/**
 * Messages honnêtes pour les échecs d'authentification par téléphone (F2).
 * Les codes Firebase bruts ne doivent jamais atteindre l'utilisateur :
 * chaque échec est traduit en cause réelle + action possible.
 */
export const PHONE_AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-verification-code':
    'Code incorrect. Vérifiez le code à 6 chiffres reçu par SMS.',
  'auth/missing-verification-code': 'Saisissez le code à 6 chiffres reçu par SMS.',
  'auth/code-expired':
    'Code expiré. Demandez un nouveau code — l’ancien n’est plus valable.',
  'auth/invalid-verification-id':
    'Demande de vérification introuvable ou expirée. Renvoyez un code.',
  'auth/too-many-requests':
    'Trop de tentatives. Réessayez dans quelques minutes.',
  'auth/quota-exceeded':
    'Quota de SMS atteint pour ce projet. Contactez le support ou réessayez plus tard.',
  'auth/invalid-phone-number': 'Numéro de téléphone invalide.',
  'auth/missing-phone-number': 'Saisissez votre numéro de téléphone.',
  'auth/operation-not-allowed':
    'Connexion par téléphone désactivée dans Firebase (Authentication).',
  'auth/network-request-failed': 'Pas de réseau. Vérifiez votre connexion.',
  'auth/invalid-app-credential':
    'Vérification anti-fraude indisponible sur cet appareil : la connexion par téléphone nécessite une configuration reCAPTCHA/attestation réelle.',
  'auth/captcha-check-failed':
    'Vérification anti-robot échouée. Réessayez.',
  'auth/user-disabled': 'Ce compte est désactivé.',
  'auth/provider-already-linked':
    'Ce numéro est déjà lié à un compte. Connectez-vous avec celui-ci.',
  'auth/credential-already-in-use':
    'Ce numéro de téléphone est déjà associé à un autre compte.',
  'auth/invalid-credential': 'Code invalide ou expiré. Demandez un nouveau code.',
};

export function mapPhoneAuthErrorCode(code: string): string | undefined {
  return PHONE_AUTH_ERROR_MESSAGES[code];
}

/** Extrait le message honnête d'une erreur Firebase phone auth. */
export function phoneAuthErrorMessage(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const mapped = mapPhoneAuthErrorCode(String((error as { code: string }).code));
    if (mapped) return mapped;
  }
  return undefined;
}
