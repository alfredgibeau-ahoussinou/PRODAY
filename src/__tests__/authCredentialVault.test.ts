import { maskEmail, parseSavedCredentials } from '../utils/authCredentialHelpers';

describe('authCredentialVault', () => {
  it('parseSavedCredentials valide email et mot de passe', () => {
    const raw = JSON.stringify({ email: '  a@b.com ', password: 'secret' });
    expect(parseSavedCredentials(raw)).toEqual({ email: 'a@b.com', password: 'secret' });
  });

  it('parseSavedCredentials rejette les payloads invalides', () => {
    expect(parseSavedCredentials(null)).toBeNull();
    expect(parseSavedCredentials('{}')).toBeNull();
    expect(parseSavedCredentials('{bad')).toBeNull();
  });

  it('maskEmail masque le nom utilisateur', () => {
    expect(maskEmail('jean.dupont@proday.fr')).toBe('je•••@proday.fr');
    expect(maskEmail('ab@test.com')).toBe('ab@test.com');
  });
});
