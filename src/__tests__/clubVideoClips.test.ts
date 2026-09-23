import { buildClipsFromVideos } from '../utils/clubVideoClips';
import type { ClubMatchVideo, MatchVideoClip } from '../models/ClubCameras';

function video(overrides: Partial<ClubMatchVideo> = {}): ClubMatchVideo {
  return {
    id: 'v1',
    club_id: 'club-1',
    source: 'external_link',
    status: 'ready',
    title: 'Seniors R1 vs RC France',
    highlights_ready: false,
    clips: [],
    player_uids: [],
    share_with: ['coaches'],
    created_by_uid: 'uid-1',
    created_at: new Date('2026-09-06T14:00:00Z'),
    ...overrides,
  };
}

describe('buildClipsFromVideos', () => {
  it('retourne un tableau vide sans vidéos ni clips', () => {
    expect(buildClipsFromVideos([])).toEqual([]);
    expect(buildClipsFromVideos([video()])).toEqual([]);
  });

  it('dérive les clips persistés avec les métadonnées de la captation', () => {
    const clips: MatchVideoClip[] = [
      { id: 'c1', label: 'Ouverture du score', starts_at_sec: 5220, ends_at_sec: 5238, url: 'https://cdn.example.fr/c1.mp4' },
      { id: 'c2', label: 'Parade sur corner', starts_at_sec: 120, ends_at_sec: 134 },
    ];
    const result = buildClipsFromVideos([
      video({ id: 'vA', event_title: 'Seniors R1 vs RC France (J3)', team_label: 'Seniors R1', clips, storage_url: 'https://cdn.example.fr/full.mp4' }),
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'vA__c1',
      title: 'Ouverture du score',
      matchTitle: 'Seniors R1 vs RC France (J3)',
      minute: '87’',
      type: 'other',
      typeLabel: 'Clip',
      authorName: 'Seniors R1',
      durationSec: 18,
      storageUrl: 'https://cdn.example.fr/c1.mp4',
    });
    // Sans url de clip : repli sur l'URL de la captation complète
    expect(result[1].storageUrl).toBe('https://cdn.example.fr/full.mp4');
    expect(result[1].minute).toBe('2’');
  });

  it('replie honnêtement les champs absents au lieu d’inventer', () => {
    const result = buildClipsFromVideos([
      video({ id: 'vB', clips: [{ id: 'c9', label: '' }] }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      title: 'Clip',
      matchTitle: 'Seniors R1 vs RC France',
      minute: '—',
      durationSec: 0,
      type: 'other',
    });
  });
});
