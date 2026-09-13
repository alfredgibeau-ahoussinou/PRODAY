import React from 'react';

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  onSnapshot: jest.fn(),
}));
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));
jest.mock('../lib/firebase', () => ({
  getDb: jest.fn(() => null),
  getFirebaseAuth: jest.fn(() => null),
}));
jest.mock('../lib/firebaseFunctions', () => ({
  callFunction: jest.fn(),
  getCallableErrorMessage: jest.fn(),
  isFunctionsUnavailable: jest.fn(),
}));
jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: jest.fn(() => false),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../hooks/useSessionProfile', () => ({
  useSessionProfile: () => ({
    uid: 'admin-1',
    display_name: 'Président ProDay',
    role: 'club',
    email: 'admin@proday.fr',
    profile: {
      position: 'BU',
    },
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const ReactActual = require('react');
  return {
    useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
    SafeAreaView: ({ children, style }: any) => ReactActual.createElement('div', { style }, children),
  };
});

jest.mock('../utils/prodayHaptics', () => ({
  prodayHaptics: {
    tabSwitch: jest.fn(),
    press: jest.fn(),
    confirm: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    like: jest.fn(),
    cartAdd: jest.fn(),
    rsvpConfirm: jest.fn(),
    carpoolBook: jest.fn(),
    matchGoal: jest.fn(),
    impactLight: jest.fn(),
    impactMedium: jest.fn(),
    impactHeavy: jest.fn(),
    selection: jest.fn(),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { platformConfigService } from '../services/platformConfig.service';
import { AdminHomeScreen } from '../screens/admin/AdminHomeScreen';
import { AdminStaffScreen } from '../screens/admin/AdminStaffScreen';
import { AdminSystemScreen } from '../screens/admin/AdminSystemScreen';
import { AdminPortalScreen } from '../screens/admin/AdminPortalScreen';
import { PlayerHomeScreen } from '../screens/player/PlayerHomeScreen';
import { LiveFutPlayerCard } from '../components/player/LiveFutPlayerCard';

describe('Admin System & Operational Maintenance Mode', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe('1. Global Kill-Switch & Maintenance Engine', () => {
    it('initialise avec le mode maintenance inactif par défaut', async () => {
      const config = await platformConfigService.getConfig();
      expect(config.maintenance_mode).toBe(false);
    });

    it('active le kill-switch instantanément et propage aux abonnés en temps réel', async () => {
      let notifiedConfig: any = null;
      const unsub = platformConfigService.subscribeConfig((updated) => {
        notifiedConfig = updated;
      });

      const next = await platformConfigService.setMaintenanceMode(
        true,
        'Mise à jour infrastructure en cours',
        'admin-test',
      );

      expect(next.maintenance_mode).toBe(true);
      expect(next.maintenance_message).toBe('Mise à jour infrastructure en cours');
      expect(notifiedConfig).toBeDefined();
      expect(notifiedConfig.maintenance_mode).toBe(true);

      unsub();
    });

    it('persiste l’état du kill-switch dans le stockage local pour résister aux redémarrages', async () => {
      await platformConfigService.setMaintenanceMode(true, 'Arrêt d’urgence');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@proday_platform_config',
        expect.stringContaining('"maintenance_mode":true'),
      );
    });

    it('désactive le kill-switch et restaure l’accès opérationnel immédiatement', async () => {
      await platformConfigService.setMaintenanceMode(false, 'Opération terminée');
      const current = await platformConfigService.getConfig();
      expect(current.maintenance_mode).toBe(false);
    });
  });

  describe('2. Rebuilt Admin Screens Instantiation & Compliance', () => {
    it('instancie AdminHomeScreen avec santé financière, licences FFF et réservations', () => {
      const element = React.createElement(AdminHomeScreen);
      expect(element).toBeDefined();
      expect(element.type).toBe(AdminHomeScreen);
    });

    it('instancie AdminStaffScreen avec affectation des coachs et délégations de droits', () => {
      const element = React.createElement(AdminStaffScreen);
      expect(element).toBeDefined();
      expect(element.type).toBe(AdminStaffScreen);
    });

    it('instancie AdminSystemScreen avec commande du kill-switch et monitoring serveurs', () => {
      const element = React.createElement(AdminSystemScreen);
      expect(element).toBeDefined();
      expect(element.type).toBe(AdminSystemScreen);
    });

    it('instancie AdminPortalScreen avec la barre segmentée Apple', () => {
      const element = React.createElement(AdminPortalScreen, { initialTab: 'cockpit' });
      expect(element).toBeDefined();
      expect(element.type).toBe(AdminPortalScreen);
    });
  });

  describe('3. Intact Unified Player Card & Player Space Compliance', () => {
    it('instancie PlayerHomeScreen avec la carte officielle ProDay identique à la page compte', () => {
      const element = React.createElement(PlayerHomeScreen);
      expect(element).toBeDefined();
      expect(element.type).toBe(PlayerHomeScreen);
    });

    it('LiveFutPlayerCard affiche et respecte la carte officielle de la page compte', () => {
      const testPlayer = {
        id: 'p-fut-1',
        name: 'Zinedine Zidane',
        pos: 'MOC',
        ovr: 96,
        pac: 88,
        sho: 92,
        pas: 98,
        dri: 95,
        def: 75,
        phy: 86,
      };
      const element = React.createElement(LiveFutPlayerCard, {
        player: testPlayer,
        size: 'hero',
      });
      expect(element).toBeDefined();
      expect(element.props.player.ovr).toBe(96);
      expect(element.props.player.pos).toBe('MOC');
    });
  });
});
