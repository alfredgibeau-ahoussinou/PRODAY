jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
}));
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(),
  connectFunctionsEmulator: jest.fn(),
}));
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));
jest.mock('../lib/firebase', () => ({ getFirebaseAuth: jest.fn(), getDb: jest.fn() }));
jest.mock('../config/firebase', () => ({ isFirebaseConfigured: jest.fn(() => false) }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  coachSessionDebriefService,
  getBorgRpeInfo,
  BORG_RPE_SCALE,
  INTENSITY_OPTIONS,
  DEBRIEF_TAKEAWAY_PRESETS,
} from '../services/coachSessionDebrief.service';
import { CoachSessionDebriefModal } from '../components/coach/training/CoachSessionDebriefModal';

describe('coachSessionDebriefService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('fournit les informations et couleurs de l’échelle de Borg (1-10) et composant modal', () => {
    expect(CoachSessionDebriefModal).toBeDefined();
    expect(typeof CoachSessionDebriefModal).toBe('function');
    expect(DEBRIEF_TAKEAWAY_PRESETS.length).toBeGreaterThan(3);
    expect(BORG_RPE_SCALE[1].label).toBe('Très très facile');
    expect(BORG_RPE_SCALE[10].label).toBe('Épuisement maximal');

    const info1 = getBorgRpeInfo(1);
    expect(info1.score).toBe(1);

    const infoClampedHigh = getBorgRpeInfo(15);
    expect(infoClampedHigh.score).toBe(10);

    const infoClampedLow = getBorgRpeInfo(-3);
    expect(infoClampedLow.score).toBe(1);

    expect(INTENSITY_OPTIONS).toHaveLength(3);
  });

  it('enregistre un nouveau débrief d’après-séance avec RPE et engagement bornés', async () => {
    const debrief = await coachSessionDebriefService.saveDebrief({
      eventId: 'event_train_42',
      coachUid: 'coach_super',
      rpeScore: 8,
      intensityRealVsPlanned: 'higher',
      groupEngagement: 4,
      keyTakeaways: 'Grosse dépense d’énergie, bon travail de contre-pressing.',
      fatiguedPlayerUids: ['p1', 'p2'],
    });

    expect(debrief.id).toBeDefined();
    expect(debrief.id.startsWith('csd_')).toBe(true);
    expect(debrief.rpeScore).toBe(8);
    expect(debrief.intensityRealVsPlanned).toBe('higher');
    expect(debrief.groupEngagement).toBe(4);
    expect(debrief.fatiguedPlayerUids).toEqual(['p1', 'p2']);
    expect(debrief.createdAt).toBeDefined();

    const retrieved = await coachSessionDebriefService.getDebriefForEvent('event_train_42');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(debrief.id);
  });

  it('borne le RPE (1-10) et l’engagement (1-5) même avec des valeurs hors limites', async () => {
    const debrief = await coachSessionDebriefService.saveDebrief({
      eventId: 'event_out_of_bounds',
      coachUid: 'coach_1',
      rpeScore: 99,
      intensityRealVsPlanned: 'as_expected',
      groupEngagement: 12,
      keyTakeaways: 'Test de saturation',
      fatiguedPlayerUids: [],
    });

    expect(debrief.rpeScore).toBe(10);
    expect(debrief.groupEngagement).toBe(5);

    const debriefLow = await coachSessionDebriefService.saveDebrief({
      eventId: 'event_low_bounds',
      coachUid: 'coach_1',
      rpeScore: -5,
      intensityRealVsPlanned: 'lower',
      groupEngagement: -2,
      keyTakeaways: 'Test minimum',
      fatiguedPlayerUids: [],
    });

    expect(debriefLow.rpeScore).toBe(1);
    expect(debriefLow.groupEngagement).toBe(1);
  });

  it('met à jour un débrief existant pour le même événement (pas de doublon)', async () => {
    const first = await coachSessionDebriefService.saveDebrief({
      eventId: 'event_single_session',
      coachUid: 'coach_1',
      rpeScore: 5,
      intensityRealVsPlanned: 'as_expected',
      groupEngagement: 3,
      keyTakeaways: 'Débrief initial',
      fatiguedPlayerUids: ['p1'],
    });

    const second = await coachSessionDebriefService.saveDebrief({
      eventId: 'event_single_session',
      coachUid: 'coach_1',
      rpeScore: 7,
      intensityRealVsPlanned: 'higher',
      groupEngagement: 4,
      keyTakeaways: 'Débrief révisé après retours des adjoints',
      fatiguedPlayerUids: ['p1', 'p3'],
    });

    expect(second.id).toBe(first.id);
    expect(second.rpeScore).toBe(7);
    expect(second.keyTakeaways).toBe('Débrief révisé après retours des adjoints');
    expect(second.updatedAt).toBeDefined();

    const all = await coachSessionDebriefService.listDebriefs();
    expect(all).toHaveLength(1);
  });

  it('filtre les débriefs par coach, intensité et plage de RPE', async () => {
    await coachSessionDebriefService.saveDebrief({
      eventId: 'e1',
      coachUid: 'coach_A',
      rpeScore: 4,
      intensityRealVsPlanned: 'lower',
      groupEngagement: 3,
      keyTakeaways: 'Séance récup',
      fatiguedPlayerUids: [],
    });

    await coachSessionDebriefService.saveDebrief({
      eventId: 'e2',
      coachUid: 'coach_A',
      rpeScore: 8,
      intensityRealVsPlanned: 'higher',
      groupEngagement: 5,
      keyTakeaways: 'Séance match preparation intense',
      fatiguedPlayerUids: ['p_gk'],
    });

    await coachSessionDebriefService.saveDebrief({
      eventId: 'e3',
      coachUid: 'coach_B',
      rpeScore: 9,
      intensityRealVsPlanned: 'higher',
      groupEngagement: 4,
      keyTakeaways: 'Test VMA éprouvant',
      fatiguedPlayerUids: ['p_def'],
    });

    // Filtre coach_A
    const coachA = await coachSessionDebriefService.listDebriefs({ coachUid: 'coach_A' });
    expect(coachA).toHaveLength(2);

    // Filtre haute intensité (minRpe >= 7)
    const highIntensity = await coachSessionDebriefService.listDebriefs({ minRpe: 7 });
    expect(highIntensity).toHaveLength(2);

    // Filtre par tonalité d'intensité
    const lowerOnes = await coachSessionDebriefService.listDebriefs({
      intensityRealVsPlanned: 'lower',
    });
    expect(lowerOnes).toHaveLength(1);
    expect(lowerOnes[0].eventId).toBe('e1');
  });

  it('permet de supprimer un débrief par son ID ou son eventId', async () => {
    const debrief = await coachSessionDebriefService.saveDebrief({
      eventId: 'event_to_delete',
      coachUid: 'coach_1',
      rpeScore: 6,
      intensityRealVsPlanned: 'as_expected',
      groupEngagement: 4,
      keyTakeaways: 'Suppression test',
      fatiguedPlayerUids: [],
    });

    const deleted = await coachSessionDebriefService.deleteDebrief('event_to_delete');
    expect(deleted).toBe(true);

    const check = await coachSessionDebriefService.getDebriefForEvent('event_to_delete');
    expect(check).toBeNull();
  });

  it('gère les données corrompues dans le storage sans crasher', async () => {
    await AsyncStorage.setItem('@proday_coach_session_debriefs', '{corrupted}');
    const list = await coachSessionDebriefService.listDebriefs();
    expect(list).toEqual([]);

    const saved = await coachSessionDebriefService.saveDebrief({
      eventId: 'event_recovery',
      coachUid: 'coach_1',
      rpeScore: 5,
      intensityRealVsPlanned: 'as_expected',
      groupEngagement: 4,
      keyTakeaways: 'Récupération',
      fatiguedPlayerUids: [],
    });
    expect(saved.id).toBeDefined();
  });

  it('vide l’intégralité des débriefs avec clearAllDebriefs', async () => {
    await coachSessionDebriefService.saveDebrief({
      eventId: 'ev_1',
      coachUid: 'coach_1',
      rpeScore: 6,
      intensityRealVsPlanned: 'as_expected',
      groupEngagement: 4,
      keyTakeaways: 'Debrief 1',
      fatiguedPlayerUids: [],
    });

    const before = await coachSessionDebriefService.listDebriefs();
    expect(before).toHaveLength(1);

    await coachSessionDebriefService.clearAllDebriefs();
    const after = await coachSessionDebriefService.listDebriefs();
    expect(after).toHaveLength(0);
  });
});
