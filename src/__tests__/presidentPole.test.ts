import {
  canAccessPresidentPole,
} from '../features/president/navigation/canAccessPresidentPole';
import {
  canonicalizePresidentNav,
  findPresidentNavItem,
  PRESIDENT_HEALTH_AXIS_NAV,
  PRESIDENT_MENU_DEST_IDS,
  PRESIDENT_NAV_CATALOG,
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
import {
  carouselPoleSignupPresetRole,
  carouselPoleToProductLine,
  productLineToCarouselPole,
} from '../models/CarouselPole';
import {
  clubShellModeFromCarouselPole,
  normalizeClubShellMode,
} from '../models/ClubShellMode';

describe('canAccessPresidentPole', () => {
  it('autorise uniquement le owner (compte président)', () => {
    expect(
      canAccessPresidentPole({
        role: 'club',
        uid: 'owner1',
        clubId: 'c1',
        clubOwnerUid: 'owner1',
      }),
    ).toBe(true);
  });

  it('refuse le staff club (même rôle club, non owner)', () => {
    expect(
      canAccessPresidentPole({
        role: 'club',
        uid: 'staff1',
        clubId: 'c1',
        clubOwnerUid: 'owner1',
      }),
    ).toBe(false);
  });

  it('refuse sans owner_uid connu (fail closed)', () => {
    expect(
      canAccessPresidentPole({
        role: 'club',
        uid: 'u1',
        clubId: 'c1',
      }),
    ).toBe(false);
  });

  it('refuse hors rôle club ou sans club', () => {
    expect(
      canAccessPresidentPole({
        role: 'coach',
        uid: 'u1',
        clubId: 'c1',
        clubOwnerUid: 'u1',
      }),
    ).toBe(false);
    expect(
      canAccessPresidentPole({
        role: 'club',
        uid: 'u1',
        clubId: null,
        clubOwnerUid: 'u1',
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

  it('différencie le dock Président du dock Coach (pas de chrome séance/matchs)', () => {
    const primary = resolvePresidentPrimaryNav();
    const labels = primary.map((i) => i.shortLabel ?? i.label);
    expect(labels).toEqual(
      expect.arrayContaining(['Cockpit', 'Club', 'Finances', 'Menu', 'IA']),
    );
    expect(labels).not.toContain('Séances');
    expect(labels).not.toContain('Matchs');
    expect(labels).not.toContain('Joueurs');
    expect(findPresidentNavItem('staff')?.label).toBe('Staff');
    expect(findPresidentNavItem('recruitment')?.label).toBe('Recrutement');
    expect(findPresidentNavItem('video')?.label).toBe('Vidéo');
    expect(PRESIDENT_MENU_DEST_IDS).toEqual(
      expect.arrayContaining(['recruitment', 'video', 'teams', 'communication']),
    );
    expect(PRESIDENT_NAV_CATALOG.every((i) => !('clubDeepLink' in i))).toBe(true);
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

describe('Président sélectionnable au carousel (lien Club)', () => {
  it('mappe le pôle Président sur product_line Club + preset club', () => {
    expect(carouselPoleToProductLine('president')).toBe('pro_club');
    expect(carouselPoleSignupPresetRole('president')).toBe('club');
    expect(clubShellModeFromCarouselPole('president')).toBe('president');
    expect(clubShellModeFromCarouselPole('pro_club')).toBe('club');
    expect(normalizeClubShellMode('president')).toBe('president');
    expect(normalizeClubShellMode(null)).toBe('club');
  });

  it('distingue Club et Président dans le mapping inverse', () => {
    expect(productLineToCarouselPole('pro_club', 'club')).toBe('pro_club');
    expect(productLineToCarouselPole('pro_club', 'club', 'president')).toBe('president');
  });
});
