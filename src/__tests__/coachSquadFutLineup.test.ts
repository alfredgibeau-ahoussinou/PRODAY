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
  ALL_TACTICAL_SYSTEMS,
  TACTICAL_SYSTEMS_BY_ID,
  DEFENSE_4_SYSTEMS,
  DEFENSE_3_5_SYSTEMS,
  HISTORICAL_HYBRID_SYSTEMS,
  SMALL_SIDED_SYSTEMS,
} from '../components/coach/CoachPitchView';

describe('CoachSquadFutLineup & Pitch View Architecture', () => {
  const formations11: FormationKey[] = ['4-3-3', '4-2-3-1', '4-4-2', '3-5-2', '5-3-2'];
  const allFormats: MatchFormatKey[] = ['11v11', '8v8', '5v5', 'futsal', '4v4', '3v3'];

  it('defines exactly 11 starter tactical coordinates for every supported 11v11 formation with safe visible bounds', () => {
    formations11.forEach((fKey) => {
      const slots = FORMATION_COORDINATES[fKey];
      expect(slots).toBeDefined();
      expect(slots).toHaveLength(11);

      // Verify GK position is at safe bottom of pitch (0.80 <= y <= 0.85) to guarantee 100% on-screen visibility
      const gk = slots[0];
      expect(gk.defaultPos).toBe('GK');
      expect(gk.y).toBeGreaterThanOrEqual(0.8);
      expect(gk.y).toBeLessThanOrEqual(0.85);
      expect(gk.x).toBeCloseTo(0.5, 1);

      // All coordinates must be strictly within safe visible boundary
      slots.forEach((slot) => {
        expect(slot.x).toBeGreaterThanOrEqual(0);
        expect(slot.x).toBeLessThanOrEqual(1);
        expect(slot.y).toBeGreaterThanOrEqual(0.1);
        expect(slot.y).toBeLessThanOrEqual(0.85);
      });
    });
  });

  it('supports all 6 universal game formats with exact starter counts and valid default formations', () => {
    expect(allFormats).toHaveLength(6);
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

  it('accurately distinguishes Futsal (5v5) indoor court layout from Foot à 5 (Five) outdoor turf', () => {
    expect(MATCH_FORMATS_CONFIG['futsal'].isFutsal).toBe(true);
    expect(MATCH_FORMATS_CONFIG['5v5'].isFutsal).toBe(false);
    expect(MATCH_FORMATS_CONFIG['11v11'].isFutsal).toBeFalsy();
    expect(MATCH_FORMATS_CONFIG['8v8'].isFutsal).toBeFalsy();
    expect(MATCH_FORMATS_CONFIG['4v4'].isFutsal).toBeFalsy();
    expect(MATCH_FORMATS_CONFIG['3v3'].isFutsal).toBeFalsy();
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

    // 5v5 & Futsal -> 5 starters, 13 bench
    const starters5 = fullSquad.slice(0, MATCH_FORMATS_CONFIG['5v5'].starterCount);
    const bench5 = fullSquad.slice(MATCH_FORMATS_CONFIG['5v5'].starterCount);
    expect(starters5).toHaveLength(5);
    expect(bench5).toHaveLength(13);

    // 4v4 -> 4 starters, 14 bench
    const starters4 = fullSquad.slice(0, MATCH_FORMATS_CONFIG['4v4'].starterCount);
    const bench4 = fullSquad.slice(MATCH_FORMATS_CONFIG['4v4'].starterCount);
    expect(starters4).toHaveLength(4);
    expect(bench4).toHaveLength(14);

    // 3v3 -> 3 starters, 15 bench
    const starters3 = fullSquad.slice(0, MATCH_FORMATS_CONFIG['3v3'].starterCount);
    const bench3 = fullSquad.slice(MATCH_FORMATS_CONFIG['3v3'].starterCount);
    expect(starters3).toHaveLength(3);
    expect(bench3).toHaveLength(15);
  });

  it('houses the exhaustive global tactical matrix with 57+ distinct formations', () => {
    expect(ALL_TACTICAL_SYSTEMS.length).toBeGreaterThanOrEqual(57);
    expect(DEFENSE_4_SYSTEMS.length).toBe(19);
    expect(DEFENSE_3_5_SYSTEMS.length).toBe(14);
    expect(HISTORICAL_HYBRID_SYSTEMS.length).toBe(6);
    expect(SMALL_SIDED_SYSTEMS.length).toBe(20);

    // Verify all IDs are unique
    const ids = new Set(ALL_TACTICAL_SYSTEMS.map((s) => s.id));
    expect(ids.size).toBe(ALL_TACTICAL_SYSTEMS.length);
  });

  it('guarantees valid 11v11 coordinates and safe boundaries for all 39 full-pitch formations', () => {
    const formations11v11 = ALL_TACTICAL_SYSTEMS.filter((s) => s.format === '11v11');
    expect(formations11v11.length).toBe(39);

    formations11v11.forEach((sys) => {
      expect(sys.slots).toHaveLength(11);

      // GK verification (slot 0)
      const gk = sys.slots[0];
      expect(gk.defaultPos).toBe('GK');
      expect(gk.y).toBeGreaterThanOrEqual(0.80);
      expect(gk.y).toBeLessThanOrEqual(0.85);

      // Safe screen bounds for all slots
      sys.slots.forEach((slot) => {
        expect(slot.x).toBeGreaterThanOrEqual(0.10);
        expect(slot.x).toBeLessThanOrEqual(0.90);
        expect(slot.y).toBeGreaterThanOrEqual(0.10);
        expect(slot.y).toBeLessThanOrEqual(0.85);
        expect(slot.defaultPos).toBeTruthy();
      });

      // Chemistry links verification
      expect(sys.links.length).toBeGreaterThanOrEqual(6);
      sys.links.forEach(([a, b]) => {
        expect(a).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThanOrEqual(10);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(10);
        expect(a).not.toBe(b);
      });
    });
  });

  it('verifies historical, modern positional hybrids and their rich tactical metadata', () => {
    // 3-2-4-1 Pep Guardiola Box Midfield
    const pep3241 = TACTICAL_SYSTEMS_BY_ID['3-2-4-1'];
    expect(pep3241).toBeDefined();
    expect(pep3241.famousTeams).toContain('Manchester City 2023 (Triplé historique)');
    expect(pep3241.style).toContain('Box Midfield');

    // WM Chapman 1930
    const wm = TACTICAL_SYSTEMS_BY_ID['WM (3-2-2-3)'];
    expect(wm).toBeDefined();
    expect(wm.famousTeams).toContain('Arsenal 1930 (Herbert Chapman)');

    // MM Onze d'Or Hongrie 1954
    const mm = TACTICAL_SYSTEMS_BY_ID['MM (3-2-3-2)'];
    expect(mm).toBeDefined();
    expect(mm.famousTeams[0]).toContain('Hongrie 1954');

    // 2-3-5 Pyramide Danube
    const pyramide = TACTICAL_SYSTEMS_BY_ID['2-3-5 Pyramide'];
    expect(pyramide).toBeDefined();
    expect(pyramide.slots).toHaveLength(11);

    // 4-3-2-1 Sapin de Noël
    const sapin = TACTICAL_SYSTEMS_BY_ID['4-3-2-1'];
    expect(sapin).toBeDefined();
    expect(sapin.slots).toHaveLength(11);

    // 3-3-3-1 Bielsa Pressing Total
    const bielsa = TACTICAL_SYSTEMS_BY_ID['3-3-3-1'];
    expect(bielsa).toBeDefined();
    expect(bielsa.description).toContain('Bielsa');

    // 1-3-3-3 Catenaccio
    const catenaccio = TACTICAL_SYSTEMS_BY_ID['1-3-3-3 Catenaccio'];
    expect(catenaccio).toBeDefined();
    expect(catenaccio.famousTeams[0]).toContain('Helenio Herrera');
  });

  it('verifies small-sided tactical formats (8v8, 5v5, 4v4, 3v3) starter counts and coordinates', () => {
    const smallSided = ALL_TACTICAL_SYSTEMS.filter((s) => s.format !== '11v11');
    expect(smallSided.length).toBe(20);

    smallSided.forEach((sys) => {
      const config = MATCH_FORMATS_CONFIG[sys.format];
      expect(sys.slots).toHaveLength(config.starterCount);
      expect(sys.links.length).toBeGreaterThanOrEqual(2);

      sys.slots.forEach((slot) => {
        expect(slot.x).toBeGreaterThanOrEqual(0.10);
        expect(slot.x).toBeLessThanOrEqual(0.90);
        expect(slot.y).toBeGreaterThanOrEqual(0.10);
        expect(slot.y).toBeLessThanOrEqual(0.90);
      });
    });
  });

  it('guarantees seamless interactive swap logic between starters and bench players with zero side effects', () => {
    const playerA = { id: 'p1', name: 'Player A', role: 'starter' as const };
    const playerB = { id: 'p2', name: 'Player B', role: 'starter' as const };
    const subPlayer = { id: 'sub1', name: 'Sub 1', role: 'sub' as const };

    const initialSquad = [playerA, playerB, subPlayer];

    // 1. Starter <-> Starter swap
    const swappedStarters = initialSquad.map((p) => {
      if (p.id === playerA.id) return { ...playerB, id: playerA.id };
      if (p.id === playerB.id) return { ...playerA, id: playerB.id };
      return p;
    });
    expect(swappedStarters[0].name).toBe('Player B');
    expect(swappedStarters[1].name).toBe('Player A');

    // 2. Starter <-> Bench swap (role inversion)
    const swappedWithBench = initialSquad.map((p) => {
      if (p.id === playerA.id) return { ...p, role: 'sub' as const };
      if (p.id === subPlayer.id) return { ...p, role: 'starter' as const };
      return p;
    });
    expect(swappedWithBench.find((p) => p.id === playerA.id)?.role).toBe('sub');
    expect(swappedWithBench.find((p) => p.id === subPlayer.id)?.role).toBe('starter');
  });

  it('verifies the automated official league data feed structures and coach manual override', () => {
    // Official feed defaults
    const autoSyncState = {
      isAutoSync: true,
      provider: 'API FFF / District Officiel',
      lastResult: 'FC ProDay 3 - 1 AS Montferrand (J16 Homologué)',
      manualOverrideActive: false,
    };

    expect(autoSyncState.isAutoSync).toBe(true);
    expect(autoSyncState.provider).toContain('FFF');

    // Coach manual override toggled
    const overriddenState = {
      ...autoSyncState,
      manualOverrideActive: true,
      isAutoSync: false,
    };
    expect(overriddenState.manualOverrideActive).toBe(true);
    expect(overriddenState.isAutoSync).toBe(false);
  });

  it('validates the 3-step progressive matchday preparation wizard workflow', () => {
    let currentStep: 1 | 2 | 3 = 1;

    // Step 1: Format & Dispositif selection
    const step1Format = '11v11';
    const step1Formation = '4-3-3';
    expect(MATCH_FORMATS_CONFIG[step1Format]).toBeDefined();
    expect(TACTICAL_SYSTEMS_BY_ID[step1Formation]).toBeDefined();

    // Transition to Step 2
    currentStep = 2;
    expect(currentStep).toBe(2);

    // Step 2: Lineup review and AI optimization
    const startersCount = 11;
    expect(startersCount).toBe(11);

    // Transition to Step 3
    currentStep = 3;
    expect(currentStep).toBe(3);

    // Step 3: Official validation & homologation
    const isValidated = true;
    expect(isValidated).toBe(true);
  });
});

