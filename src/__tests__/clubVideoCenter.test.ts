/**
 * Centre Vidéo — contenu produit + stats agrégées.
 */
import {
  VIDEO_ACCESS_ROLES,
  VIDEO_CENTER_TABS,
  VIDEO_LIBRARY_BUCKETS,
  VIDEO_LIVE_EVENTS,
  VIDEO_PACKS_COPY,
  VIDEO_PROCESSING_STAGES,
  formatStorageGb,
} from '../content/clubVideoCenter';
import {
  computeClubVideoCenterStats,
  type ClubCamera,
  type ClubMatchVideo,
} from '../models/ClubCameras';

describe('clubVideoCenter content', () => {
  it('expose le parcours Centre → Caméras → Captations → Bibliothèque → IA → Offres', () => {
    expect(VIDEO_CENTER_TABS.map((t) => t.id)).toEqual([
      'dashboard',
      'cameras',
      'schedule',
      'library',
      'ai',
      'offers',
    ]);
    expect(VIDEO_PROCESSING_STAGES.map((s) => s.id)).toContain('ready');
    expect(VIDEO_LIVE_EVENTS.length).toBeGreaterThanOrEqual(7);
    expect(VIDEO_LIVE_EVENTS.every((e) => e.icon && !('symbol' in e))).toBe(true);
    expect(VIDEO_LIVE_EVENTS.find((e) => e.id === 'yellow')?.iconColor).toBe('#FFD60A');
    expect(VIDEO_LIVE_EVENTS.find((e) => e.id === 'red')?.iconColor).toBe('#FF375F');
    expect(VIDEO_LIBRARY_BUCKETS.map((b) => b.id)).toEqual(
      expect.arrayContaining(['matches', 'talks', 'clips', 'highlights']),
    );
    expect(VIDEO_ACCESS_ROLES.map((r) => r.id)).toEqual(
      expect.arrayContaining(['president', 'coach', 'player', 'parent']),
    );
  });

  it('présente les packs sans prix caméra fixe', () => {
    expect(VIDEO_PACKS_COPY.essentiel.body).toMatch(/3 €/);
    expect(VIDEO_PACKS_COPY.camera.body.toLowerCase()).toContain('devis');
    expect(VIDEO_PACKS_COPY.camera.body).not.toMatch(/39[,.]99/);
  });

  it('formate le stockage', () => {
    expect(formatStorageGb(512)).toBe('512 Mo');
    expect(formatStorageGb(2048)).toBe('2.0 Go');
  });
});

describe('computeClubVideoCenterStats', () => {
  it('agrège KPIs club', () => {
    const now = new Date(2026, 7, 11);
    const cameras: ClubCamera[] = [
      {
        id: 'c1',
        club_id: 'club',
        vendor: 'veo',
        brand_label: 'Veo',
        model: 'Veo 3',
        status: 'connected',
        team_ids: ['u18', 'u16'],
        team_labels: ['U18', 'U16'],
        storage_used_mb: 1024,
        sync_status: 'ok',
        created_by_uid: 'u1',
        created_at: now,
      },
      {
        id: 'c2',
        club_id: 'club',
        vendor: 'xbotgo',
        brand_label: 'XbotGo',
        model: 'Chameleon',
        status: 'disconnected',
        team_id: 'seniors',
        team_label: 'Seniors A',
        storage_used_mb: 256,
        sync_status: 'idle',
        created_by_uid: 'u1',
        created_at: now,
      },
    ];
    const videos: ClubMatchVideo[] = [
      {
        id: 'v1',
        club_id: 'club',
        source: 'camera_api',
        status: 'ready',
        title: 'U18 vs Paris',
        highlights_ready: true,
        ai_ready: true,
        clips: [],
        player_uids: [],
        share_with: ['players', 'coaches'],
        created_by_uid: 'u1',
        created_at: now,
      },
      {
        id: 'v2',
        club_id: 'club',
        source: 'import',
        status: 'processing',
        title: 'U16 vs Lyon',
        highlights_ready: false,
        clips: [],
        player_uids: [],
        share_with: ['coaches'],
        created_by_uid: 'u1',
        created_at: new Date(2026, 5, 1),
      },
    ];

    const stats = computeClubVideoCenterStats(cameras, videos, now);
    expect(stats.matchesFilmedMonth).toBe(1);
    expect(stats.matchesAiAnalyzed).toBe(1);
    expect(stats.camerasConnected).toBe(1);
    expect(stats.teamsEquipped).toBe(3);
    expect(stats.storageUsedMb).toBe(1280);
    expect(stats.videosSharedWithPlayers).toBe(1);
  });
});
