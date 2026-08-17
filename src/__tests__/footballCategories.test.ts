import {
  FOOTBALL_AGE_CATEGORIES,
  FOOTBALL_COMPETITION_LEVELS,
  FOOTBALL_DISTRICT_CATEGORIES,
  FOOTBALL_EVENT_CATEGORY_GROUPS,
  FOOTBALL_ROSTER_CATEGORIES,
  categoriesForRole,
  defaultCategoriesForAppSpace,
  matchesFootballCategory,
  orderFootballCategoryGroups,
  normalizeFootballCategory,
} from '../constants/footballCategories';
import { PLAYER_CATEGORIES, PLAYER_LEVELS } from '../constants/playerProfile';
import { filterMembersByCategory } from '../utils/clubMembersFilter';
import type { User } from '../models/User';

describe('footballCategories', () => {
  it('expose les listes complètes ordonnées', () => {
    expect(FOOTBALL_AGE_CATEGORIES).toContain('U7');
    expect(FOOTBALL_AGE_CATEGORIES).toContain('U13 F');
    expect(FOOTBALL_AGE_CATEGORIES).toContain('Vétérans');
    expect(FOOTBALL_DISTRICT_CATEGORIES).toContain('U15 District');
    expect(FOOTBALL_DISTRICT_CATEGORIES).toContain('U17 F District');
    expect(FOOTBALL_ROSTER_CATEGORIES).toEqual([
      'U7',
      'U9',
      'U11',
      'U13',
      'U15',
      'U17',
      'U18',
      'U19',
      'Seniors',
      'Féminines',
    ]);
  });

  it('groupes UI couvrent poussins, jeunes, adultes et district', () => {
    const ids = FOOTBALL_EVENT_CATEGORY_GROUPS.map((g) => g.id);
    expect(ids).toEqual(['poussins', 'jeunes', 'adultes', 'district']);
    const allGrouped = FOOTBALL_EVENT_CATEGORY_GROUPS.flatMap((g) => g.items);
    expect(allGrouped).toContain('U11 F');
    expect(allGrouped).toContain('U19 District');
  });

  it('orderFootballCategoryGroups met adultes en tête pour détection', () => {
    const ordered = orderFootballCategoryGroups('adultes');
    expect(ordered.map((g) => g.id)).toEqual(['adultes', 'poussins', 'jeunes', 'district']);
    expect(orderFootballCategoryGroups()).toEqual(FOOTBALL_EVENT_CATEGORY_GROUPS);
    expect(orderFootballCategoryGroups('adultes')).toHaveLength(4);
  });

  it('inclut District dans les niveaux de compétition', () => {
    expect(FOOTBALL_COMPETITION_LEVELS[0]).toBe('Loisir');
    expect(FOOTBALL_COMPETITION_LEVELS).toContain('District');
    expect(FOOTBALL_COMPETITION_LEVELS).toContain('Départemental');
    expect(PLAYER_LEVELS).toContain('District');
  });

  it('réexporte playerProfile depuis la source unique', () => {
    expect(PLAYER_CATEGORIES).toBe(FOOTBALL_AGE_CATEGORIES);
  });

  it('categoriesForRole respecte l\'espace app', () => {
    expect(defaultCategoriesForAppSpace('boys')).toEqual(['U13', 'U15', 'U17', 'U18', 'U19']);
    expect(categoriesForRole('under_u13', 'women')).toEqual(['U7 F', 'U9 F', 'U11 F']);
  });

  it('normalizeFootballCategory retire le suffixe district', () => {
    expect(normalizeFootballCategory('U13 District')).toBe('U13');
    expect(normalizeFootballCategory('U15 F District')).toBe('U15 F');
  });

  it('matchesFootballCategory aligne U13 et U13 District', () => {
    expect(matchesFootballCategory('U13', ['U13 District'])).toBe(true);
    expect(matchesFootballCategory('U13 District', ['U13'])).toBe(true);
    expect(matchesFootballCategory('U13 F', ['U13'])).toBe(false);
    expect(matchesFootballCategory('U13 F District', ['U13 F'])).toBe(true);
  });

  it('filterMembersByCategory utilise le matching district', () => {
    const members = [
      { uid: 'a', profile: { category: 'U15' } },
      { uid: 'b', profile: { category: 'U15 District' } },
      { uid: 'c', profile: { category: 'U17' } },
    ] as User[];

    const filtered = filterMembersByCategory(members, ['U15 District']);
    expect(filtered.map((m) => m.uid).sort()).toEqual(['a', 'b']);
  });
});
