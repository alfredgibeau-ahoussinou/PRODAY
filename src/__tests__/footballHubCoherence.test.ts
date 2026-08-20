jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  where: jest.fn(),
}));
jest.mock('../services/teamEvents.service', () => ({
  teamEventsService: { getById: jest.fn() },
}));
jest.mock('../services/supporterMatchHub.service', () => ({
  fetchSupporterMatchHub: jest.fn(),
}));
jest.mock('../lib/firebase', () => ({
  getDb: () => null,
  getFirebaseAuth: () => null,
}));
jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: () => false,
}));

import { FOOTBALL_HUB_COPY } from '../features/footballHub/theme/footballHubTheme';
import {
  findCompetitionById,
  listCompetitionsForCountry,
} from '../content/supporterCompetitionsCatalog';
import { resolveMatchCenterTabs } from '../services/footballData/FootballDataFacade';
import type { FootballMatchDetail } from '../services/footballData/types';
import {
  DEBATE_BODY_MAX,
  validateDebateBody,
} from '../models/SupporterDebatePost';
import { supporterDebateService } from '../services/supporterDebate.service';
import { getFeaturedPopularClubs } from '../content/supporterPopularClubs';
import { worldFollowTargetForTeam } from '../utils/supporterWorldFollows';
import { getTabShortLabel } from '../content/poleExperience';
import { resolveTabIcon } from '../components/navigation/tabBarShared';

describe('football hub coherence', () => {
  const baseDetail: FootballMatchDetail = {
    item: {
      id: 'world-fixture-api_1',
      source: 'world',
      status: 'upcoming',
      genderScope: 'unspecified',
      homeLabel: 'Marseille',
      awayLabel: 'Strasbourg',
      startsAt: new Date('2026-08-20T20:45:00'),
      competitionLabel: 'Ligue 1',
    },
    source: 'world',
    lineups: [],
    events: [],
    statistics: null,
    prodayEvent: null,
  };

  it('Match Center tabs horizontaux : résumé, stats, compositions, événements', () => {
    const tabs = resolveMatchCenterTabs(baseDetail, false);
    expect(tabs[0]).toBe('resume');
    expect(tabs).toEqual(['resume', 'stats', 'compositions', 'events']);
    expect(tabs).not.toContain('video');
  });

  it('vidéo seulement si droits / URL ProDay', () => {
    const tabs = resolveMatchCenterTabs(
      { ...baseDetail, source: 'proday', item: { ...baseDetail.item, source: 'proday' } },
      true,
    );
    expect(tabs).toContain('video');
    expect(tabs).toContain('analyse');
  });

  it('catalogue Coupe du monde (API-Football league id 1)', () => {
    const wc = findCompetitionById('world_cup');
    expect(wc).toBeDefined();
    expect(wc!.leagueId).toBe(1);
    expect(wc!.label).toMatch(/monde/i);
    expect(listCompetitionsForCountry('WW').some((c) => c.id === 'world_cup')).toBe(true);
  });

  it('clubs populaires exposent des cibles follow wt:id', () => {
    const featured = getFeaturedPopularClubs();
    expect(featured.length).toBeGreaterThan(3);
    const psg = featured.find((c) => c.name.includes('Paris'));
    expect(psg?.apiTeamId).toBe(85);
    const target = worldFollowTargetForTeam({
      apiTeamId: psg!.apiTeamId,
      name: psg!.name,
    });
    expect(target.id).toBe('wt:id:85');
    expect(target.type).toBe('club');
  });

  it('dock labels Accueil · Matchs · ProDay · Favoris · Profil', () => {
    expect(getTabShortLabel('home', 'supporter', 'supporter')).toBe('Accueil');
    expect(getTabShortLabel('matchs', 'supporter', 'supporter')).toBe('Matchs');
    expect(getTabShortLabel('feed', 'supporter', 'supporter')).toBe('ProDay');
    expect(getTabShortLabel('plus', 'supporter', 'supporter')).toBe('Favoris');
    expect(getTabShortLabel('profil', 'supporter', 'supporter')).toBe('Profil');
    expect(getTabShortLabel('messages', 'supporter', 'supporter')).toBe('Tribune');
  });

  it('Favoris = bookmark, ProDay ≠ heart', () => {
    expect(resolveTabIcon('plus', 'supporter', 'supporter')).toBe('bookmark');
    expect(resolveTabIcon('feed', 'supporter', 'supporter')).toBe('star-four-points');
    expect(resolveTabIcon('feed', 'supporter', 'supporter')).not.toBe('heart');
  });

  it('copy FR expose Chercher / Tribune / Coupe du monde', () => {
    expect(FOOTBALL_HUB_COPY.searchCta).toBe('Chercher');
    expect(FOOTBALL_HUB_COPY.tribuneCta).toBe('Tribune');
    expect(FOOTBALL_HUB_COPY.worldCupLabel).toMatch(/monde/i);
  });
});

describe('supporterDebateService', () => {
  beforeEach(() => {
    supporterDebateService._resetLocalForTests();
  });

  it('valide la longueur du post (2–280)', () => {
    expect(() => validateDebateBody('')).toThrow();
    expect(() => validateDebateBody('a')).toThrow();
    expect(validateDebateBody('Go OM')).toBe('Go OM');
    expect(() => validateDebateBody('x'.repeat(DEBATE_BODY_MAX + 1))).toThrow();
  });

  it('crée un post local (beta / hors Firebase)', async () => {
    const post = await supporterDebateService.createPost({
      author_uid: 'u1',
      author_name: 'Alex',
      body: 'Beau match ce soir',
      match_id: 'world-fixture-1',
      match_label: 'OM vs Strasbourg',
    });
    expect(post.id).toBeTruthy();
    expect(post.body).toBe('Beau match ce soir');
    expect(post.match_id).toBe('world-fixture-1');
    expect(post.like_count).toBe(0);

    const thread = await supporterDebateService.listForMatch('world-fixture-1');
    expect(thread.some((p) => p.id === post.id)).toBe(true);

    const global = await supporterDebateService.createPost({
      author_uid: 'u1',
      author_name: 'Alex',
      body: 'Tribune ouverte',
    });
    const feed = await supporterDebateService.listGlobal();
    expect(feed.some((p) => p.id === global.id)).toBe(true);
  });
});
