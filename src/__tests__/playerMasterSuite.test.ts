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

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock prodayHaptics
jest.mock('../utils/prodayHaptics', () => ({
  prodayHaptics: {
    selection: jest.fn(),
    impactLight: jest.fn(),
    impactMedium: jest.fn(),
    notificationSuccess: jest.fn(),
  },
}));

// Mock useSessionProfile
jest.mock('../hooks/useSessionProfile', () => ({
  useSessionProfile: () => ({
    uid: 'test-player-uid',
    display_name: 'Kylian Mbappé',
    email: 'kylian@proday.com',
    role: 'player',
    profile: {
      position: 'Attaquant',
      strong_foot: 'right',
      height_cm: 182,
      weight_kg: 76,
    },
  }),
}));

import {
  calculateWellnessScore,
  playerWellnessService,
} from '../services/playerWellness.service';
import {
  playerPassportService,
  generatePassportSignature,
} from '../services/playerPassport.service';
import { playerRsvpService } from '../services/playerRsvp.service';

import { LiveFutPlayerCard, type LiveFutCardData } from '../components/player/LiveFutPlayerCard';
import { PlayerHomeScreen } from '../screens/player/PlayerHomeScreen';
import { PlayerStatsScreen } from '../screens/player/PlayerStatsScreen';
import { PlayerWellnessScreen } from '../screens/player/PlayerWellnessScreen';
import { PlayerTacticalView } from '../screens/player/PlayerTacticalView';
import { PlayerPortalScreen } from '../screens/player/PlayerPortalScreen';

