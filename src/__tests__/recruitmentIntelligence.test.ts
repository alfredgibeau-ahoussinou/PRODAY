import type { User } from '../models/User';
import type { RecruitmentPost } from '../models/Player';
import {
  computeOpportunityScore,
  rankByOpportunityScore,
} from '../core/recruitment/opportunityScore.engine';
import { buildTalentRadar } from '../core/recruitment/talentRadar.engine';
import {
  buildScoutReportDraft,
  averageAttributeRating,
  isScoutReportComplete,
  recommendFromOpportunityBand,
} from '../core/recruitment/scoutReport.engine';
import {
  buildOneClickRecruitmentPlan,
  oneClickProgress,
} from '../core/recruitment/oneClickRecruitment.engine';
import { buildSmartMatchGraph } from '../core/recruitment/smartMatch.engine';
import {
  filterPlayersAdvanced,
  countActiveAdvancedFilters,
} from '../core/recruitment/advancedPlayerSearch.engine';

function player(overrides: Partial<User> = {}): User {
  return {
    uid: overrides.uid ?? 'p1',
    display_name: overrides.display_name ?? 'Léa Martin',
    email: 'lea@test.com',
    role: 'player',
    profile: {
      position: 'Ailier',
      category: 'U19',
      level: 'R1',
      availability: 'available',
      season_stats: { matches: 12, goals: 5, assists: 3 },
      ...(overrides.profile ?? {}),
    },
    city: 'Lyon',
    player_level: 'academy',
    club_certification_verified: true,
    is_verified: true,
    verification_status: 'VERIFIED',
    ...overrides,
  } as User;
}

const post: RecruitmentPost = {
  id: 'post1',
  club_id: 'c1',
  club_name: 'Olympique Test',
  title: 'Ailier U19',
  position: 'Ailier',
  category: 'U19',
  level: 'R1',
  city: 'Lyon',
  description: 'Recherche ailier dynamique',
  created_at: new Date(),
  status: 'OPEN',
  author_uid: 'club1',
};

describe('Opportunity Score', () => {
  it('scores high for aligned available verified player', () => {
    const result = computeOpportunityScore({
      player: player(),
      post,
      pulseScore: 72,
    });
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.band === 'excellent' || result.band === 'strong').toBe(true);
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('ranks players by opportunity', () => {
    const ranked = rankByOpportunityScore(
      [
        player({ uid: 'fit' }),
        player({
          uid: 'miss',
          city: 'Brest',
          profile: {
            position: 'Gardien',
            level: 'D3',
            availability: 'unavailable',
            season_stats: { matches: 1, goals: 0, assists: 0 },
          },
          club_certification_verified: false,
          is_verified: false,
        }),
      ],
      { post, minScore: 20, max: 5 }
    );
    expect(ranked[0].player.uid).toBe('fit');
    expect(ranked[0].opportunity.score).toBeGreaterThan(ranked[ranked.length - 1].opportunity.score);
  });
});

describe('Talent Radar', () => {
  it('surfaces rising under-the-radar academy talent', () => {
    const hits = buildTalentRadar({
      players: [
        player({
          uid: 'rising',
          profile: {
            position: 'Milieu',
            category: 'U17',
            level: 'R2',
            availability: 'available',
            season_stats: { matches: 10, goals: 2, assists: 4 },
          },
        }),
      ],
      pulseByUid: { rising: 68 },
      pulseDeltaByUid: { rising: 12 },
      viewerCity: 'Lyon',
      minScore: 45,
    });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].tier === 'hot' || hits[0].tier === 'rising' || hits[0].tier === 'watch').toBe(
      true
    );
    expect(hits[0].reasons.length).toBeGreaterThan(0);
  });
});

describe('Scout report engine', () => {
  it('builds draft from opportunity band', () => {
    const draft = buildScoutReportDraft({
      playerUid: 'p1',
      authorUid: 'scout1',
      title: 'Essai amical',
      opportunityBand: 'strong',
      opportunityScore: 74,
      attributes: [
        { id: 'technique', rating: 4 },
        { id: 'tactique', rating: 4 },
        { id: 'physique', rating: 3 },
        { id: 'mental', rating: 4 },
        { id: 'potentiel', rating: 5 },
        { id: 'attitude', rating: 4 },
      ],
      summary: 'Profil intéressant sur le côté droit, bon pressing.',
    });
    expect(draft.recommendation).toBe('trial');
    expect(averageAttributeRating(draft.attributes)).toBeGreaterThan(3);
    expect(isScoutReportComplete(draft)).toBe(true);
  });

  it('maps bands to recommendations', () => {
    expect(recommendFromOpportunityBand('excellent')).toBe('sign');
    expect(recommendFromOpportunityBand('low')).toBe('need_more_data');
  });
});

describe('One-click recruitment', () => {
  it('suggests shortlist first then scout report', () => {
    const plan = buildOneClickRecruitmentPlan({
      playerUid: 'p1',
      postId: 'post1',
      opportunityScore: 82,
      opportunityBand: 'excellent',
    });
    expect(plan.primaryAction).toBe('shortlist');
    expect(plan.steps).toHaveLength(6);
    const progress = oneClickProgress(plan);
    expect(progress.done).toBe(0);
    expect(progress.total).toBe(6);

    const advanced = buildOneClickRecruitmentPlan({
      playerUid: 'p1',
      opportunityScore: 82,
      opportunityBand: 'excellent',
      alreadyShortlisted: true,
      hasScoutReport: true,
      trialScheduled: true,
    });
    expect(oneClickProgress(advanced).done).toBeGreaterThanOrEqual(3);
  });
});

describe('Smart Match graph', () => {
  it('links players to open posts', () => {
    const graph = buildSmartMatchGraph({
      players: [player()],
      posts: [post],
      agents: [
        {
          uid: 'a1',
          display_name: 'Agent',
          email: 'a@test.com',
          role: 'agent',
          city: 'Lyon',
          profile: {},
          is_verified: true,
        } as User,
      ],
      staff: [
        {
          uid: 'r1',
          display_name: 'Recruteur',
          email: 'r@test.com',
          role: 'recruiter',
          city: 'Lyon',
          profile: {},
          is_verified: true,
        } as User,
      ],
      pulseByUid: { p1: 70 },
      pulseDeltaByUid: { p1: 10 },
    });
    expect(graph.edges.some((e) => e.kind === 'player_to_club_post')).toBe(true);
    expect(graph.generatedAt).toBeTruthy();
  });
});

describe('Advanced player search', () => {
  it('filters by availability, verified and opportunity', () => {
    const viewer = {
      uid: 'v1',
      role: 'recruiter',
      city: 'Lyon',
      profile: { position: 'Ailier', level: 'R1' },
    } as User;
    const results = filterPlayersAdvanced(
      [
        player({ uid: 'ok' }),
        player({
          uid: 'no',
          profile: {
            position: 'Gardien',
            availability: 'unavailable',
            season_stats: { matches: 0, goals: 0, assists: 0 },
          },
          club_certification_verified: false,
          is_verified: false,
        }),
      ],
      {
        availability: ['available'],
        verified_only: true,
        min_opportunity_score: 50,
        viewer,
        pulseByUid: { ok: 70, no: 20 },
      }
    );
    expect(results.map((p) => p.uid)).toEqual(['ok']);
    expect(
      countActiveAdvancedFilters({
        verified_only: true,
        availability: ['available'],
        min_opportunity_score: 50,
      })
    ).toBe(3);
  });
});
