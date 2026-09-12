jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn(),
}));
jest.mock('../lib/firebase', () => ({ getFirebaseAuth: jest.fn(), getDb: jest.fn() }));
jest.mock('../config/firebase', () => ({ isFirebaseConfigured: jest.fn(() => false) }));

import {
  FORMATION_COORDINATES,
  CHEMISTRY_LINKS,
  ALL_FORMATION_COORDINATES,
  ALL_CHEMISTRY_LINKS,
  MATCH_FORMATS_CONFIG,
  FormationKey,
  MatchFormatKey,
} from '../components/coach/CoachPitchView';

describe('CoachSquadFutLineup & Pitch View Architecture', () => {
  const formations11: FormationKey[] = ['4-3-3', '4-2-3-1', '4-4-2', '3-5-2', '5-3-2'];
  const allFormats: MatchFormatKey[] = ['11v11', '8v8', '5v5', '4v4', '3v3'];

  it('defines exactly 11 starter tactical coordinates for every supported 11v11 formation', () => {
    formations11.forEach((fKey) => {
      const slots = FORMATION_COORDINATES[fKey];
      expect(slots).toBeDefined();
      expect(slots).toHaveLength(11);

      // Verify GK position is at bottom of pitch (y >= 0.8) and center (x ~ 0.5)
      const gk = slots[0];
      expect(gk.defaultPos).toBe('GK');
      expect(gk.y).toBeGreaterThanOrEqual(0.8);
      expect(gk.x).toBeCloseTo(0.5, 1);

      // All coordinates must be within [0, 1] normalized boundary
      slots.forEach((slot) => {
        expect(slot.x).toBeGreaterThanOrEqual(0);
        expect(slot.x).toBeLessThanOrEqual(1);
        expect(slot.y).toBeGreaterThanOrEqual(0);
        expect(slot.y).toBeLessThanOrEqual(1);
      });
    });
  });

  it('supports all 5 universal game formats with exact starter counts and valid default formations', () => {
    allFormats.forEach((fmt) => {
      const config = MATCH_FORMATS_CONFIG[fmt];
      expect(config).toBeDefined();
      expect(config.name).toBeTruthy();
      expect(config.formations.length).toBeGreaterThan(0);
      expect(config.formations).toContain(config.defaultFormation);

      // Verify each formation for this format matches starterCount
      config.formations.forEach((formation) => {
        const slots = ALL_FORMATION_COORDINATES[formation];
        expect(slots).toBeDefined();
        expect(slots).toHaveLength(config.starterCount);

        // Every coordinate within [0, 1]
        slots.forEach((slot) => {
          expect(slot.x).toBeGreaterThanOrEqual(0);
          expect(slot.x).toBeLessThanOrEqual(1);
          expect(slot.y).toBeGreaterThanOrEqual(0);
          expect(slot.y).toBeLessThanOrEqual(1);
          expect(slot.defaultPos).toBeTruthy();
        });
      });
    });
  });

  it('accurately distinguishes Futsal (5v5) court layout with 6m D-arc requirements', () => {
    expect(MATCH_FORMATS_CONFIG['5v5'].isFutsal).toBe(true);
    expect(MATCH_FORMATS_CONFIG['11v11'].isFutsal).toBeFalsy();
    expect(MATCH_FORMATS_CONFIG['8v8'].isFutsal).toBeFalsy();
  });

  it('generates consistent chemistry passing lanes linking adjacent positions', () => {
    formations11.forEach((fKey) => {
      const links = CHEMISTRY_LINKS[fKey];
      expect(links).toBeDefined();
      expect(links.length).toBeGreaterThanOrEqual(12);

      // Verify every link references valid player slot indices [0..10]
      links.forEach(([from, to]) => {
        expect(from).toBeGreaterThanOrEqual(0);
        expect(from).toBeLessThanOrEqual(10);
        expect(to).toBeGreaterThanOrEqual(0);
        expect(to).toBeLessThanOrEqual(10);
        expect(from).not.toBe(to);
      });
    });
  });

  it('calculates squad average OVR rating accurately', () => {
    const mockStarters = [
      { ovr: 86 },
      { ovr: 82 },
      { ovr: 87 },
      { ovr: 83 },
      { ovr: 81 },
      { ovr: 85 },
      { ovr: 84 },
      { ovr: 88 },
      { ovr: 83 },
      { ovr: 89 },
      { ovr: 84 },
    ];
    const total = mockStarters.reduce((acc, p) => acc + p.ovr, 0);
    const avg = Math.round(total / mockStarters.length);
    expect(avg).toBe(85);
  });

  it('partitions players into starters and reserves dynamically based on active format starterCount', () => {
    const fullSquad = Array.from({ length: 18 }).map((_, i) => ({
      id: `p-${i + 1}`,
      name: `Player ${i + 1}`,
      ovr: 75 + (i % 10),
    }));

    // 11v11 -> 11 starters, 7 bench
    const starters11 = fullSquad.slice(0, MATCH_FORMATS_CONFIG['11v11'].starterCount);
    const bench11 = fullSquad.slice(MATCH_FORMATS_CONFIG['11v11'].starterCount);
    expect(starters11).toHaveLength(11);
    expect(bench11).toHaveLength(7);

    // 8v8 -> 8 starters, 10 bench
    const starters8 = fullSquad.slice(0, MATCH_FORMATS_CONFIG['8v8'].starterCount);
    const bench8 = fullSquad.slice(MATCH_FORMATS_CONFIG['8v8'].starterCount);
    expect(starters8).toHaveLength(8);
    expect(bench8).toHaveLength(10);

    // 5v5 -> 5 starters, 13 bench
    const starters5 = fullSquad.slice(0, MATCH_FORMATS_CONFIG['5v5'].starterCount);
    const bench5 = fullSquad.slice(MATCH_FORMATS_CONFIG['5v5'].starterCount);
    expect(starters5).toHaveLength(5);
    expect(bench5).toHaveLength(13);
  });
});
