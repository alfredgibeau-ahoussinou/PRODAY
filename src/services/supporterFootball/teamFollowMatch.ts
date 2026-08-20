/**
 * Cross-provider club follow matching (Sportmonks / football-data / legacy wt:id).
 * IDs alone are not enough: search may store sm-team-* while fixtures use fd-team-*.
 */
import { SUPPORTER_POPULAR_CLUBS } from '../../content/supporterPopularClubs';
import type { Follow } from '../../models/Follow';
import { FOOTBALL_DATA_TEAM_IDS } from '../externalScoresFootballData.provider';
import {
  normalizeMatchTeamName,
  parseFootballDataTeamId,
} from './footballDataMappers';
import type { UnifiedMatch, UnifiedTeamRef } from './types';
import {
  normalizeTeamKey,
  resolveWorldTeamApiId,
} from '../../utils/supporterWorldFollows';

/** Token sets for fuzzy club identity (name + aliases + short codes). */
function buildAliasTokenIndex(): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const club of SUPPORTER_POPULAR_CLUBS) {
    const tokens = new Set<string>();
    for (const raw of [club.name, ...(club.aliases ?? [])]) {
      const n = normalizeMatchTeamName(raw);
      const k = normalizeTeamKey(raw).replace(/\s+/g, '');
      if (n) tokens.add(n);
      if (k) tokens.add(k);
    }
    for (const t of tokens) {
      const group = out.get(t) ?? new Set<string>();
      for (const x of tokens) group.add(x);
      out.set(t, group);
    }
  }
  return out;
}

const ALIAS_INDEX = buildAliasTokenIndex();

export function teamIdentityTokens(team: Pick<UnifiedTeamRef, 'id' | 'name' | 'shortName'>): Set<string> {
  const tokens = new Set<string>();
  for (const raw of [team.name, team.shortName].filter(Boolean) as string[]) {
    const n = normalizeMatchTeamName(raw);
    const k = normalizeTeamKey(raw).replace(/\s+/g, '');
    if (n) tokens.add(n);
    if (k) tokens.add(k);
    const expanded = ALIAS_INDEX.get(n) ?? ALIAS_INDEX.get(k);
    if (expanded) for (const x of expanded) tokens.add(x);
  }
  if (team.id) tokens.add(team.id.toLowerCase());
  return tokens;
}

export function followIdentityTokens(follow: Follow): Set<string> {
  const tokens = new Set<string>();
  if (follow.target_id) tokens.add(follow.target_id.toLowerCase());
  for (const raw of [follow.target_label, follow.target_id].filter(Boolean) as string[]) {
    // Skip opaque id prefixes for name tokens
    if (/^(sm-team-|fd-team-|wt:id:)/i.test(raw) && !follow.target_label) continue;
    const label = follow.target_label || raw;
    const n = normalizeMatchTeamName(label);
    const k = normalizeTeamKey(label).replace(/\s+/g, '');
    if (n) tokens.add(n);
    if (k) tokens.add(k);
    const expanded = ALIAS_INDEX.get(n) ?? ALIAS_INDEX.get(k);
    if (expanded) for (const x of expanded) tokens.add(x);
  }
  return tokens;
}

function tokensOverlap(a: Set<string>, b: Set<string>): boolean {
  for (const t of a) {
    if (b.has(t)) return true;
  }
  return false;
}

/** Resolve football-data.org numeric team id for a club follow (PSG → 524). */
export function resolveFootballDataTeamId(follow: Follow): number | null {
  if (follow.target_type !== 'club') return null;

  const fromFd = parseFootballDataTeamId(follow.target_id);
  if (fromFd != null) return fromFd;

  const apiId = resolveWorldTeamApiId(follow);
  if (apiId != null && FOOTBALL_DATA_TEAM_IDS[apiId] != null) {
    return FOOTBALL_DATA_TEAM_IDS[apiId];
  }

  // Label / name → popular club → FD id
  const label = (follow.target_label || '').trim();
  if (label) {
    const key = normalizeTeamKey(label);
    for (const club of SUPPORTER_POPULAR_CLUBS) {
      if (club.apiTeamId == null) continue;
      const keys = [club.name, ...(club.aliases ?? [])].map(normalizeTeamKey);
      if (keys.some((k) => k === key || key.includes(k) || k.includes(key))) {
        const fd = FOOTBALL_DATA_TEAM_IDS[club.apiTeamId];
        if (fd != null) return fd;
      }
    }
  }

  return null;
}

export function matchTouchesFollow(match: UnifiedMatch, follow: Follow): boolean {
  if (follow.target_type !== 'club') return false;
  if (match.source === 'demo') return false;

  const followId = follow.target_id;
  if (
    followId &&
    (match.homeTeam.id === followId || match.awayTeam.id === followId)
  ) {
    return true;
  }

  const fdId = resolveFootballDataTeamId(follow);
  if (fdId != null) {
    const fdKey = `fd-team-${fdId}`;
    if (match.homeTeam.id === fdKey || match.awayTeam.id === fdKey) return true;
    if (match.homeTeam.externalId === fdId || match.awayTeam.externalId === fdId) {
      return true;
    }
  }

  const followTokens = followIdentityTokens(follow);
  if (!followTokens.size) return false;
  return (
    tokensOverlap(followTokens, teamIdentityTokens(match.homeTeam)) ||
    tokensOverlap(followTokens, teamIdentityTokens(match.awayTeam))
  );
}

export function filterMatchesForFollows(
  matches: UnifiedMatch[],
  follows: Follow[],
): UnifiedMatch[] {
  const clubFollows = follows.filter((f) => f.target_type === 'club');
  if (!clubFollows.length) return [];
  return matches.filter(
    (m) => m.source !== 'demo' && clubFollows.some((f) => matchTouchesFollow(m, f)),
  );
}

export function teamTouchesFollowTarget(
  team: UnifiedTeamRef,
  follow: Follow,
): boolean {
  if (follow.target_type !== 'club') return false;
  if (team.id === follow.target_id) return true;
  const fdId = resolveFootballDataTeamId(follow);
  if (fdId != null && (team.id === `fd-team-${fdId}` || team.externalId === fdId)) {
    return true;
  }
  return tokensOverlap(followIdentityTokens(follow), teamIdentityTokens(team));
}
