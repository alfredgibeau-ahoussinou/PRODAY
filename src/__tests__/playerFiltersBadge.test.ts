import {
  DEFAULT_PLAYER_FILTERS,
  countActiveFilters,
  filterPlayers,
  nextPlayerBadgeFilter,
  playerBadgeFilterLabel,
} from '../utils/playerFilters';
import type { User } from '../models/User';

const player = (overrides: Partial<User> & { player_level?: User['player_level'] }): User =>
  ({
    uid: 'u1',
    display_name: 'J',
    email: 'j@test.com',
    role: 'player',
    is_verified: false,
    verification_status: 'NOT_REQUIRED',
    profile: { position: 'Attaquant', level: 'R3' },
    documents: [],
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true,
    ...overrides,
  }) as User;

describe('playerFilters — badge Pôle Joueur', () => {
  it('filtre par badge recruteur', () => {
    const users = [
      player({ uid: 'a', player_level: 'amateur' }),
      player({ uid: 'b', player_level: 'academy' }),
      player({ uid: 'c', player_level: 'professional' }),
    ];
    expect(filterPlayers(users, { ...DEFAULT_PLAYER_FILTERS, playerBadge: 'amateurs' })).toHaveLength(
      1,
    );
    expect(
      filterPlayers(users, { ...DEFAULT_PLAYER_FILTERS, playerBadge: 'centres_de_formation' })[0]
        ?.uid,
    ).toBe('b');
    expect(
      filterPlayers(users, { ...DEFAULT_PLAYER_FILTERS, playerBadge: 'professionnels' }),
    ).toHaveLength(1);
  });

  it('cycle les filtres badge', () => {
    expect(nextPlayerBadgeFilter('all')).toBe('amateurs');
    expect(playerBadgeFilterLabel('centres_de_formation')).toMatch(/centre/i);
    expect(countActiveFilters({ ...DEFAULT_PLAYER_FILTERS, playerBadge: 'amateurs' })).toBe(1);
  });
});
