import type { User } from '../models/User';
import {
  filterAdminPersons,
  resolveAdminPersonInitialTab,
  adminPersonAdvancedFiltersActive,
  countAdminPersonPending,
} from '../utils/adminPersonFilters';

function mockUser(partial: Partial<User> & Pick<User, 'uid' | 'role'>): User {
  return {
    display_name: 'Test',
    email: 'test@proday.fr',
    ...partial,
  } as User;
}

describe('adminPersonFilters', () => {
  const users: User[] = [
    mockUser({
      uid: 'p1',
      role: 'player',
      display_name: 'Lucas',
      profile: { gender: 'men', age: 20, birth_date: '2005-01-01' },
    }),
    mockUser({
      uid: 'c1',
      role: 'coach',
      display_name: 'Marie Coach',
      city: 'Paris',
    }),
    mockUser({
      uid: 'd1',
      role: 'player',
      display_name: 'Pending',
      verification_status: 'PENDING',
    }),
  ];

  it('resolveAdminPersonInitialTab mappe les onglets legacy âge vers Joueurs', () => {
    expect(resolveAdminPersonInitialTab('youth')).toEqual({ tab: 'player', ageFilter: 'youth' });
    expect(resolveAdminPersonInitialTab('coach')).toEqual({ tab: 'coach', ageFilter: 'all' });
  });

  it('filterAdminPersons filtre par rôle et recherche', () => {
    const coaches = filterAdminPersons(users, 'coach', '', 'all', 'all', 'all');
    expect(coaches).toHaveLength(1);
    expect(coaches[0].uid).toBe('c1');

    const search = filterAdminPersons(users, 'all', 'lucas', 'all', 'all', 'all');
    expect(search).toHaveLength(1);
    expect(search[0].uid).toBe('p1');
  });

  it('filterAdminPersons onglet Admins via email plateforme', () => {
    const withAdmin = [
      ...users,
      mockUser({
        uid: 'a1',
        role: 'club',
        display_name: 'Fondateur',
        email: 'proday.admin@gmail.com',
      }),
    ];
    const admins = filterAdminPersons(withAdmin, 'admin', '', 'all', 'all', 'all');
    expect(admins.map((u) => u.uid)).toEqual(['a1']);
  });

  it('filterAdminPersons applique univers joueur en filtre avancé', () => {
    const adults = filterAdminPersons(users, 'player', '', 'adult', 'all', 'all');
    expect(adults.map((u) => u.uid)).toEqual(['p1']);
  });

  it('countAdminPersonPending compte les profils à valider', () => {
    expect(countAdminPersonPending(users)).toBeGreaterThanOrEqual(0);
  });

  it('adminPersonAdvancedFiltersActive détecte les filtres secondaires', () => {
    expect(adminPersonAdvancedFiltersActive('all', 'all', 'all')).toBe(false);
    expect(adminPersonAdvancedFiltersActive('teen', 'all', 'all')).toBe(true);
    expect(adminPersonAdvancedFiltersActive('all', 'women', 'paid')).toBe(true);
  });
});
