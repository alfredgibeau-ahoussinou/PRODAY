import type { User } from '../../../models/User';
import { getProfileCompletion } from '../../../utils/profileCompletion';

export interface PlayerScoutingScore {
  playerUid: string;
  score: number;
  label: string;
}

function normalize(value?: string | null): string {
  return value?.trim().toLowerCase() ?? '';
}

/** Score scouting staff pour un joueur (spec Mercato §6). */
export function scorePlayerForScouting(viewer: User, player: User): PlayerScoutingScore {
  const profile = player.profile;
  let score = 48;

  if (profile.position) score += 10;
  if (profile.level) score += 8;
  if (profile.category) score += 4;

  if (normalize(viewer.city) && normalize(viewer.city) === normalize(player.city)) {
    score += 14;
  }

  if (profile.level && viewer.profile.level && profile.level === viewer.profile.level) {
    score += 10;
  }

  const stats = profile.season_stats;
  if (stats && stats.matches > 0) {
    score += Math.min(12, stats.goals * 2 + stats.assists);
  }

  score += getProfileCompletion(player).percent * 0.12;

  if (player.avatar_url) score += 4;
  if ((profile.highlight_video_urls?.length ?? 0) > 0) score += 6;

  const rounded = Math.round(Math.min(98, Math.max(20, score)));
  const label =
    rounded >= 78 ? 'Profil prometteur' : rounded >= 58 ? 'À explorer' : 'Profil à compléter';

  return { playerUid: player.uid, score: rounded, label };
}

export function scoutingScoreMap(viewer: User, players: User[]): Map<string, PlayerScoutingScore> {
  return new Map(players.map((player) => [player.uid, scorePlayerForScouting(viewer, player)]));
}

export function sortPlayersByScouting(viewer: User, players: User[]): User[] {
  const scores = scoutingScoreMap(viewer, players);
  return [...players].sort(
    (a, b) => (scores.get(b.uid)?.score ?? 0) - (scores.get(a.uid)?.score ?? 0)
  );
}
