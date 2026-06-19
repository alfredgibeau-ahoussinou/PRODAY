import { isSyntheticUser, filterRealUsers } from '../utils/realUserFilter';

describe('realUserFilter', () => {
  it('détecte les profils seed et tests de charge', () => {
    expect(isSyntheticUser({ uid: 'seed_player_1', email: 'a@b.com', display_name: 'Lucas' })).toBe(true);
    expect(isSyntheticUser({ uid: 'scale-u42', email: 'x@y.com', display_name: 'Test' })).toBe(true);
    expect(isSyntheticUser({ uid: 'real1', email: 'user42@scale.test', display_name: 'Paul' })).toBe(true);
    expect(isSyntheticUser({ uid: 'real2', email: 'a@b.com', display_name: 'Joueur 12' })).toBe(true);
  });

  it('conserve les vrais comptes', () => {
    expect(
      isSyntheticUser({ uid: 'abc123', email: 'moi@mail.com', display_name: 'Gibeau' }),
    ).toBe(false);
  });

  it('filtre une liste', () => {
    const users = [
      { uid: 'scale-u1', email: 'u@scale.test', display_name: 'Joueur 1' },
      { uid: 'me', email: 'moi@mail.com', display_name: 'Mon compte' },
    ];
    expect(filterRealUsers(users)).toHaveLength(1);
    expect(filterRealUsers(users)[0].uid).toBe('me');
  });
});
