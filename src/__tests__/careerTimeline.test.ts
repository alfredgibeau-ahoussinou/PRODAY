jest.mock('../services/storage.service', () => ({
  storageService: { uploadActivityThumbnail: jest.fn() },
}));
jest.mock('expo-video-thumbnails', () => ({
  getThumbnailAsync: jest.fn(),
}));

import {
  activityThumbnailStoragePath,
  isImageUrl,
  isVideoUrl,
  posterUrlForHighlightVideo,
} from '../utils/activityVideoThumbnail';
import {
  activityTypeIcon,
  formatActivityScoreSnippet,
  recentActivitiesForTimeline,
} from '../utils/careerTimeline';
import type { PlayerActivity } from '../models/PlayerActivity';

describe('activityVideoThumbnail', () => {
  it('construit le chemin Storage activité', () => {
    expect(activityThumbnailStoragePath('uid1', 'act42')).toBe(
      'player_activity_thumbnails/uid1/act42.jpg'
    );
  });

  it('détecte MP4 et images', () => {
    expect(isVideoUrl('https://cdn.test/highlight.mp4')).toBe(true);
    expect(isVideoUrl('https://cdn.test/poster.jpg')).toBe(false);
    expect(isImageUrl('https://cdn.test/poster.jpg')).toBe(true);
  });

  it('résout le poster profil par index highlight', () => {
    const videos = ['https://v1.mp4', 'https://v2.mp4'];
    const gallery = ['https://g1.jpg', 'https://g2.png'];
    expect(posterUrlForHighlightVideo('https://v2.mp4', videos, gallery)).toBe('https://g2.png');
    expect(posterUrlForHighlightVideo('https://unknown.mp4', videos, gallery)).toBeNull();
  });
});

describe('careerTimeline utils', () => {
  const base: PlayerActivity = {
    id: 'a1',
    player_uid: 'p1',
    type: 'match',
    date: new Date('2026-06-20'),
    duration_min: 90,
    source: 'manual',
    created_at: new Date('2026-06-20'),
  };

  it('formate le snippet score match', () => {
    expect(formatActivityScoreSnippet({ ...base, goals: 2, assists: 1, rating_self: 8 })).toBe(
      '2 buts · 1 passe · 8/10'
    );
    expect(formatActivityScoreSnippet({ ...base, type: 'training' })).toBeNull();
  });

  it('retourne les icônes par type', () => {
    expect(activityTypeIcon('match')).toBe('football');
    expect(activityTypeIcon('recovery')).toBe('heart');
    expect(activityTypeIcon('training')).toBe('time');
  });

  it('limite la timeline aux 8 activités les plus récentes', () => {
    const activities = Array.from({ length: 12 }, (_, i) => ({
      ...base,
      id: `a${i}`,
      date: new Date(2026, 5, i + 1),
    }));
    const timeline = recentActivitiesForTimeline(activities);
    expect(timeline).toHaveLength(8);
    expect(timeline[0].id).toBe('a11');
  });

  it('timeline vide sans activités', () => {
    expect(recentActivitiesForTimeline([])).toEqual([]);
  });
});
