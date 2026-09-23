jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ empty: true, docs: [] })),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

jest.mock('../lib/firebase', () => ({
  getDb: jest.fn(() => ({})),
  getFirebaseAuth: jest.fn(() => ({ currentUser: { uid: 'coach-123' } })),
  getFirebaseStorage: jest.fn(() => ({})),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn((storage, path) => ({ fullPath: path })),
  uploadBytesResumable: jest.fn((storageRef, blob, metadata) => {
    let stateChangeCallback: any = null;
    let completeCallback: any = null;

    const task = {
      snapshot: {
        ref: storageRef,
        bytesTransferred: 1000,
        totalBytes: 1000,
      },
      on: jest.fn((event, onProgress, onError, onComplete) => {
        stateChangeCallback = onProgress;
        completeCallback = onComplete;
        setTimeout(() => {
          if (stateChangeCallback) {
            stateChangeCallback({
              bytesTransferred: 500,
              totalBytes: 1000,
            });
            stateChangeCallback({
              bytesTransferred: 1000,
              totalBytes: 1000,
            });
          }
          if (completeCallback) {
            completeCallback();
          }
        }, 10);
      }),
      cancel: jest.fn(),
    };
    return task;
  }),
  getDownloadURL: jest.fn(() => Promise.resolve('https://firebasestorage.googleapis.com/test-video.mp4')),
}));

import {
  validateVideoFile,
  formatBytes,
  MAX_VIDEO_FILE_SIZE_BYTES,
  RECOMMENDED_VIDEO_MAX_SIZE_BYTES,
  matchVideoUploadService,
} from '../services/video/matchVideoUpload.service';
import {
  canUploadAndAssociateVideo,
  canManageVideoConnections,
  resolveCameraState,
  resolveStreamState,
  describeVeoConnection,
  VEO_ACCOUNT_LABEL,
  VEO_CAMERA_LABEL,
  VEO_STREAM_LABEL,
} from '../features/video/veoWorkspace';

jest.mock('../services/clubCameras.service', () => ({
  clubCamerasService: {
    importMatchVideo: jest.fn((input) =>
      Promise.resolve({
        id: 'match-vid-999',
        message: 'Vidéo importée',
        storage_url: input.storage_url,
      }),
    ),
  },
}));

