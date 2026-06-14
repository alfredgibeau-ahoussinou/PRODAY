import { getPostMercatoFit } from '../features/v3/engines/mercatoPostDetail.engine';
import { getLastCalendarSyncAt, setLastCalendarSyncAt } from '../services/v3Preferences.service';
import type { User } from '../models/User';
import type { RecruitmentPost } from '../models/Player';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

const player: User = {
  uid: 'p1',
  display_name: 'Joueur',
  email: 'j@test.com',
  role: 'player',
  is_verified: true,
  verification_status: 'NOT_REQUIRED',
  profile: { position: 'Milieu', level: 'Régional', category: 'Senior' },
  documents: [],
  created_at: new Date(),
  updated_at: new Date(),
  is_active: true,
  city: 'Paris',
};

const post: RecruitmentPost = {
  id: 'post-1',
  author_uid: 'club-1',
  club_id: 'club-1',
  club_name: 'FC Test',
  title: 'Milieu créatif',
  position: 'Milieu',
  city: 'Paris',
  category: 'Senior',
  level: 'Régional',
  description: 'Recherche milieu',
  created_at: new Date(),
  status: 'OPEN',
};

describe('Phase 12 — Mercato détail + calendrier', () => {
  it('calcule le score IA sur une annonce unique', () => {
    const fit = getPostMercatoFit({ profile: player, post, pulseScore: 72 });
    expect(fit).not.toBeNull();
    expect(fit!.postId).toBe('post-1');
    expect(fit!.iaScore).toBeGreaterThan(0);
    expect(fit!.fitLabel.length).toBeGreaterThan(0);
  });

  it('persiste la date de dernière sync calendrier', async () => {
    await setLastCalendarSyncAt('uid-1', 1_700_000_000_000);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'proday_v3_calendar_last_sync_v1:uid-1',
      '1700000000000'
    );
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('1700000000000');
    expect(await getLastCalendarSyncAt('uid-1')).toBe(1_700_000_000_000);
  });
});
