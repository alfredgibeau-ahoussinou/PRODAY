jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(async () => ({ id: 'mock-doc-id' })),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(async () => ({ docs: [] })),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => ({ __serverTimestamp: true })),
  Timestamp: {
    fromDate: (d: Date) => d,
  },
  where: jest.fn(),
}));

jest.mock('../lib/firebase', () => ({
  getDb: jest.fn(() => ({})),
}));

jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: jest.fn(() => false),
}));

import { veoService } from '../services/veo/veo.service';

describe('Boucle 1 — Intégration VEO & Interfaces Réelles', () => {
  describe('Diagnostic et statut des accès OAuth Partner', () => {
    it('documente honnêtement le blocage si les clés API Partner OAuth ne sont pas configurées', () => {
      const status = veoService.getVeoAuthStatus();
      expect(status.status).toBe('blocked_documented');
      expect(status.hasPartnerOAuth).toBe(false);
      expect(status.message).toContain('Blocage documenté');
      expect(status.message).toContain('Identifiants Partenaire Veo');
    });
  });

  describe('Parsing et validation des URLs Veo et flux directs', () => {
    it('valide et extrait le matchId d’une URL de match Veo publique', () => {
      const parsed = veoService.parseVeoUrl(
        'https://app.veo.co/matches/senior-r1-vs-rc-france-2026/',
      );
      expect(parsed.isValid).toBe(true);
      expect(parsed.isVeoDomain).toBe(true);
      expect(parsed.matchId).toBe('senior-r1-vs-rc-france-2026');
      expect(parsed.embedUrl).toBe(
        'https://app.veo.co/embed/senior-r1-vs-rc-france-2026/',
      );
      expect(parsed.isDirectStream).toBe(false);
    });

    it('valide et normalise une URL d’embed Veo', () => {
      const parsed = veoService.parseVeoUrl(
        'https://app.veo.co/embed/match-u17-idf-cup/',
      );
      expect(parsed.isValid).toBe(true);
      expect(parsed.isVeoDomain).toBe(true);
      expect(parsed.matchId).toBe('match-u17-idf-cup');
      expect(parsed.embedUrl).toBe('https://app.veo.co/embed/match-u17-idf-cup/');
    });

    it('reconnaît un flux vidéo direct MP4', () => {
      const parsed = veoService.parseVeoUrl(
        'https://cdn.proday.fr/videos/matches/proday-vs-versailles.mp4',
      );
      expect(parsed.isValid).toBe(true);
      expect(parsed.isDirectStream).toBe(true);
      expect(parsed.isVeoDomain).toBe(false);
      expect(parsed.streamUrl).toBe(
        'https://cdn.proday.fr/videos/matches/proday-vs-versailles.mp4',
      );
    });

    it('reconnaît un flux vidéo direct HLS (.m3u8)', () => {
      const parsed = veoService.parseVeoUrl(
        'https://live.proday.fr/hls/terrain-honneur.m3u8',
      );
      expect(parsed.isValid).toBe(true);
      expect(parsed.isDirectStream).toBe(true);
    });

    it('rejette une chaîne vide ou invalide avec un message d’erreur explicite', () => {
      const empty = veoService.parseVeoUrl('');
      expect(empty.isValid).toBe(false);
      expect(empty.error).toBe('URL de captation vide.');

      const invalid = veoService.parseVeoUrl('pas-une-url');
      expect(invalid.isValid).toBe(false);
      expect(invalid.error).toBe('Format d’URL invalide.');
    });
  });

  describe('Association d’un match Veo au club', () => {
    it('associe un enregistrement Veo au club avec métadonnées conformes', async () => {
      const match = await veoService.associateMatch({
        clubId: 'club-proday-test',
        title: 'Seniors R1 vs RC France',
        teamLabel: 'Seniors R1',
        opponent: 'RC France',
        veoUrl: 'https://app.veo.co/matches/senior-r1-vs-rc-france-2026/',
        createdByUid: 'coach-test-uid',
      });

      expect(match.id).toBeDefined();
      expect(match.club_id).toBe('club-proday-test');
      expect(match.vendor).toBe('veo');
      expect(match.title).toBe('Seniors R1 vs RC France');
      expect(match.opponent).toBe('RC France');
      expect(match.status).toBe('ready');
      expect(match.storage_url).toContain('veo.co');
      expect(match.highlights_ready).toBe(false);
      expect(match.ai_ready).toBe(false);
      expect(match.source_verified).toBe(false);
      expect(match.clips).toEqual([]);
      // L'analyse IA vient après validation de la boucle 1
      expect(match.share_with).toContain('coaches');
    });

    it('rattache la captation à la fiche de match du calendrier quand un événement est fourni', async () => {
      const scheduledAt = new Date('2026-09-06T14:00:00Z');
      const match = await veoService.associateMatch({
        clubId: 'club-proday-test',
        title: 'Seniors R1 vs RC France',
        teamLabel: 'Seniors R1',
        veoUrl: 'https://app.veo.co/matches/senior-r1-vs-rc-france-2026/',
        createdByUid: 'coach-test-uid',
        eventId: 'event-abc-123',
        eventTitle: 'Seniors R1 vs RC France (Journée 3)',
        scheduledAt,
      });

      expect(match.event_id).toBe('event-abc-123');
      expect(match.event_title).toBe('Seniors R1 vs RC France (Journée 3)');
      expect(match.scheduled_at).toEqual(scheduledAt);
    });

    it('n’associe aucun événement du calendrier par défaut', async () => {
      const match = await veoService.associateMatch({
        clubId: 'club-proday-test',
        title: 'Amical sans fiche',
        veoUrl: 'https://app.veo.co/matches/amical-sans-fiche/',
        createdByUid: 'coach-test-uid',
      });

      expect(match.event_id).toBeUndefined();
    });

    it('lève une exception si l’URL fournie est invalide', async () => {
      await expect(
        veoService.associateMatch({
          clubId: 'club-proday-test',
          title: 'Match sans URL valide',
          veoUrl: 'ceci-est-invalide',
          createdByUid: 'coach-test-uid',
        }),
      ).rejects.toThrow('Format d’URL invalide.');
    });
  });

  describe('Test de résilience et connectivité de flux', () => {
    it('gère la vérification réseau sans lever d’exception', async () => {
      const result = await veoService.checkStreamReachability(
        'https://example.com/streams/match-test.mp4',
      );
      expect(typeof result).toBe('boolean');
    });

    it('retourne false immédiatement pour une URL vide', async () => {
      const result = await veoService.checkStreamReachability('');
      expect(result).toBe(false);
    });
  });
});
