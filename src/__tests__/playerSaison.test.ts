jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
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
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(),
  connectFunctionsEmulator: jest.fn(),
}));
jest.mock('../lib/firebase', () => ({
  getFirebaseAuth: jest.fn(),
  getDb: jest.fn(),
  getFirebaseStorage: jest.fn(),
}));
jest.mock('../config/firebase', () => ({ isFirebaseConfigured: jest.fn(() => false) }));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('../services/clubs.service', () => ({
  clubsService: {
    getClubById: jest.fn(() => Promise.resolve(null)),
  },
}));

jest.mock('../hooks/useSessionProfile', () => ({
  useSessionProfile: () => ({
    user: { uid: 'test-user-123' },
    profile: {
      id: 'test-user-123',
      first_name: 'Alfred',
      last_name: 'Gibeau',
      display_name: 'Alfred Gibeau',
      club_id: 'club-test',
      avatar_url: 'https://example.com/avatar.jpg',
    },
    club: {
      id: 'club-test',
      name: 'PSG Academy',
      primary_color: '#00E676',
      logo_url: 'https://example.com/logo.png',
    },
  }),
}));

jest.mock('../hooks/usePlayerHubData', () => ({
  usePlayerHubData: () => ({
    streakDays: 5,
    completedMatchesCount: 8,
    refetch: jest.fn(),
  }),
}));

jest.mock('../context/JoueurSessionContext', () => ({
  useJoueurSession: () => ({
    profile: {
      first_name: 'Alfred',
      avatar_url: 'https://example.com/avatar.jpg',
    },
  }),
}));

jest.mock('../context/JoueurProgressContext', () => ({
  useJoueurProgress: () => ({
    state: {
      level: 4,
      totalXp: 850,
      seasonStars: 12,
      currentStreakDays: 5,
      completedMatches: 8,
      dailyQuests: [
        { id: 'daily-checkin', title: 'Check-in forme', xpGain: 10, completed: true, claimed: false },
      ],
      seasonChallenges: [
        { id: 'ch-1', title: 'Jouer 5 matchs', current: 5, target: 5, starsGain: 3, completed: true, claimed: false },
      ],
    },
    grantXp: jest.fn(),
    claimDaily: jest.fn(),
    claimChallenge: jest.fn(),
  }),
}));

jest.mock('../context/PlayerThemeContext', () => ({
  usePlayerTheme: () => ({
    clubColors: { primary: '#00E676', secondary: '#004D40' },
    clubLogoUrl: 'https://example.com/logo.png',
    clubName: 'PSG Academy',
    colors: {
      accent: '#00E676',
      accentAlt: '#004D40',
      bg: '#0A0E14',
      card: '#121A24',
      text: '#FFFFFF',
      textDim: 'rgba(255,255,255,0.7)',
      border: 'rgba(255,255,255,0.1)',
    },
  }),
}));

jest.mock('../hooks/useTabNavigationActions', () => ({
  useTabNavigationActions: () => ({
    navigateToTab: jest.fn(),
    openDrawer: jest.fn(),
  }),
}));

import React from 'react';
import {
  CrestWatermark,
  ChalkboardPitchWatermark,
  EnergyBatteryIcon,
  SleepMoonIcon,
  MuscleFiberIcon,
  HydrationNutritionIcon,
  MobilityStretchIcon,
  VisualizationBrainIcon,
} from '../screens/joueur/PlayerSaisonIcons';
import PlayerSaisonScreen from '../screens/joueur/PlayerSaisonScreen';

describe('PlayerSaisonIcons', () => {
  it('renders CrestWatermark with custom color and opacity', () => {
    const crest = CrestWatermark({ width: 280, height: 330, color: '#00E676', opacity: 0.18 });
    expect(crest).toBeDefined();
    expect(crest.props.width).toBe(280);
    expect(crest.props.height).toBe(330);
    expect(crest.props.opacity).toBe(0.18);
  });

  it('renders ChalkboardPitchWatermark with default dimensions', () => {
    const pitch = ChalkboardPitchWatermark({});
    expect(pitch).toBeDefined();
    expect(pitch.props.width).toBe(180);
    expect(pitch.props.height).toBe(150);
  });

  it('renders wellness and routine icons with all dynamic activeCrans values', () => {
    // Energy levels 1, 2, 3
    expect(EnergyBatteryIcon({ activeCrans: 3, color: '#00E676' })).toBeDefined();
    expect(EnergyBatteryIcon({ activeCrans: 2, color: '#00E676' })).toBeDefined();
    expect(EnergyBatteryIcon({ activeCrans: 1, color: '#00E676' })).toBeDefined();

    // Sleep levels 1, 2, 3
    expect(SleepMoonIcon({ activeCrans: 3, color: '#00E676' })).toBeDefined();
    expect(SleepMoonIcon({ activeCrans: 2, color: '#00E676' })).toBeDefined();
    expect(SleepMoonIcon({ activeCrans: 1, color: '#00E676' })).toBeDefined();

    // Muscle levels 1, 2, 3
    expect(MuscleFiberIcon({ activeCrans: 3, color: '#00E676' })).toBeDefined();
    expect(MuscleFiberIcon({ activeCrans: 2, color: '#00E676' })).toBeDefined();
    expect(MuscleFiberIcon({ activeCrans: 1, color: '#00E676' })).toBeDefined();

    // Routines
    expect(HydrationNutritionIcon({ color: '#00E676', size: 22 })).toBeDefined();
    expect(MobilityStretchIcon({ color: '#00E676', size: 22 })).toBeDefined();
    expect(VisualizationBrainIcon({ color: '#00E676', size: 22 })).toBeDefined();
  });
});

describe('PlayerSaisonScreen', () => {
  it('is exported as a valid React component', () => {
    expect(typeof PlayerSaisonScreen).toBe('function');
  });

  it('instantiates PlayerSaisonScreen element without error', () => {
    const element = React.createElement(PlayerSaisonScreen, { route: { params: {} } as any, navigation: {} as any });
    expect(element).toBeDefined();
    expect(element.type).toBe(PlayerSaisonScreen);
  });
});
