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
  coachQuickNotesService,
  type CoachQuickNote,
  COACH_QUICK_NOTE_DEFAULT_TAGS,
  COACH_QUICK_NOTE_SUGGESTIONS,
} from '../services/coachQuickNotes.service';
import { CoachQuickNoteModal } from '../components/coach/notes/CoachQuickNoteModal';

describe('coachQuickNotesService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('exports CoachQuickNoteModal component and default constants', () => {
    expect(CoachQuickNoteModal).toBeDefined();
    expect(typeof CoachQuickNoteModal).toBe('function');
    expect(COACH_QUICK_NOTE_DEFAULT_TAGS).toContain('#tactique');
    expect(COACH_QUICK_NOTE_SUGGESTIONS.length).toBeGreaterThan(3);
  });

  it('crée une nouvelle note avec id auto-généré et date de création', async () => {
    const saved = await coachQuickNotesService.saveNote({
      coachUid: 'coach_123',
      clubId: 'club_abc',
      teamId: 'team_u19',
      playerUid: 'player_07',
      playerName: 'Kylian Mbappé',
      eventId: 'training_session_1',
      sessionTitle: 'Entraînement tactique pressing',
      content: 'Excellente compensation défensive sur le couloir gauche.',
      tags: ['#tactique', '#effort'],
    });

    expect(saved.id).toBeDefined();
    expect(saved.id.startsWith('cqn_')).toBe(true);
    expect(saved.createdAt).toBeDefined();
    expect(saved.playerName).toBe('Kylian Mbappé');
    expect(saved.tags).toEqual(['#tactique', '#effort']);

    const list = await coachQuickNotesService.listNotes();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(saved.id);
  });

  it('met à jour une note existante sans changer son ID d’origine', async () => {
    const original = await coachQuickNotesService.saveNote({
      coachUid: 'coach_123',
      clubId: 'club_abc',
      content: 'Premier constat',
      tags: ['#effort'],
    });

    const updated = await coachQuickNotesService.saveNote({
      id: original.id,
      coachUid: original.coachUid,
      clubId: original.clubId,
      content: 'Constat affiné après la 2ème mi-temps',
      tags: ['#effort', '#tactique'],
    });

    expect(updated.id).toBe(original.id);
    expect(updated.content).toBe('Constat affiné après la 2ème mi-temps');
    expect(updated.tags).toEqual(['#effort', '#tactique']);
    expect(updated.updatedAt).toBeDefined();

    const all = await coachQuickNotesService.listNotes();
    expect(all).toHaveLength(1);
    expect(all[0].content).toBe('Constat affiné après la 2ème mi-temps');
  });

  it('permet de supprimer une note existante', async () => {
    const note1 = await coachQuickNotesService.saveNote({
      coachUid: 'coach_1',
      clubId: 'club_1',
      content: 'Note 1',
      tags: ['#technique'],
    });
    const note2 = await coachQuickNotesService.saveNote({
      coachUid: 'coach_1',
      clubId: 'club_1',
      content: 'Note 2',
      tags: ['#blessure'],
    });

    let list = await coachQuickNotesService.listNotes();
    expect(list).toHaveLength(2);

    const deleted = await coachQuickNotesService.deleteNote(note1.id);
    expect(deleted).toBe(true);

    list = await coachQuickNotesService.listNotes();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(note2.id);

    const deleteAgain = await coachQuickNotesService.deleteNote(note1.id);
    expect(deleteAgain).toBe(false);
  });

  it('filtre efficacement par joueur, club, séance ou tag', async () => {
    await coachQuickNotesService.saveNote({
      coachUid: 'coach_A',
      clubId: 'club_PSG',
      teamId: 'team_senior',
      playerUid: 'player_10',
      playerName: 'Neymar',
      content: 'Très bonne percussion',
      tags: ['#technique'],
    });

    await coachQuickNotesService.saveNote({
      coachUid: 'coach_A',
      clubId: 'club_PSG',
      playerUid: 'player_09',
      playerName: 'Cavani',
      content: 'Volume de course remarquable',
      tags: ['#effort'],
    });

    await coachQuickNotesService.saveNote({
      coachUid: 'coach_B',
      clubId: 'club_OM',
      playerUid: 'player_10',
      playerName: 'Payet',
      content: 'Précision sur coup de pied arrêté',
      tags: ['#technique', '#tactique'],
    });

    // Filtre par coachUid
    const coachANotes = await coachQuickNotesService.listNotes({ coachUid: 'coach_A' });
    expect(coachANotes).toHaveLength(2);

    // Filtre par clubId
    const omNotes = await coachQuickNotesService.listNotes({ clubId: 'club_OM' });
    expect(omNotes).toHaveLength(1);
    expect(omNotes[0].playerName).toBe('Payet');

    // Filtre par playerUid
    const p10Notes = await coachQuickNotesService.listNotes({ playerUid: 'player_10' });
    expect(p10Notes).toHaveLength(2);

    // Filtre par tag
    const effortNotes = await coachQuickNotesService.listNotes({ tag: '#effort' });
    expect(effortNotes).toHaveLength(1);
    expect(effortNotes[0].playerName).toBe('Cavani');

    // Recherche libre
    const searchResult = await coachQuickNotesService.listNotes({ search: 'percussion' });
    expect(searchResult).toHaveLength(1);
    expect(searchResult[0].playerName).toBe('Neymar');
  });

  it('gère les erreurs et données corrompues dans le storage', async () => {
    await AsyncStorage.setItem('@proday_coach_quick_notes', '{bad-json');
    const notes = await coachQuickNotesService.listNotes();
    expect(notes).toEqual([]);

    // La sauvegarde suivante doit réparer le flux
    const newNote = await coachQuickNotesService.saveNote({
      coachUid: 'coach_1',
      clubId: 'club_1',
      content: 'Note après reset',
      tags: ['#attitude'],
    });
    expect(newNote.id).toBeDefined();

    const refreshed = await coachQuickNotesService.listNotes();
    expect(refreshed).toHaveLength(1);
  });

  it('permet de récupérer une note spécifique avec getNote et vider avec clearAllNotes', async () => {
    const note = await coachQuickNotesService.saveNote({
      coachUid: 'coach_xyz',
      clubId: 'club_xyz',
      content: 'Note ciblée getNote',
      tags: ['#tactique'],
    });

    const retrieved = await coachQuickNotesService.getNote(note.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(note.id);
    expect(retrieved?.content).toBe('Note ciblée getNote');

    const notFound = await coachQuickNotesService.getNote('unknown_id');
    expect(notFound).toBeNull();

    await coachQuickNotesService.clearAllNotes();
    const afterClear = await coachQuickNotesService.listNotes();
    expect(afterClear).toHaveLength(0);
  });
});
