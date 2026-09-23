jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('../lib/firebase', () => ({
  getDb: jest.fn(() => ({})),
  getFirebaseAuth: jest.fn(() => ({})),
  getFirebaseApp: () => null,
}));

jest.mock('../lib/firebaseFunctions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn((_storage: unknown, path: string) => ({ fullPath: path })),
  uploadBytesResumable: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  Timestamp: { now: () => ({ toMillis: () => Date.now(), toDate: () => new Date() }) },
}));
jest.mock('../services/profile.service', () => ({
  profileService: { updateProfile: jest.fn(() => Promise.resolve()) },
}));
jest.mock('../services/storage.service', () => ({
  uploadFile: jest.fn(),
}));

import React from 'react';
import {
  CLUB_CREATE_ACTIONS,
  CLUB_NAV_ITEMS,
  CLUB_TOOL_GROUPS,
  clubNavFromDashboard,
  clubNavFromTab,
  findClubNavItem,
  tabFromClubNav,
  type ClubNavItemId,
} from '../features/club/navigation/clubNavConfig';
import { renderClubSecondaryStub } from '../screens/club/ClubSecondaryScreens';
import { staffNotificationRoute } from '../utils/staffNotificationRouting';
import { buildClubHubAlerts, buildClubHubSettingsTiles } from '../features/club/ui/clubHubModel';

const ALL_EXPECTED_CLUB_NAV_IDS: ClubNavItemId[] = [
  'today',
  'teams',
  'players',
  'coaches',
  'calendar',
  'matches',
  'trainings',
  'communication',
  'club',
  'plus',
  'assistant',
  'events',
  'licenses',
  'finances',
  'sponsoring',
  'pack',
  'notifications',
  'permissions',
  'standings',
  'video',
  'carpool',
];

