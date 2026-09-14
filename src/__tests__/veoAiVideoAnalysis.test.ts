import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  analyzeVeoMatchStream,
  getMatchAnalysisReport,
  saveMatchAnalysisReport,
  getPlayerMatchHighlights,
  computeCardImpactFromHighlights,
  VeoActionHighlight,
} from '../services/veo/veoAiVideoAnalysis.service';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../lib/firebase', () => ({
  getDb: jest.fn(() => null),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: jest.fn(() => false),
}));

describe('Phase 2 — Service d’Analyse Vidéo IA & Computer Vision VEO', () => {
  const matchId = 'match_test_j17';
  const videoUrl = 'https://app.veo.co/matches/test-match-17/embed/';

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('génère un rapport d’analyse avec détection d’événements clés et clips individualisés', async () => {
    const roster = [
      { uid: 'p-yanis', name: 'Yanis B.', number: 9, position: 'Avant-Centre' },
      { uid: 'p-lucas', name: 'Lucas M.', number: 7, position: 'Ailier Droit' },
    ];

    const report = await analyzeVeoMatchStream(matchId, videoUrl, 'J17 vs RC France', roster);

    expect(report.matchId).toBe(matchId);
    expect(report.status).toBe('analyzed');
    expect(report.totalEventsDetected).toBeGreaterThanOrEqual(3);
    expect(report.possessionTeamA + report.possessionTeamB).toBe(100);
    expect(report.highlights.length).toBeGreaterThanOrEqual(3);

    // Vérifier la conformité de chaque clip découpé
    const goalHighlight = report.highlights.find((h) => h.eventType === 'goal');
    expect(goalHighlight).toBeDefined();
    expect(goalHighlight?.playerName).toBe('Yanis B.');
    expect(goalHighlight?.confidenceScore).toBeGreaterThan(0.9);
    expect(goalHighlight?.startSec).toBeLessThan(goalHighlight!.endSec);
    expect(goalHighlight?.clipUrl).toContain('#t=');
  });

  it('permet de persister et de recharger le rapport d’analyse', async () => {
    const report = await analyzeVeoMatchStream(matchId, videoUrl, 'J17 vs RC France');
    await saveMatchAnalysisReport(report);

    const loaded = await getMatchAnalysisReport(matchId);
    expect(loaded).not.toBeNull();
    expect(loaded?.matchId).toBe(matchId);
    expect(loaded?.highlights.length).toBeGreaterThan(0);
  });

  it('filtre les temps forts pour un joueur donné', async () => {
    const roster = [
      { uid: 'p-yanis', name: 'Yanis B.', number: 9, position: 'Avant-Centre' },
      { uid: 'p-lucas', name: 'Lucas M.', number: 7, position: 'Ailier Droit' },
    ];
    await analyzeVeoMatchStream(matchId, videoUrl, 'J17 vs RC France', roster);

    const highlightsYanis = await getPlayerMatchHighlights('p-yanis', matchId);
    expect(highlightsYanis.length).toBeGreaterThanOrEqual(1);
    expect(highlightsYanis.every((h) => h.playerUid === 'p-yanis')).toBe(true);

    const highlightsLucas = await getPlayerMatchHighlights('p-lucas', matchId);
    expect(highlightsLucas.length).toBeGreaterThanOrEqual(1);
    expect(highlightsLucas.every((h) => h.playerUid === 'p-lucas')).toBe(true);
  });

  it('calcule correctement l’impact des clips sur les attributs de la carte FUT', () => {
    const mockHighlights: VeoActionHighlight[] = [
      {
        id: 'hl-1',
        matchId: 'm1',
        eventType: 'goal',
        label: 'But',
        minute: 20,
        second: 0,
        startSec: 1200,
        endSec: 1220,
        clipUrl: 'https://video.mp4',
        thumbnailUrl: 'https://thumb.jpg',
        playerUid: 'p1',
        playerName: 'Joueur 1',
        confidenceScore: 0.98,
        tags: ['BUT'],
        descriptionFr: 'Superbe but',
        radarImpact: { tech: 3, ment: 2 },
      },
      {
        id: 'hl-2',
        matchId: 'm1',
        eventType: 'assist',
        label: 'Passe D',
        minute: 40,
        second: 0,
        startSec: 2400,
        endSec: 2420,
        clipUrl: 'https://video.mp4',
        thumbnailUrl: 'https://thumb.jpg',
        playerUid: 'p1',
        playerName: 'Joueur 1',
        confidenceScore: 0.95,
        tags: ['PASSE_D'],
        descriptionFr: 'Passe décisive',
        radarImpact: { tech: 2, tact: 2 },
      },
    ];

    const impact = computeCardImpactFromHighlights(mockHighlights);
    expect(impact.totalClips).toBe(2);
    expect(impact.techBonus).toBe(5); // 3 + 2
    expect(impact.mentBonus).toBe(2);
    expect(impact.tactBonus).toBe(2);
    expect(impact.physBonus).toBe(0);
  });
});
