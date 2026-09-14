import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  veoLiveStreamService,
  type VeoClubConfig,
  type VeoMatchStream,
} from '../services/veo/veoLiveStream.service';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../lib/firebase', () => ({
  getDb: jest.fn(() => null),
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
  serverTimestamp: jest.fn(),
}));

jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: jest.fn(() => false),
}));

describe('veoLiveStreamService (Priorité Absolue v4)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('génère une configuration par défaut pour un club', async () => {
    const config = await veoLiveStreamService.getClubVeoConfig('club-test-1');
    expect(config.club_id).toBe('club-test-1');
    expect(config.connection_status).toBe('connected');
    expect(config.model).toBe('veo_cam_3_5g');
  });

  it('sauvegarde et recharge la configuration de caméra VEO d’un club', async () => {
    const customConfig: Partial<VeoClubConfig> = {
      club_name: 'FC ProDay',
      model: 'veo_cam_3_5g',
      camera_serial: 'VEO3-5G-98412',
      stream_source_type: 'hls_stream',
      default_stream_url: 'https://live.veo.co/stream/fc-proday.m3u8',
      connection_status: 'connected',
    };

    await veoLiveStreamService.saveClubVeoConfig('club-test-1', customConfig);
    const loaded = await veoLiveStreamService.getClubVeoConfig('club-test-1');

    expect(loaded.camera_serial).toBe('VEO3-5G-98412');
    expect(loaded.model).toBe('veo_cam_3_5g');
    expect(loaded.connection_status).toBe('connected');
  });

  it('construit une URL d’intégration embed officielle Veo Live', () => {
    const embed1 = veoLiveStreamService.buildVeoEmbedUrl('fc-proday-vs-meudon');
    expect(embed1).toBe('https://app.veo.co/matches/fc-proday-vs-meudon/embed/');

    const embed2 = veoLiveStreamService.buildVeoEmbedUrl(
      'https://app.veo.co/matches/xyz-match/'
    );
    expect(embed2).toBe('https://app.veo.co/matches/xyz-match/embed/');
  });

  it('liste les diffusions avec distinction stricte live / replay', async () => {
    const streams = await veoLiveStreamService.listMatchStreams('club-proday-1');
    expect(streams.length).toBeGreaterThanOrEqual(2);

    const liveStream = streams.find((s: VeoMatchStream) => s.stream_kind === 'live');
    const replayStream = streams.find((s: VeoMatchStream) => s.stream_kind === 'replay');

    expect(liveStream).toBeDefined();
    expect(liveStream?.is_live).toBe(true);
    expect(liveStream?.status).toBe('live');

    expect(replayStream).toBeDefined();
    expect(replayStream?.is_live).toBe(false);
    expect(replayStream?.status).toBe('ready');
  });

  it('enregistre et retrouve une diffusion de match spécifique', async () => {
    await veoLiveStreamService.linkStreamToMatch({
      matchId: 'match-custom-100',
      clubId: 'club-test-1',
      title: 'Finale Coupe vs ES Colombes',
      streamKind: 'live',
      streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    });

    const found = await veoLiveStreamService.getMatchStream('match-custom-100', 'club-test-1');
    expect(found).toBeDefined();
    expect(found?.title).toBe('Finale Coupe vs ES Colombes');
    expect(found?.is_live).toBe(true);
  });

  it('estime la latence véridique du flux sans valeurs aberrantes', () => {
    const mockLiveStream: VeoMatchStream = {
      id: 's1',
      match_id: 'm1',
      club_id: 'c1',
      title: 'Direct Test',
      stream_kind: 'live',
      is_live: true,
      status: 'live',
      latency_sec: 14,
      updated_at: new Date().toISOString(),
    };

    const latency = veoLiveStreamService.estimateLatency(mockLiveStream);
    expect(latency).toBeGreaterThanOrEqual(5);
    expect(latency).toBeLessThanOrEqual(40);
  });
});
