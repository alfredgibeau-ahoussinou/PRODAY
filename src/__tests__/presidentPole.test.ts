import {
  canAccessPresidentPole,
} from '../features/president/navigation/canAccessPresidentPole';
import {
  canonicalizePresidentNav,
  findPresidentNavItem,
  PRESIDENT_HEALTH_AXIS_NAV,
  PRESIDENT_MENU_DEST_IDS,
  PRESIDENT_NAV_FOLDERS,
  PRESIDENT_PRIMARY_NAV_IDS,
} from '../features/president/navigation/presidentNavConfig';
import {
  findInPresidentNavCatalog,
  resolvePresidentCommandItems,
  resolvePresidentMenuItems,
  resolvePresidentNavFolders,
  resolvePresidentPrimaryNav,
} from '../features/president/navigation/resolvePresidentNavAccess';
import { buildPresidentHealth } from '../features/president/hooks/usePresidentHealth';
import type { ClubWorkspace } from '../features/club/hooks/useClubWorkspace';
import { poleShellTransitionDirection } from '../components/motion/PoleShellTransition';

describe('canAccessPresidentPole', () => {
  it('autorise un compte club rattaché', () => {
    expect(
      canAccessPresidentPole({
        role: 'club',
        uid: 'u1',
        clubId: 'c1',
      }),
    ).toBe(true);
  });

  it('autorise le owner même en mode strict', () => {
    expect(
      canAccessPresidentPole({
        role: 'club',
        uid: 'owner1',
        clubId: 'c1',
        clubOwnerUid: 'owner1',
        requireOwner: true,
      }),
    ).toBe(true);
  });

  it('refuse hors rôle club ou sans club', () => {
    expect(
      canAccessPresidentPole({ role: 'coach', uid: 'u1', clubId: 'c1' }),
    ).toBe(false);
    expect(
      canAccessPresidentPole({ role: 'club', uid: 'u1', clubId: null }),
    ).toBe(false);
    expect(
      canAccessPresidentPole({
        role: 'club',
        uid: 'u2',
        clubId: 'c1',
        clubOwnerUid: 'owner1',
        requireOwner: true,
      }),
    ).toBe(false);
  });
});

describe('president nav resolve', () => {
  it('expose cockpit dans le dock et le catalogue', () => {
    expect(PRESIDENT_PRIMARY_NAV_IDS).toContain('cockpit');
    expect(PRESIDENT_PRIMARY_NAV_IDS).toContain('menu');
    expect(findPresidentNavItem('finance')?.label).toBe('Finances');
    expect(canonicalizePresidentNav('menu')).toBe('cockpit');
  });

  it('résout dossiers, menu et commandes sans trou', () => {
    const folders = resolvePresidentNavFolders();
    expect(folders.length).toBe(PRESIDENT_NAV_FOLDERS.length);
    expect(folders.every((f) => f.items.length > 0)).toBe(true);

    const primary = resolvePresidentPrimaryNav();
    expect(primary).toHaveLength(PRESIDENT_PRIMARY_NAV_IDS.length);
    expect(primary.find((i) => i.id === 'menu')?.icon).toBe('hamburger');

    const menu = resolvePresidentMenuItems();
    expect(menu.map((i) => i.id)).toEqual(PRESIDENT_MENU_DEST_IDS);

    expect(findInPresidentNavCatalog('ai')?.hint).toMatch(/exécutif/i);
    expect(resolvePresidentCommandItems().some((i) => i.id === 'cockpit')).toBe(true);
  });

  it('mappe les axes santé vers des sections', () => {
    expect(PRESIDENT_HEALTH_AXIS_NAV.sport).toBe('sport');
    expect(PRESIDENT_HEALTH_AXIS_NAV.finance).toBe('finance');
    expect(PRESIDENT_HEALTH_AXIS_NAV.human).toBe('staff');
  });
});

describe('buildPresidentHealth', () => {
  it('calcule une santé globale depuis le workspace', () => {
    const ws = {
      teams: [{ id: 't1' }, { id: 't2' }],
      players: [{ uid: 'p1' }],
      coaches: [{ uid: 'c1' }],
      pendingMemberships: 1,
      teamsWithoutCoach: 0,
      todayMatches: [],
      todayTrainings: [{ id: 'tr1' }],
      events: [{ id: 'e1' }],
      club: { verified: true },
      briefingSummary: 'OK',
    } as unknown as ClubWorkspace;

    const health = buildPresidentHealth(ws);
    expect(health.overall).toBeGreaterThan(0);
    expect(health.axes).toHaveLength(5);
    expect(health.insights.length).toBeGreaterThan(0);
  });
});

describe('poleShellTransition Club ↔ Président', () => {
  it('Club → Président avance', () => {
    expect(poleShellTransitionDirection('club', 'president')).toBe(1);
  });

  it('Président → Club recule', () => {
    expect(poleShellTransitionDirection('president', 'club')).toBe(-1);
  });
});
