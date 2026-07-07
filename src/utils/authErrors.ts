/** Firebase connecté mais profil Firestore absent — compléter via Inscription. */
export class AuthNeedsProfileError extends Error {
  readonly code = 'auth/profile-required' as const;

  constructor(
    public readonly email: string,
    public readonly displayName?: string
  ) {
    super('Complétez votre profil via l’onglet Inscription.');
    this.name = 'AuthNeedsProfileError';
  }
}
