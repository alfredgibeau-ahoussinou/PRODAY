import {
  DEFAULT_PLAYER_FILTERS,
  countActiveFilters,
  filterPlayers,
  matchesGenderFilter,
  nextPlayerBadgeFilter,
  nextPlayerGenderFilter,
  playerBadgeFilterLabel,
  playerGenderFilterLabel,
  resolvePlayerGenderForFilter,
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

describe('playerFilters — genre Homme / Femme', () => {
  it('résout profile.gender déclaré', () => {
    expect(
      resolvePlayerGenderForFilter(player({ profile: { gender: 'women' } })),
    ).toBe('women');
    expect(resolvePlayerGenderForFilter(player({ profile: { gender: 'men' } }))).toBe('men');
  });

  it('déduit depuis product_line legacy et app_space', () => {
    expect(resolvePlayerGenderForFilter(player({ product_line: 'woman' }))).toBe('women');
    expect(resolvePlayerGenderForFilter(player({ product_line: 'homme' }))).toBe('men');
    expect(resolvePlayerGenderForFilter(player({ app_space: 'girls' }))).toBe('women');
    expect(resolvePlayerGenderForFilter(player({ app_space: 'boys' }))).toBe('men');
  });

  it('filtre l’annuaire par genre', () => {
    const users = [
      player({ uid: 'h', profile: { gender: 'men' } }),
      player({ uid: 'f', profile: { gender: 'women' } }),
      player({ uid: 'm', profile: { gender: 'minor' }, app_space: 'under_u13' }),
    ];
    expect(filterPlayers(users, { ...DEFAULT_PLAYER_FILTERS, gender: 'men' }).map((u) => u.uid)).toEqual([
      'h',
    ]);
    expect(
      filterPlayers(users, { ...DEFAULT_PLAYER_FILTERS, gender: 'women' }).map((u) => u.uid),
    ).toEqual(['f']);
    expect(matchesGenderFilter(users[2]!, 'men')).toBe(false);
    expect(matchesGenderFilter(users[2]!, 'women')).toBe(false);
  });

  it('cycle le filtre genre et compte les actifs', () => {
    expect(nextPlayerGenderFilter('all')).toBe('men');
    expect(nextPlayerGenderFilter('men')).toBe('women');
    expect(nextPlayerGenderFilter('women')).toBe('all');
    expect(playerGenderFilterLabel('women')).toBe('Femme');
    expect(countActiveFilters({ ...DEFAULT_PLAYER_FILTERS, gender: 'men' })).toBe(1);
  });
});
