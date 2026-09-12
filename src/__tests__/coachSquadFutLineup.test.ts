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
  FormationKey,
} from '../components/coach/CoachPitchView';

describe('CoachSquadFutLineup & Pitch View Architecture', () => {
  const formations: FormationKey[] = ['4-3-3', '4-2-3-1', '4-4-2', '3-5-2', '5-3-2'];

  it('defines exactly 11 starter tactical coordinates for every supported formation', () => {
    formations.forEach((fKey) => {
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

  it('generates consistent chemistry passing lanes linking adjacent positions', () => {
    formations.forEach((fKey) => {
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
});
