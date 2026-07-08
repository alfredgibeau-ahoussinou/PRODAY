import type { AuthCredential } from 'firebase/auth';

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

/** Compte email/mot de passe existant — mot de passe requis pour lier Google ou Apple. */
export class AuthLinkPasswordRequiredError extends Error {
  readonly code = 'auth/link-password-required' as const;

  constructor(
    public readonly email: string,
    public readonly pendingCredential: AuthCredential,
    public readonly provider: 'google' | 'apple'
  ) {
    const label = provider === 'google' ? 'Google' : 'Apple';
    super(
      `Un compte existe déjà avec ${email}. Entrez votre mot de passe ProDay pour lier ${label}.`
    );
    this.name = 'AuthLinkPasswordRequiredError';
  }
}
