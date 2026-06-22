import type { User } from '../models/User';
import type { RecruitmentPost } from '../models/Player';
import { getProfileCompletion } from './profileCompletion';

export interface RecruiterPlayerMatch {
  player: User;
  score: number;
  reasons: string[];
}

function normalize(value?: string | null): string {
  return value?.trim().toLowerCase() ?? '';
}

function positionMatches(playerPosition: string, postPosition: string): boolean {
  const p = normalize(playerPosition);
  const t = normalize(postPosition);
  if (!p || !t) return false;
  return p === t || p.includes(t) || t.includes(p);
}

/** Score un joueur du répertoire Firestore contre une annonce Mercato. */
export function scorePlayerForRecruitmentPost(
  player: User,
  post: RecruitmentPost
): RecruiterPlayerMatch {
  let score = 0;
  const reasons: string[] = [];
  const profile = player.profile;

  if (positionMatches(profile.position ?? '', post.position)) {
    score += 35;
    reasons.push(`Poste ${profile.position}`);
  }

  if (normalize(profile.category) && normalize(profile.category) === normalize(post.category)) {
    score += 20;
    reasons.push(`Catégorie ${profile.category}`);
  }

  if (normalize(profile.level) && normalize(profile.level) === normalize(post.level)) {
    score += 20;
    reasons.push(`Niveau ${profile.level}`);
  }

  if (normalize(player.city) && normalize(player.city) === normalize(post.city)) {
    score += 15;
    reasons.push(`Ville ${player.city}`);
  } else if (normalize(player.city) && normalize(post.city) && player.city!.toLowerCase().includes(post.city.toLowerCase())) {
    score += 8;
    reasons.push(`Proche de ${post.city}`);
  }

  const stats = profile.season_stats;
  if (stats && stats.matches > 0) {
    const statBoost = Math.min(10, stats.goals + stats.assists);
    score += statBoost;
    reasons.push(`${stats.matches} matchs cette saison`);
  }

  const completion = getProfileCompletion(player).percent;
  if (completion >= 70) {
    score += 8;
    reasons.push(`Profil ${completion}%`);
  }

  if ((profile.highlight_video_urls?.filter(Boolean).length ?? 0) > 0) {
    score += 5;
    reasons.push('Vidéo highlight');
  }

  if (player.is_verified) {
    score += 5;
    reasons.push('Profil vérifié');
  }

  return {
    player,
    score: Math.min(100, Math.max(0, Math.round(score))),
    reasons: reasons.slice(0, 4),
  };
}

export function rankPlayersForRecruitmentPost(
  players: User[],
  post: RecruitmentPost,
  excludeUids: string[] = [],
  max = 8
): RecruiterPlayerMatch[] {
  const excluded = new Set(excludeUids);
  return players
    .filter((p) => p.role === 'player' && !excluded.has(p.uid))
    .map((player) => scorePlayerForRecruitmentPost(player, post))
    .filter((m) => m.score >= 25)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);
}
