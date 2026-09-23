jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockDoc = jest.fn((db, col, id) => ({ path: `${col}/${id}`, id }));

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  doc: (db: any, col: string, id: string) => mockDoc(db, col, id),
  getDoc: (docRef: any) => mockGetDoc(docRef),
  getDocs: jest.fn(() => Promise.resolve({ empty: true, docs: [] })),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => 'MOCK_TIMESTAMP'),
  setDoc: jest.fn(),
  updateDoc: (docRef: any, data: any) => mockUpdateDoc(docRef, data),
  deleteDoc: (docRef: any) => mockDeleteDoc(docRef),
  where: jest.fn(),
}));

jest.mock('../lib/firebase', () => ({
  getDb: jest.fn(() => ({})),
  getFirebaseAuth: jest.fn(() => ({ currentUser: { uid: 'coach-test-uid' } })),
  getFirebaseStorage: jest.fn(() => ({})),
}));

jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: jest.fn(() => true),
}));

import { videoAiAnalysisService } from '../services/video/videoAiAnalysis.service';
import { clubCamerasService } from '../services/clubCameras.service';
import * as fs from 'fs';
import * as path from 'path';

describe('Video Workspace End-to-End Completion (Zero Simulation)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('videoAiAnalysisService (Real Firestore indexing, no setTimeout)', () => {
    it('refuse d’analyser un direct en cours pour préserver l’intégrité', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: 'v-live',
          club_id: 'club-1',
          status: 'live',
          storage_url: 'https://cdn.example.com/live.m3u8',
        }),
      });

      await expect(
        videoAiAnalysisService.startAiVideoAnalysis('v-live', 'club-1'),
      ).rejects.toThrow(/direct/i);
    });

    it('refuse d’analyser une vidéo sans fichier source ou flux valide', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: 'v-empty',
          club_id: 'club-1',
          status: 'ready',
          storage_url: null,
        }),
      });

      await expect(
        videoAiAnalysisService.startAiVideoAnalysis('v-empty', 'club-1'),
      ).rejects.toThrow(/sans fichier source/i);
    });

    it('indexe les séquences réelles (buts, arrêts, transitions, CPA) et persiste dans Firestore', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: 'v-match-1',
          club_id: 'club-1',
          status: 'ready',
          title: 'Seniors vs FC Lyon',
          opponent: 'FC Lyon',
          duration_sec: 5400,
          storage_url: 'https://cdn.example.com/seniors.mp4',
          clips: [],
          share_with: ['coaches', 'players'],
        }),
      });

      mockUpdateDoc.mockResolvedValueOnce(undefined);

      const result = await videoAiAnalysisService.startAiVideoAnalysis('v-match-1', 'club-1');

      expect(result.videoId).toBe('v-match-1');
      expect(result.clipsGenerated).toBe(4);
      expect(result.clips.some((c) => c.type === 'goal')).toBe(true);
      expect(result.clips.some((c) => c.type === 'save')).toBe(true);
      expect(result.clips.some((c) => c.type === 'transition')).toBe(true);
      expect(result.clips.some((c) => c.type === 'set_piece')).toBe(true);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'v-match-1' }),
        expect.objectContaining({
          ai_ready: true,
          highlights_ready: true,
          clips: expect.arrayContaining([
            expect.objectContaining({ type: 'goal' }),
            expect.objectContaining({ type: 'save' }),
          ]),
        }),
      );
    });
  });

  describe('clubCamerasService Lifecycle (Persist, Update, Delete, End Live)', () => {
    it('updateMatchVideo persiste le patch de métadonnées et permissions', async () => {
      mockUpdateDoc.mockResolvedValueOnce(undefined);

      await clubCamerasService.updateMatchVideo('vid-99', {
        title: 'Nouveau Titre Officiel',
        opponent: 'AS Monaco',
        team_label: 'U19 R1',
        share_with: ['coaches', 'staff'],
      });

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'vid-99' }),
        expect.objectContaining({
          title: 'Nouveau Titre Officiel',
          opponent: 'AS Monaco',
          team_label: 'U19 R1',
          share_with: ['coaches', 'staff'],
        }),
      );
    });

    it('deleteMatchVideo supprime définitivement le document dans Firestore', async () => {
      mockDeleteDoc.mockResolvedValueOnce(undefined);

      await clubCamerasService.deleteMatchVideo('vid-to-delete');

      expect(mockDeleteDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'vid-to-delete' }),
      );
    });

    it('endLiveStream clôture le direct en replay disponible', async () => {
      mockUpdateDoc.mockResolvedValueOnce(undefined);

      await clubCamerasService.endLiveStream('vid-live-1');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'vid-live-1' }),
        expect.objectContaining({
          status: 'ready',
          kind: 'replay',
        }),
      );
    });
  });

  describe('Codebase static inspection: Zero Simulation Guarantee', () => {
    const workspaceCode = fs.readFileSync(
      path.join(__dirname, '../features/video/VideoWorkspace.tsx'),
      'utf8',
    );
    const panelsCode = fs.readFileSync(
      path.join(__dirname, '../features/video/VideoWorkspacePanels.tsx'),
      'utf8',
    );

    it('retire impérativement la carte décorative Brief Sportif du Lundi', () => {
      expect(workspaceCode).not.toContain('Le Brief Sportif du Lundi Matin');
    });

    it('élimine tout faux setTimeout pour l’analyse IA dans VideoWorkspace', () => {
      // Aucun setTimeout artificiel de progression (25 -> 60 -> 100)
      expect(workspaceCode).not.toContain('setTimeout(() => setAiProcessingProgress(60)');
      expect(workspaceCode).toContain('videoAiAnalysisService.startAiVideoAnalysis');
    });

    it('intègre CoachVideoDetailModal avec options de gestion et suppression', () => {
      expect(workspaceCode).toContain('<CoachVideoDetailModal');
      expect(workspaceCode).toContain('handleOpenDetail');
      expect(workspaceCode).toContain('handleEndLive');
    });

    it('affiche les 6 axes Veo vérifiés et indépendants dans VeoStateAxes', () => {
      expect(panelsCode).toContain('AUTORISATION COMPTE VEO');
      expect(panelsCode).toContain('RATTACHEMENT CLUB');
      expect(panelsCode).toContain('APPAIRAGE CAMÉRA');
      expect(panelsCode).toContain('DISPONIBILITÉ MATÉRIEL');
      expect(panelsCode).toContain('ACCÈS AUX ENREGISTREMENTS');
      expect(panelsCode).toContain('DISPONIBILITÉ DIRECT LIVE');
    });
  });
});
