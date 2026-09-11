jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
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

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: () => false,
}));

jest.mock('../lib/firebase', () => ({
  getDb: () => null,
  getFirebaseAuth: () => null,
  getFirebaseStorage: () => null,
}));

jest.mock('../hooks/useTabNavigationActions', () => ({
  useTabNavigationActions: () => ({
    setActiveTab: jest.fn(),
    openMatchs: jest.fn(),
    openProfile: jest.fn(),
    openDashboard: jest.fn(),
    openShop: jest.fn(),
  }),
}));

import React from 'react';
import { GlobalSearchBar } from '../components/search/GlobalSearchBar';
import { GlobalSearchModal } from '../components/search/GlobalSearchModal';

describe('GlobalSearch UI Components', () => {
  describe('GlobalSearchBar', () => {
    it('is exported as a valid React component', () => {
      expect(typeof GlobalSearchBar).toBe('function');
    });

    it('instantiates GlobalSearchBar element without error', () => {
      const element = React.createElement(GlobalSearchBar, {
        onPress: jest.fn(),
        placeholder: 'Rechercher joueur, page, club...',
      });
      expect(element).toBeDefined();
      expect(element.type).toBe(GlobalSearchBar);
      expect(element.props.placeholder).toBe('Rechercher joueur, page, club...');
    });
  });

  describe('GlobalSearchModal', () => {
    it('is exported as a valid React component', () => {
      expect(typeof GlobalSearchModal).toBe('function');
    });

    it('instantiates GlobalSearchModal element without error', () => {
      const element = React.createElement(GlobalSearchModal, {
        visible: true,
        onClose: jest.fn(),
      });
      expect(element).toBeDefined();
      expect(element.type).toBe(GlobalSearchModal);
      expect(element.props.visible).toBe(true);
    });
  });
});