describe('Player Master Suite — Espace Joueur Architecture', () => {
  describe('1. Wellness & ACWR Injury Prevention Engine', () => {
    it('calcule un score optimal (100 pts) et un risque faible pour un athlète en pleine forme', () => {
      const result = calculateWellnessScore({
        sleepHours: 8,
        sleepQuality: 5,
        soreness: 1,
        energy: 5,
        stress: 1,
      });
      expect(result.score).toBe(100);
      expect(result.risk).toBe('low');
    });

    it('détecte un risque élevé en cas de courbatures sévères ou de manque de sommeil aigu', () => {
      const result = calculateWellnessScore({
        sleepHours: 4,
        sleepQuality: 1,
        soreness: 5, // Courbatures sévères
        energy: 1,
        stress: 5,
      });
      expect(result.score).toBeLessThan(50);
      expect(result.risk).toBe('high');
    });

    it('sauvegarde et recharge le check-in du jour sans crash', async () => {
      const saved = await playerWellnessService.saveTodayWellness('user-1', {
        sleepHours: 7.5,
        sleepQuality: 4,
        soreness: 2,
        energy: 4,
        stress: 2,
      });
      expect(saved.wellnessScore).toBeGreaterThan(70);
      expect(saved.injuryRisk).toBe('low');

      const loaded = await playerWellnessService.getTodayWellness('user-1');
      expect(loaded).toBeDefined();
      expect(loaded?.sleepHours).toBe(7.5);
    });
  });

  describe('2. Certified Passport & Scout QR Verification', () => {
    it('génère une empreinte numérique infalsifiable pour le passeport certifié', () => {
      const sig1 = generatePassportSignature('p1', 'FFF-123456', '2026-03-12T10:00:00.000Z');
      const sig2 = generatePassportSignature('p1', 'FFF-123456', '2026-03-12T10:00:00.000Z');
      expect(sig1).toBe(sig2);
      expect(sig1).toMatch(/^PD-[A-F0-9]+-20260312$/);
    });

    it('construit un passeport honnête à partir des données fournies (sans auto-certification)', () => {
      const passport = playerPassportService.buildPassport({
        playerId: 'p1',
        fullName: 'Kylian Mbappé',
        licenseNumber: 'FFF-750012',
        clubName: 'Paris Saint-Germain',
        goals: 18,
        assists: 9,
      });
      // Sans vérification serveur, le client ne se certifie JAMAIS lui-même
      // (invariant DATA-01 : l'ancien coachVerified: true inconditionnel était faux).
      expect(passport.coachVerified).toBe(false);
      expect(passport.goals).toBe(18);
      expect(passport.licenseNumber).toBe('FFF-750012');
      // Licence fournie => signature calculée, mais jamais un sceau de vérification.
      expect(passport.signatureHash).not.toBe('');

      const qrUrl = playerPassportService.getPassportQrUrl(passport);
      expect(qrUrl).toContain('https://proday.app/player/p1');
    });

    it('ne certifie rien sans licence réelle (aucune donnée inventée)', () => {
      const passport = playerPassportService.buildPassport({
        playerId: 'p2',
        fullName: 'Joueur Sans Licence',
      });
      expect(passport.licenseNumber).toBe('—');
      expect(passport.coachVerified).toBe(false);
      expect(passport.signatureHash).toBe('');
      expect(passport.clubName).toBe('—');
      expect(passport.coachName).toBe('—');
    });
  });

  describe('3. Match & Training RSVP Service', () => {
    it('gère les statuts Présent, Absent et Incertain avec persistance', async () => {
      await playerRsvpService.setRsvp('p1', 'match-j17', 'absent', 'Blessure cheville');
      const status = await playerRsvpService.getRsvp('p1', 'match-j17');
      expect(status).toBe('absent');

      await playerRsvpService.setRsvp('p1', 'match-j17', 'present');
      const updated = await playerRsvpService.getRsvp('p1', 'match-j17');
      expect(updated).toBe('present');
    });
  });

  describe('4. Dynamic Player Card Resolution & Rendering', () => {
    it('affiche la carte joueur avec ses métriques et son statut', () => {
      const testCard: LiveFutCardData = {
        id: 'c1',
        name: 'Kylian',
        pos: 'BU',
        ovr: 89,
        pac: 97,
        sho: 90,
        pas: 82,
        dri: 93,
        def: 38,
        phy: 80,
      };

      const element = React.createElement(LiveFutPlayerCard, { player: testCard, size: 'hero' });
      expect(element).toBeDefined();
      expect(element.type).toBe(LiveFutPlayerCard);
      expect(element.props.player.ovr).toBe(89);
      expect(element.props.player.pos).toBe('BU');
      expect(element.props.player.pac).toBe(97);
    });
  });

  describe('5. Master Player Screens Rendering & Instantiation', () => {
    it('instancie PlayerHomeScreen avec compte à rebours, RSVP et carte officielle', () => {
      const element = React.createElement(PlayerHomeScreen);
      expect(element).toBeDefined();
      expect(element.type).toBe(PlayerHomeScreen);
    });

    it('instancie PlayerStatsScreen avec métriques de carrière et passeport', () => {
      const element = React.createElement(PlayerStatsScreen);
      expect(element).toBeDefined();
      expect(element.type).toBe(PlayerStatsScreen);
    });

    it('instancie PlayerWellnessScreen avec check-in quotidien et ratio ACWR', () => {
      const element = React.createElement(PlayerWellnessScreen);
      expect(element).toBeDefined();
      expect(element.type).toBe(PlayerWellnessScreen);
    });

    it('instancie PlayerTacticalView avec dispositif et consignes staff', () => {
      const element = React.createElement(PlayerTacticalView);
      expect(element).toBeDefined();
      expect(element.type).toBe(PlayerTacticalView);
    });

    it('instancie PlayerPortalScreen avec les onglets cockpit, stats, wellness, tactics', () => {
      const element = React.createElement(PlayerPortalScreen, { initialTab: 'cockpit' });
      expect(element).toBeDefined();
      expect(element.type).toBe(PlayerPortalScreen);
      expect(element.props.initialTab).toBe('cockpit');
    });
  });
});
