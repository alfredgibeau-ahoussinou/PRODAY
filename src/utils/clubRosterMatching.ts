/**
 * Correspondance ProDay — aide à identifier des profils (pas une décision).
 */

import type { User } from '../models/User';
import type {
  ClubRosterNeed,
  RosterMatchCandidate,
  RosterPositionId,
} from '../models/ClubRosterBoard';
import { ROSTER_POSITION_LABELS } from '../models/ClubRosterBoard';

const POSITION_ALIASES: Record<RosterPositionId, string[]> = {
  goalkeeper: ['gb', 'gardien', 'goal', 'gk', 'goalkeeper'],
  defender: ['dc', 'défenseur', 'defenseur', 'cb', 'central', 'defender'],
  fullback: ['dg', 'dd', 'latéral', 'lateral', 'fullback', 'arrière'],
  midfielder: ['mc', 'md', 'mg', 'milieu', 'mid', 'mdc', 'moc'],
  winger: ['ailier', 'ad', 'ag', 'winger', 'exterieur'],
  forward: ['at', 'attaquant', 'forward', 'av'],
  striker: ['bu', 'buteur', 'striker', '9'],
  other: [],
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function positionMatches(need: RosterPositionId, playerPos?: string): boolean {
  if (!playerPos) return false;
  const p = normalize(playerPos);
  const label = normalize(ROSTER_POSITION_LABELS[need]);
  if (p.includes(label) || label.includes(p)) return true;
  return POSITION_ALIASES[need].some((a) => p.includes(a) || a.includes(p));
}

function categoryCompatible(needCat: string, playerCat?: string): boolean {
  if (!playerCat) return false;
  const a = normalize(needCat);
  const b = normalize(playerCat);
  if (a === b) return true;
  // adjacent youth categories e.g. u14 ↔ u15
  const numA = parseInt(a.replace(/\D/g, ''), 10);
  const numB = parseInt(b.replace(/\D/g, ''), 10);
  if (Number.isFinite(numA) && Number.isFinite(numB)) {
    return Math.abs(numA - numB) <= 1;
  }
  return a.includes(b) || b.includes(a);
}

function footOk(
  need: ClubRosterNeed['preferred_foot'],
  playerFoot?: string,
): boolean {
  if (!need || need === 'any') return true;
  if (!playerFoot) return true;
  const f = normalize(playerFoot);
  if (need === 'both') return true;
  if (need === 'left') return f.includes('gauche') || f.includes('left') || f === 'g';
  if (need === 'right') return f.includes('droit') || f.includes('right') || f === 'd';
  return true;
}

export function matchPlayersToRosterNeed(
  need: ClubRosterNeed,
  players: User[],
  teamLabelById: Record<string, string>,
): RosterMatchCandidate[] {
  const results: RosterMatchCandidate[] = [];

  for (const player of players) {
    if (player.role !== 'player') continue;
    const clubId = player.profile.club_id;
    if (clubId && clubId !== need.club_id) continue;

    const teamId =
      typeof (player.profile as { team_id?: string }).team_id === 'string'
        ? (player.profile as { team_id?: string }).team_id
        : undefined;
    // Prefer players not already on the requesting team
    if (teamId && teamId === need.team_id) continue;

    const reasons: string[] = [];
    let score = 40;

    const pos = player.profile.position;
    if (positionMatches(need.position, pos)) {
      score += 28;
      reasons.push('Poste recherché');
    } else if (pos) {
      score += 6;
      reasons.push('Poste différent — à évaluer');
    }

    const cat = player.profile.category;
    if (categoryCompatible(need.category, cat)) {
      score += 18;
      reasons.push('Catégorie compatible');
    } else if (cat) {
      score += 4;
      reasons.push('Catégorie à vérifier');
    }

    if (need.level && player.profile.level) {
      if (normalize(player.profile.level).includes(normalize(need.level))) {
        score += 8;
        reasons.push('Niveau compatible');
      }
    }

    if (footOk(need.preferred_foot, player.profile.strong_foot)) {
      if (need.preferred_foot && need.preferred_foot !== 'any') {
        score += 6;
        reasons.push('Pied compatible');
      }
    } else {
      score -= 8;
      reasons.push('Pied non prioritaire');
    }

    score += 5;
    reasons.push('Licencié du club');

    score = Math.max(0, Math.min(99, Math.round(score)));
    if (score < 50) continue;

    const tier: RosterMatchCandidate['tier'] =
      score >= 85 ? 'strong' : score >= 70 ? 'good' : 'possible';

    results.push({
      player_uid: player.uid,
      display_name: player.display_name,
      team_id: teamId,
      team_label: teamId
        ? teamLabelById[teamId] ?? cat ?? 'Équipe du club'
        : cat ?? 'Équipe du club',
      category: cat,
      position: pos,
      preferred_foot: player.profile.strong_foot,
      score,
      reasons,
      tier,
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 12);
}