describe('Coach Video Upload & Live Workflows', () => {
  describe('1. Validation des Formats et Tailles Vidéo', () => {
    it('accepte les formats autorisés (MP4, MOV, WebM, M4V)', () => {
      expect(validateVideoFile({ name: 'match_final.mp4', mimeType: 'video/mp4' }).valid).toBe(true);
      expect(validateVideoFile({ name: 'tactique.mov', mimeType: 'video/quicktime' }).valid).toBe(true);
      expect(validateVideoFile({ name: 'atelier.webm', mimeType: 'video/webm' }).valid).toBe(true);
      expect(validateVideoFile({ name: 'clip.m4v', mimeType: 'video/x-m4v' }).valid).toBe(true);
    });

    it('rejette les extensions et formats non vidéo', () => {
      const resExe = validateVideoFile({ name: 'malware.exe', mimeType: 'application/octet-stream' });
      expect(resExe.valid).toBe(false);
      expect(resExe.error).toContain('Format non supporté');

      const resPdf = validateVideoFile({ name: 'feuil_match.pdf', mimeType: 'application/pdf' });
      expect(resPdf.valid).toBe(false);
    });

    it('rejette les fichiers dépassant la limite maximale de 4 Go', () => {
      const over4Gb = MAX_VIDEO_FILE_SIZE_BYTES + 1024;
      const res = validateVideoFile({
        name: 'full_match_4k.mp4',
        mimeType: 'video/mp4',
        size: over4Gb,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Fichier trop volumineux');
    });

    it('émet un avertissement fluide pour les fichiers entre 2 Go et 4 Go', () => {
      const between2And4Gb = RECOMMENDED_VIDEO_MAX_SIZE_BYTES + 500 * 1024 * 1024;
      const res = validateVideoFile({
        name: 'long_training.mp4',
        mimeType: 'video/mp4',
        size: between2And4Gb,
      });
      expect(res.valid).toBe(true);
      expect(res.warning).toBeDefined();
      expect(res.warning).toContain('Fichier volumineux');
    });

    it('formate correctement les tailles en Ko, Mo et Go', () => {
      expect(formatBytes(0)).toBe('0 Mo');
      expect(formatBytes(512 * 1024)).toBe('512 Ko');
      expect(formatBytes(450 * 1024 * 1024)).toBe('450.0 Mo');
      expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe('2.50 Go');
    });
  });

  describe('2. Matrice des Rôles et Permissions Coach & Club', () => {
    it('autorise le Coach, le Club et le Staff à importer et associer des vidéos', () => {
      expect(canUploadAndAssociateVideo('coach')).toBe(true);
      expect(canUploadAndAssociateVideo('club')).toBe(true);
      expect(canUploadAndAssociateVideo('staff')).toBe(true);
    });

    it('refuse l’import de vidéo aux rôles Joueur et Parent', () => {
      expect(canUploadAndAssociateVideo('player')).toBe(false);
      expect(canUploadAndAssociateVideo('joueur')).toBe(false);
      expect(canUploadAndAssociateVideo('parent')).toBe(false);
      expect(canUploadAndAssociateVideo(null)).toBe(false);
    });

    it('réserve la gestion des identifiants client Veo au rôle Club', () => {
      expect(canManageVideoConnections('club')).toBe(true);
      expect(canManageVideoConnections('coach')).toBe(false);
    });
  });

  describe('3. Distinction Stricte des 5 États Veo (Sans faux « Connecté » ni direct imaginaire)', () => {
    it('l’axe Compte reste totalement indépendant de l’axe Caméra et de l’axe Flux', () => {
      // 1. Compte connecté mais aucune caméra ni flux
      const conn = describeVeoConnection({
        clientConfigured: true,
        accountVerified: true,
      });
      expect(conn.state).toBe('connected');

      // Caméra absente
      const camState = resolveCameraState(null);
      expect(camState).toBe('unpaired');
      expect(VEO_CAMERA_LABEL[camState]).toBe('Aucune caméra associée');

      // Flux absent
      const streamState = resolveStreamState(null);
      expect(streamState).toBe('unavailable');
      expect(VEO_STREAM_LABEL[streamState]).toBe('Aucun flux');
    });

    it('une vidéo uploading ou processing n’est JAMAIS étiquetée comme un direct live', () => {
      const streamUploading = resolveStreamState({ kind: 'live', status: 'uploading' });
      expect(streamUploading).toBe('starting');

      const streamProcessing = resolveStreamState({ kind: 'live', status: 'processing' });
      expect(streamProcessing).toBe('starting');

      const streamReady = resolveStreamState({ kind: 'live', status: 'ready' });
      expect(streamReady).toBe('ended');

      const streamActive = resolveStreamState({ kind: 'live', status: 'recording' });
      expect(streamActive).toBe('live');
    });
  });

  describe('4. Téléversement In-App avec Progression & Statuts', () => {
    it('parcourt les statuts jusqu’à ready sans afficher ready prématurément', async () => {
      const progressSteps: string[] = [];

      const mockBlob = new Blob(['fake video content'], { type: 'video/mp4' });

      const res = await matchVideoUploadService.uploadMatchVideoWithProgress(
        {
          clubId: 'club-test-75',
          teamLabel: 'Seniors R1',
          title: 'Match Test ProDay',
          file: {
            uri: 'blob:http://localhost/test',
            name: 'match.mp4',
            size: 1000,
            rawBlob: mockBlob,
          },
          createdByUid: 'coach-123',
        },
        (prog) => {
          progressSteps.push(prog.status);
        },
      );

      expect(progressSteps).toContain('validating');
      expect(progressSteps).toContain('uploading');
      expect(progressSteps).toContain('processing');
      expect(progressSteps).toContain('ready');
      expect(progressSteps[progressSteps.length - 1]).toBe('ready');

      expect(res.videoId).toBe('match-vid-999');
      expect(res.videoUrl).toBe('https://firebasestorage.googleapis.com/test-video.mp4');
      expect(res.video.status).toBe('ready');
    });
  });
});
