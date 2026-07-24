import { buildMercatoPostRecommendations } from '../core/recommendation/mercatoRecommendation.engine';
import { rankFeedPosts } from '../core/recommendation/feedRanking.engine';
import { peekCalendar } from '../features/v3/engines/smartCalendar.engine';
import type { RecruitmentPost } from '../models/Player';
import type { User } from '../models/User';
import type { PlatformFeedPost } from '../models/PlatformFeed';
import type { CalendarEntity } from '../core/calendar/calendarSync.engine';

const profile: User = {
  uid: 'p1',
  display_name: 'Test',
  email: 't@test.com',
  role: 'player',
  is_verified: true,
  verification_status: 'NOT_REQUIRED',
  profile: { position: 'Milieu', level: 'Régional' },
  documents: [],
  created_at: new Date(),
  updated_at: new Date(),
  is_active: true,
  city: 'Paris',
};

describe('Phase 5. Mercato Profil Feed Calendrier', () => {
  it('priorise les annonces compatibles', () => {
    const posts: RecruitmentPost[] = [
      {
        id: 'a',
        club_id: 'c1',
        club_name: 'FC Paris',
        title: 'Milieu',
        position: 'Milieu',
        category: 'Senior',
        level: 'Régional',
        city: 'Paris',
        description: '',
        created_at: new Date(),
        status: 'OPEN',
      },
      {
        id: 'b',
        club_id: 'c2',
        club_name: 'AS Lyon',
        title: 'Défenseur',
        position: 'Défenseur',
        category: 'Senior',
        level: 'National',
        city: 'Lyon',
        description: '',
        created_at: new Date(),
        status: 'OPEN',
      },
    ];
    const recs = buildMercatoPostRecommendations({
      profile,
      posts,
      pulseScore: 70,
      profileCompletion: 80,
    });
    expect(recs[0].postId).toBe('a');
  });

  it('priorise le fil local', () => {
    const posts: PlatformFeedPost[] = [
      {
        id: '1',
        type: 'news',
        audience: 'all',
        author_uid: 'a1',
        author_name: 'Agent',
        author_role: 'agent',
        title: 'Actu Lyon',
        body: 'Événement à Lyon',
        created_at: new Date(Date.now() - 86400000),
      },
      {
        id: '2',
        type: 'news',
        audience: 'all',
        author_uid: 'a2',
        author_name: 'Club Paris',
        author_role: 'club',
        title: 'Actu Paris',
        body: 'Tournoi à Paris cette semaine',
        created_at: new Date(Date.now() - 3600000),
      },
    ];
    const ranked = rankFeedPosts({ posts, profile });
    expect(ranked[0].title).toContain('Paris');
  });

  it('extrait le calendrier du jour depuis le Brain', () => {
    const today = new Date();
    today.setHours(19, 0, 0, 0);
    const entities: CalendarEntity[] = [
      {
        id: 'cal-1',
        kind: 'match',
        title: 'Match amical',
        subtitle: 'Senior',
        startsAt: today,
        city: 'Paris',
        tab: 'matchs',
        sourceId: 'm1',
        autoAdded: false,
      },
    ];
    const peek = peekCalendar(entities, new Date());
    expect(peek.today.length).toBe(1);
    expect(peek.today[0].title).toBe('Match amical');
  });
});