describe('Club Redirections & Navigation Integrity', () => {
  it('contient les destinations Club essentielles épurées sans exception', () => {
    expect(ALL_EXPECTED_CLUB_NAV_IDS.length).toBe(21);
    for (const navId of ALL_EXPECTED_CLUB_NAV_IDS) {
      const item = findClubNavItem(navId);
      expect(item).toBeDefined();
      expect(item?.id).toBe(navId);
      expect(item?.label.length).toBeGreaterThan(0);
      expect(item?.icon.length).toBeGreaterThan(0);
    }
  });

  it('résout chaque écran secondaire via renderClubSecondaryStub', () => {
    const secondaryIds: ClubNavItemId[] = [
      'events',
      'licenses',
      'finances',
      'sponsoring',
      'notifications',
      'permissions',
      'video',
      'carpool',
    ];

    for (const secId of secondaryIds) {
      const element = renderClubSecondaryStub(secId);
      expect(React.isValidElement(element)).toBe(true);
    }

    // Les destinations primaires ou plein écran retournent null pour être gérées par le switch principal
    expect(renderClubSecondaryStub('today')).toBeNull();
    expect(renderClubSecondaryStub('teams')).toBeNull();
    expect(renderClubSecondaryStub('matches')).toBeNull();
  });

  it('vérifie que toutes les actions CRÉER ont une redirection (nav) valide', () => {
    for (const action of CLUB_CREATE_ACTIONS) {
      expect(action.id).toBeDefined();
      expect(action.label).toBeDefined();
      if (action.nav) {
        expect(ALL_EXPECTED_CLUB_NAV_IDS).toContain(action.nav);
        expect(findClubNavItem(action.nav)).toBeDefined();
      }
    }
  });

  it('vérifie que toutes les alertes Hub redirigent vers une destination valide', () => {
    const alerts = buildClubHubAlerts({
      teamsWithoutCoach: 2,
      pendingMemberships: 3,
    });

    for (const alert of alerts) {
      expect(ALL_EXPECTED_CLUB_NAV_IDS).toContain(alert.nav);
      expect(findClubNavItem(alert.nav)).toBeDefined();
    }
  });

  it('vérifie que les tuiles réglages Hub redirigent correctement', () => {
    const tiles = buildClubHubSettingsTiles({
      hasPresident: true,
      packHint: 'SUR DEVIS',
    });

    for (const tile of tiles) {
      if (tile.nav) {
        expect(ALL_EXPECTED_CLUB_NAV_IDS).toContain(tile.nav);
      } else {
        expect(tile.president).toBe(true);
      }
    }
  });

  it('vérifie que les routes de notifications staff pointent vers des pages existantes', () => {
    const testTypes = [
      { type: 'player_late' as const, expected: 'trainings' },
      { type: 'parent_pickup_late' as const, expected: 'trainings' },
      { type: 'friendly_invite' as const, expected: 'matches' },
      { type: 'internal_move' as const, expected: 'players' },
    ];

    for (const test of testTypes) {
      const route = staffNotificationRoute({ type: test.type });
      expect(route.kind).toBe('clubNav');
      if (route.kind === 'clubNav') {
        expect(route.nav).toBe(test.expected);
        expect(ALL_EXPECTED_CLUB_NAV_IDS).toContain(route.nav);
      }
    }
  });

  it('vérifie que les deep links dashboard redirigent vers les bons modules', () => {
    expect(clubNavFromDashboard('gestion')).toBe('players');
    expect(clubNavFromDashboard('sponsors')).toBe('sponsoring');
    expect(clubNavFromDashboard('smart_tactics')).toBe('matches');
  });

  it('vérifie que les groupes de menu Tout ProDay couvrent les destinations sans doublons', () => {
    const allIds = CLUB_TOOL_GROUPS.flatMap((g) => g.ids);
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);

    for (const id of allIds) {
      expect(ALL_EXPECTED_CLUB_NAV_IDS).toContain(id);
    }
  });

  it('vérifie que tabFromClubNav et clubNavFromTab sont cohérents', () => {
    for (const navId of ALL_EXPECTED_CLUB_NAV_IDS) {
      const tab = tabFromClubNav(navId);
      expect(tab).toBeDefined();
      const roundTrip = clubNavFromTab(tab);
      expect(roundTrip).toBeDefined();
    }
  });

  it('vérifie que CLUB_MENU_ITEMS contient toutes les destinations secondaires attendues', () => {
    const { CLUB_MENU_ITEMS } = require('../features/club/shell/ClubMenuPane');
    expect(CLUB_MENU_ITEMS.length).toBeGreaterThanOrEqual(14);

    for (const item of CLUB_MENU_ITEMS) {
      expect(ALL_EXPECTED_CLUB_NAV_IDS).toContain(item.id);
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.icon.length).toBeGreaterThan(0);
    }
  });

  it('vérifie que buildClubHomeTeamCards attache le bon handler onPress vers l’équipe', () => {
    const { buildClubHomeTeamCards } = require('../features/club/ui/clubHomeAccueilModel');
    const mockRows = [
      {
        teamId: 'team-1',
        name: 'U17 R1',
        category: 'U17',
        genderLabel: 'Masculin',
        licensedCount: 18,
        coachNames: ['Jean Dupont'],
      },
      {
        teamId: 'team-2',
        name: 'Seniors A',
        category: 'Seniors',
        genderLabel: 'Masculin',
        licensedCount: 22,
        coachNames: [],
      },
    ];
    let clickedTeamId: string | null = null;
    const cards = buildClubHomeTeamCards(mockRows, 5, (id: string) => {
      clickedTeamId = id;
    });

    expect(cards.length).toBe(2);
    expect(cards[0].name).toBe('U17 R1');
    expect(cards[0].hasCoach).toBe(true);
    expect(cards[1].coachesLabel).toBe('Sans coach');
    cards[0].onPress();
    expect(clickedTeamId).toBe('team-1');
  });
});
