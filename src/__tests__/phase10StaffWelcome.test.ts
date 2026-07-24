jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  countAuthorPosts,
  countPendingApplications,
  summarizeStaffMercato,
} from '../features/v3/engines/mercatoStaff.engine';
import { buildSectionIntelligence } from '../features/v3/engines/sectionIntelligence.engine';
import { dismissV3Welcome, isV3WelcomeDismissed } from '../services/v3Preferences.service';
import type { RecruitmentPost } from '../models/Player';
import type { Application } from '../models/Player';

const posts: RecruitmentPost[] = [
  {
    id: 'p1',
    author_uid: 'staff-1',
    club_id: 'c1',
    club_name: 'FC Test',
    title: 'Milieu offensif',
    position: 'Milieu',
    city: 'Paris',
    category: 'Senior',
    level: 'Régional',
    description: 'Recherche milieu',
    created_at: new Date(),
    status: 'OPEN',
  },
  {
    id: 'p2',
    author_uid: 'other',
    club_id: 'c2',
    club_name: 'Autre Club',
    title: 'Attaquant',
    position: 'Attaquant',
    city: 'Lyon',
    category: 'Senior',
    level: 'National',
    description: 'Recherche attaquant',
    created_at: new Date(),
    status: 'OPEN',
  },
];

const applications: Application[] = [
  {
    id: 'a1',
    post_id: 'p1',
    post_author_uid: 'staff-1',
    player_uid: 'player-1',
    player_name: 'Joueur',
    cover_letter: 'Motivé',
    cv_pdf_url: '',
    status: 'PENDING',
    created_at: new Date(),
  },
  {
    id: 'a2',
    post_id: 'p1',
    post_author_uid: 'staff-1',
    player_uid: 'player-2',
    player_name: 'Joueur 2',
    cover_letter: 'OK',
    cv_pdf_url: '',
    status: 'ACCEPTED',
    created_at: new Date(),
  },
];

describe('Phase 10. Mercato staff + bienvenue V3', () => {
  it('résume le pipeline staff Mercato', () => {
    const summary = summarizeStaffMercato({
      posts,
      authorUid: 'staff-1',
      pendingApplications: countPendingApplications(applications),
    });
    expect(summary.myPostsCount).toBe(1);
    expect(summary.marketplacePosts).toBe(2);
    expect(summary.pendingApplications).toBe(1);
    expect(countAuthorPosts(posts, 'staff-1')).toBe(1);
  });

  it('intelligence staff Mercato inclut pipeline et scouting', () => {
    const intel = buildSectionIntelligence({
      tab: 'recrutement',
      staffMode: true,
      mercatoPosts: 2,
      mercatoApplications: 3,
      globalScore: 75,
    });
    expect(intel.insights.some((i) => i.id === 'candidates-pending')).toBe(true);
    expect(intel.insights.some((i) => i.id === 'scouting')).toBe(true);
    expect(intel.insights.some((i) => i.id === 'visibility')).toBe(false);
  });

  it('persiste le dismiss de la bannière bienvenue', async () => {
    expect(await isV3WelcomeDismissed('uid-1')).toBe(false);
    await dismissV3Welcome('uid-1');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'proday_v3_welcome_dismissed_v1:uid-1',
      '1'
    );
  });
});
