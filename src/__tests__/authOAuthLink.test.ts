import { AuthLinkPasswordRequiredError } from '../utils/authErrors';
import {
  decodeJwtEmail,
  getFirebaseAuthErrorCode,
  humanizeAuthErrorText,
  isOAuthProviderUser,
  normalizeAuthEmail,
  oauthProviderLabel,
  resolveSignupOAuthState,
} from '../utils/authOAuthLink';

function fakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

describe('authOAuthLink', () => {
  it('decodeJwtEmail extrait et normalise l’email', () => {
    const token = fakeJwt({ email: '  User@Example.COM ' });
    expect(decodeJwtEmail(token)).toBe('user@example.com');
  });

  it('decodeJwtEmail retourne null si token invalide', () => {
    expect(decodeJwtEmail('not-a-jwt')).toBeNull();
    expect(decodeJwtEmail('a.b')).toBeNull();
  });

  it('normalizeAuthEmail trim et lowercase', () => {
    expect(normalizeAuthEmail('  A@B.com ')).toBe('a@b.com');
    expect(normalizeAuthEmail('')).toBeNull();
    expect(normalizeAuthEmail(undefined)).toBeNull();
  });

  it('getFirebaseAuthErrorCode lit le code Firebase', () => {
    expect(getFirebaseAuthErrorCode({ code: 'auth/wrong-password' })).toBe(
      'auth/wrong-password'
    );
    expect(getFirebaseAuthErrorCode(new Error('x'))).toBe('');
  });

  it('humanizeAuthErrorText masque le JSON Firebase brut', () => {
    const raw =
      'An internal error has occurred. Raw server response: "{"error":{"code":400,"message":"TOO_MANY_ATTEMPTS_TRY_LATER"}}"';
    expect(humanizeAuthErrorText(raw)).toContain('Trop de tentatives');
    expect(humanizeAuthErrorText(raw)).not.toContain('Raw server response');
  });

  it('oauthProviderLabel', () => {
    expect(oauthProviderLabel('google')).toBe('Google');
    expect(oauthProviderLabel('apple')).toBe('Apple');
  });

  it('AuthLinkPasswordRequiredError contient email et provider', () => {
    const pending = { providerId: 'google.com' } as never;
    const err = new AuthLinkPasswordRequiredError('a@b.com', pending, 'google');
    expect(err.code).toBe('auth/link-password-required');
    expect(err.email).toBe('a@b.com');
    expect(err.provider).toBe('google');
    expect(err.message).toContain('a@b.com');
    expect(err.message).toContain('Google');
  });

  describe('resolveSignupOAuthState', () => {
    it('inscription email/mot de passe : email éditable sans session OAuth', () => {
      expect(resolveSignupOAuthState(null)).toEqual({
        isOAuthCompletion: false,
        providerEmail: '',
        isEmailEditable: true,
      });
    });

    it('session email/mot de passe existante : email éditable', () => {
      expect(
        resolveSignupOAuthState({
          email: 'user@example.com',
          providerData: [{ providerId: 'password' }],
        })
      ).toEqual({
        isOAuthCompletion: false,
        providerEmail: 'user@example.com',
        isEmailEditable: true,
      });
    });

    it('OAuth Google avec email : email verrouillé', () => {
      expect(
        resolveSignupOAuthState({
          email: 'user@gmail.com',
          providerData: [{ providerId: 'google.com' }],
        })
      ).toEqual({
        isOAuthCompletion: true,
        providerEmail: 'user@gmail.com',
        isEmailEditable: false,
      });
    });

    it('OAuth Apple sans email partagé : email éditable', () => {
      expect(
        resolveSignupOAuthState({
          email: null,
          providerData: [{ providerId: 'apple.com' }],
        })
      ).toEqual({
        isOAuthCompletion: true,
        providerEmail: '',
        isEmailEditable: true,
      });
    });

    it('isOAuthProviderUser détecte Google et Apple uniquement', () => {
      expect(isOAuthProviderUser({ providerData: [{ providerId: 'google.com' }] })).toBe(true);
      expect(isOAuthProviderUser({ providerData: [{ providerId: 'apple.com' }] })).toBe(true);
      expect(isOAuthProviderUser({ providerData: [{ providerId: 'password' }] })).toBe(false);
    });
  });
});
