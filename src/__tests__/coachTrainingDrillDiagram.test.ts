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
jest.mock('../lib/firebase', () => ({ getFirebaseAuth: jest.fn(), getDb: jest.fn() }));
jest.mock('../config/firebase', () => ({ isFirebaseConfigured: jest.fn(() => false) }));

import { inferDrillType } from '../components/coach/CoachTrainingDrillDiagram';

describe('CoachTrainingDrillDiagram drill inference', () => {
  it('correctly categorizes rondo exercises', () => {
    expect(inferDrillType('Rondo 4v2 avec appuis')).toBe('rondo');
    expect(inferDrillType('Conservation du ballon sous pression')).toBe('rondo');
    expect(inferDrillType('Toro 5 contre 2')).toBe('rondo');
  });

  it('correctly categorizes finishing exercises', () => {
    expect(inferDrillType('Finition face au gardien')).toBe('finishing');
    expect(inferDrillType('Frappe au but et reprise')).toBe('finishing');
    expect(inferDrillType('Centres et tirs au second poteau')).toBe('finishing');
  });

  it('correctly categorizes circuit exercises', () => {
    expect(inferDrillType('Circuit technique de passes')).toBe('circuit');
    expect(inferDrillType('Slalom et coordination')).toBe('circuit');
  });

  it('correctly categorizes pressing exercises', () => {
    expect(inferDrillType('Déclenchement du pressing')).toBe('pressing');
    expect(inferDrillType('Bloc bas et coulissement')).toBe('pressing');
  });

  it('falls back to generic or possession appropriately', () => {
    expect(inferDrillType('Jeu de position 8v8')).toBe('possession');
    expect(inferDrillType('Échauffement dynamique')).toBe('generic');
  });
});
