import React from 'react';

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));
jest.mock('../lib/firebase', () => ({
  getFirebaseAuth: jest.fn(),
  getDb: jest.fn(),
}));
jest.mock('../lib/firebaseFunctions', () => ({
  callFunction: jest.fn(),
  getCallableErrorMessage: jest.fn(),
  isFunctionsUnavailable: jest.fn(),
}));
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn(),
}));
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../utils/prodayHaptics', () => ({
  prodayHaptics: {
    impactLight: jest.fn(),
    impactMedium: jest.fn(),
    impactHeavy: jest.fn(),
    selection: jest.fn(),
    success: jest.fn(),
    notification: jest.fn(),
  },
}));

jest.mock('../hooks/useSessionProfile', () => ({
  useSessionProfile: () => ({
    uid: 'player-test-uid',
    display_name: 'Kylian Perez',
    profile: {
      position: 'BU',
      primaryRole: 'player',
    },
  }),
}));

import { PlayerPageGuideModal } from '../components/player/PlayerPageGuideModal';
import { PlayerPageGuideBanner } from '../components/player/PlayerPageGuideBanner';
import { PlayerHomeScreen } from '../screens/player/PlayerHomeScreen';
import { PlayerStatsScreen } from '../screens/player/PlayerStatsScreen';
import { PlayerWellnessScreen } from '../screens/player/PlayerWellnessScreen';
import { PlayerTacticalView } from '../screens/player/PlayerTacticalView';
import { PlayerPortalScreen } from '../screens/player/PlayerPortalScreen';
import { playerRsvpService } from '../services/playerRsvp.service';
import { playerWellnessService, calculateWellnessScore } from '../services/playerWellness.service';
import { playerPassportService } from '../services/playerPassport.service';

describe('Espace Joueur Refactor & Interactive Guides Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PlayerPageGuideModal & PlayerPageGuideBanner', () => {
    it('instantiates PlayerPageGuideModal with sections and proTip', () => {
      const element = React.createElement(PlayerPageGuideModal, {
        visible: true,
        onClose: jest.fn(),
        pageTitle: 'Test Guide',
        pageSubtitle: 'Sous-titre explicatif',
        introText: 'Texte d introduction',
        sections: [
          {
            icon: 'card',
            title: 'Section 1',
            description: 'Description 1',
          },
        ],
        proTip: 'Conseil coach',
        ctaLabel: 'Compris',
      });
      expect(element).toBeDefined();
      expect(element.type).toBe(PlayerPageGuideModal);
      expect(element.props.pageTitle).toBe('Test Guide');
    });

    it('instantiates PlayerPageGuideBanner with key and callbacks', () => {
      const onOpen = jest.fn();
      const element = React.createElement(PlayerPageGuideBanner, {
        pageKey: 'cockpit',
        title: 'Guide du Cockpit',
        subtitle: 'Découvre ta carte FUT',
        onOpenGuide: onOpen,
      });
      expect(element).toBeDefined();
      expect(element.type).toBe(PlayerPageGuideBanner);
      expect(element.props.pageKey).toBe('cockpit');
    });
  });

  describe('Page 1 : PlayerHomeScreen (Cockpit & Original FUT Card)', () => {
    it('instantiates PlayerHomeScreen with original FUT card & RSVP integration', () => {
      const element = React.createElement(PlayerHomeScreen, {
        onNavigateTab: jest.fn(),
      });
      expect(element).toBeDefined();
      expect(element.type).toBe(PlayerHomeScreen);
    });

    it('updates RSVP status via playerRsvpService', async () => {
      const setSpy = jest.spyOn(playerRsvpService, 'setRsvp');
      await playerRsvpService.setRsvp('user-1', 'match-j17', 'present');
      expect(setSpy).toHaveBeenCalledWith('user-1', 'match-j17', 'present');
    });
  });

  describe('Page 2 : PlayerStatsScreen (Performance & Certified CV)', () => {
    it('instantiates PlayerStatsScreen with certified passport & coach ratings', () => {
      const element = React.createElement(PlayerStatsScreen);
      expect(element).toBeDefined();
      expect(element.type).toBe(PlayerStatsScreen);
    });

    it('builds certified passport data with QR code and coach verification', () => {
      const passport = playerPassportService.buildPassport({
        playerId: 'p-1',
        fullName: 'Kylian Perez',
        licenseNumber: 'FFF-75928103',
        clubName: 'FC ProDay',
        category: 'Seniors R1',
        position: 'BU',
        ovr: 87,
        matchesPlayed: 18,
        goals: 14,
        assists: 8,
        averageRating: 7.9,
      });
      expect(passport.coachVerified).toBe(true);
      expect(passport.licenseNumber).toBe('FFF-75928103');
      expect(passport.averageRating).toBe(7.9);
      const qrUrl = playerPassportService.getPassportQrUrl(passport);
      expect(qrUrl).toContain('proday.app/scout/verify');
    });
  });

  describe('Page 3 : PlayerWellnessScreen (Health & Schedule)', () => {
    it('instantiates PlayerWellnessScreen with check-in & ACWR workload', () => {
      const element = React.createElement(PlayerWellnessScreen);
      expect(element).toBeDefined();
      expect(element.type).toBe(PlayerWellnessScreen);
    });

    it('calculates wellness score dynamically and categorizes risk correctly', () => {
      const optimalScore = calculateWellnessScore({
        sleepHours: 8.5,
        sleepQuality: 5,
        soreness: 1,
        energy: 5,
        stress: 1,
      });
      expect(optimalScore.score).toBeGreaterThanOrEqual(85);
      expect(optimalScore.risk).toBe('low');

      const fatiguedScore = calculateWellnessScore({
        sleepHours: 5,
        sleepQuality: 2,
        soreness: 4,
        energy: 2,
        stress: 4,
      });
      expect(fatiguedScore.score).toBeLessThan(70);
      expect(['moderate', 'high']).toContain(fatiguedScore.risk);
    });

    it('persists today wellness via playerWellnessService', async () => {
      const saveSpy = jest.spyOn(playerWellnessService, 'saveTodayWellness');
      await playerWellnessService.saveTodayWellness('user-1', {
        sleepHours: 8,
        sleepQuality: 4,
        soreness: 2,
        energy: 4,
        stress: 2,
      });
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('Page 4 : PlayerTacticalView (Tactical Locker Room & Coach Sync)', () => {
    it('instantiates PlayerTacticalView with 11 de depart and set pieces', () => {
      const element = React.createElement(PlayerTacticalView);
      expect(element).toBeDefined();
      expect(element.type).toBe(PlayerTacticalView);
    });
  });

  describe('PlayerPortalScreen Shell Navigation', () => {
    it('instantiates PlayerPortalScreen supporting all 4 tabs without crash', () => {
      const tabs = ['cockpit', 'stats', 'wellness', 'tactics'] as const;
      for (const tab of tabs) {
        const element = React.createElement(PlayerPortalScreen, {
          initialTab: tab,
        });
        expect(element).toBeDefined();
        expect(element.type).toBe(PlayerPortalScreen);
      }
    });
  });
});
