import { isJoueurPolePlayer, isJoueurPoleProductLine } from '../utils/joueurPoleAccess';
import type { User } from '../models/User';

function player(partial: Partial<User> & { product_line?: User['product_line'] }): User {
  return {
    uid: 'u1',
    display_name: 'Test',
    email: 't@t.com',
    role: 'player',
    is_verified: true,
    verification_status: 'VERIFIED',
    profile: {},
    documents: [],
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true,
    ...partial,
  } as User;
}

describe('joueurPoleAccess', () => {
  it('includes amateur and pro_player', () => {
    expect(isJoueurPolePlayer(player({ product_line: 'amateur' }))).toBe(true);
    expect(isJoueurPolePlayer(player({ product_line: 'pro_player' }))).toBe(true);
    expect(isJoueurPolePlayer(player({ product_line: 'homme' }))).toBe(true);
    expect(isJoueurPolePlayer(player({ product_line: 'woman' }))).toBe(true);
  });

  it('excludes club / coach lines', () => {
    expect(isJoueurPolePlayer(player({ role: 'coach', product_line: 'pro_staff' }))).toBe(
      false,
    );
    expect(isJoueurPoleProductLine('pro_club')).toBe(false);
    expect(isJoueurPoleProductLine('pro_player')).toBe(true);
  });
});
