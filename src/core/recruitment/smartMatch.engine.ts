/**
 * Smart Match — ProDay exclusive multi-party matching.
 * Connects players, clubs, agents and recruiters using Opportunity Score,
 * Talent Radar signals, and role complementarity — not a generic CRM.
 */

import type { RecruitmentPost } from '../../models/Player';
import type { User, UserRole } from '../../models/User';
import { computeOpportunityScore, type OpportunityScoreResult } from './opportunityScore.engine';
import { buildTalentRadar, type TalentRadarHit } from './talentRadar.engine';

export type SmartMatchKind =
  | 'player_to_club_post'
  | 'player_to_agent'
  | 'agent_to_club'
  | 'recruiter_to_talent';

export interface SmartMatchEdge {
  kind: SmartMatchKind;
  fromUid: string;
  toUid: string;
  score: number;
  label: string;
  reasons: string[];
  opportunity?: OpportunityScoreResult;
  talent?: TalentRadarHit;
  postId?: string;
}

export interface SmartMatchGraph {
  edges: SmartMatchEdge[];
  generatedAt: string;
}

function normalize(value?: string | null): string {
  return value?.trim().toLowerCase() ?? '';
}

function roleOf(u: User): UserRole {
  return u.role;
}

/** Player ↔ open Mercato post (club need). */
export function matchPlayersToPosts(params: {
  players: User[];
  posts: RecruitmentPost[];
  pulseByUid?: Record<string, number>;
  maxPerPost?: number;
}): SmartMatchEdge[] {
  const maxPerPost = params.maxPerPost ?? 5;
  const edges: SmartMatchEdge[] = [];

  for (const post of params.posts.filter((p) => p.status === 'OPEN')) {
    const ranked = params.players
      .filter((p) => p.role === 'player')
      .map((player) => {
        const opportunity = computeOpportunityScore({
          player,
          post,
          pulseScore: params.pulseByUid?.[player.uid],
        });
        return { player, opportunity };
      })
      .filter((r) => r.opportunity.score >= 55)
      .sort((a, b) => b.opportunity.score - a.opportunity.score)
      .slice(0, maxPerPost);

    for (const { player, opportunity } of ranked) {
      edges.push({
        kind: 'player_to_club_post',
        fromUid: player.uid,
        toUid: post.author_uid ?? post.club_id,
        score: opportunity.score,
        label: opportunity.label,
        reasons: opportunity.reasons,
        opportunity,
        postId: post.id,
      });
    }
  }

  return edges.sort((a, b) => b.score - a.score);
}

/** Player ↔ agent: available / negotiating players near agent market. */
export function matchPlayersToAgents(params: {
  players: User[];
  agents: User[];
  pulseByUid?: Record<string, number>;
  max?: number;
}): SmartMatchEdge[] {
  const agents = params.agents.filter((a) => roleOf(a) === 'agent');
  const edges: SmartMatchEdge[] = [];

  for (const agent of agents) {
    for (const player of params.players.filter((p) => p.role === 'player')) {
      if (player.profile.availability === 'unavailable') continue;
      const opportunity = computeOpportunityScore({
        player,
        viewer: agent,
        pulseScore: params.pulseByUid?.[player.uid],
      });
      let score = opportunity.score;
      if (normalize(agent.city) && normalize(agent.city) === normalize(player.city)) {
        score = Math.min(99, score + 6);
      }
      if (score < 58) continue;
      edges.push({
        kind: 'player_to_agent',
        fromUid: player.uid,
        toUid: agent.uid,
        score,
        label: 'Matching agent · joueur',
        reasons: [
          ...opportunity.reasons.slice(0, 3),
          player.profile.availability === 'available' ? 'Libre de mandat' : 'Ouvert à discussion',
        ].filter(Boolean),
        opportunity,
      });
    }
  }

  return edges.sort((a, b) => b.score - a.score).slice(0, params.max ?? 20);
}

/** Recruiter ↔ Talent Radar hits. */
export function matchRecruitersToTalent(params: {
  recruiters: User[];
  players: User[];
  pulseByUid?: Record<string, number>;
  pulseDeltaByUid?: Record<string, number>;
  max?: number;
}): SmartMatchEdge[] {
  const edges: SmartMatchEdge[] = [];
  for (const recruiter of params.recruiters.filter(
    (r) => r.role === 'recruiter' || r.role === 'coach' || r.role === 'club'
  )) {
    const hits = buildTalentRadar({
      players: params.players,
      pulseByUid: params.pulseByUid,
      pulseDeltaByUid: params.pulseDeltaByUid,
      viewerCity: recruiter.city,
      max: params.max ?? 8,
      minScore: 55,
    });
    for (const talent of hits) {
      edges.push({
        kind: 'recruiter_to_talent',
        fromUid: recruiter.uid,
        toUid: talent.playerUid,
        score: talent.score,
        label: talent.headline,
        reasons: talent.reasons,
        talent,
      });
    }
  }
  return edges.sort((a, b) => b.score - a.score);
}

/** Build a combined smart-match graph for home / Mercato brain. */
export function buildSmartMatchGraph(params: {
  players: User[];
  posts: RecruitmentPost[];
  agents?: User[];
  staff?: User[];
  pulseByUid?: Record<string, number>;
  pulseDeltaByUid?: Record<string, number>;
}): SmartMatchGraph {
  const edges = [
    ...matchPlayersToPosts({
      players: params.players,
      posts: params.posts,
      pulseByUid: params.pulseByUid,
    }),
    ...matchPlayersToAgents({
      players: params.players,
      agents: params.agents ?? [],
      pulseByUid: params.pulseByUid,
    }),
    ...matchRecruitersToTalent({
      recruiters: params.staff ?? [],
      players: params.players,
      pulseByUid: params.pulseByUid,
      pulseDeltaByUid: params.pulseDeltaByUid,
    }),
  ].sort((a, b) => b.score - a.score);

  return {
    edges: edges.slice(0, 40),
    generatedAt: new Date().toISOString(),
  };
}
