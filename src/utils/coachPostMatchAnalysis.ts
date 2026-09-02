import type { TeamEvent } from '../models/TeamEvent';
import type { User } from '../models/User';
import type { ClubMatchVideo } from '../models/ClubCameras';
import {
  buildEventVideoStatus,
  type CoachVideoLink,
} from './coachVideoInsights';

export type PostMatchDataLevel = 'none' | 'partial' | 'ready';

export interface PostMatchAnalysis {
  eventId: string;
  title: string;
  date: Date;
  scoreLabel: string | null;
  level: PostMatchDataLevel;
  positives: string[];
  improvements: string[];
  mvp: { uid: string; name: string; reason: string } | null;
  nextMatchRecommendation: string;
  /** Honnête : vidéos réelles ou message d’absence. */
  hasVideos: boolean;
  videos: CoachVideoLink[];
  videoNote: string;
}

function isMatchEvent(e: TeamEvent): boolean {
  return (
    e.event_type === 'friendly' ||
    e.event_type === 'competition' ||
    e.event_type === 'tournament'
  );
}

function memberName(members: User[], uid: string): string {
  return members.find((m) => m.uid === uid)?.display_name ?? 'Joueur';
}

function scoreLabel(event: TeamEvent): string | null {
  const ls = event.live_state;
  if (ls?.home_score != null && ls?.away_score != null) {
    const opp = ls.opponent_name ? ` vs ${ls.opponent_name}` : '';
    return `${ls.home_score} – ${ls.away_score}${opp}`;
  }
  return null;
}

function hasSheetData(event: TeamEvent): boolean {
  const stats = event.player_match_stats;
  return Boolean(stats && Object.keys(stats).length > 0);
}

function isAnalyzableMatch(event: TeamEvent): boolean {
  if (!isMatchEvent(event)) return false;
  const past = event.starts_at.getTime() < Date.now();
  if (!past) return false;
  if (event.match_report_finalized_at) return true;
  if (hasSheetData(event)) return true;
  if (event.live_state?.status === 'finished') return true;
  return false;
}

/** Analyse post-match honnête à partir des feuilles, live_state et rapport validé. */
export function buildPostMatchAnalysis(
  event: TeamEvent,
  members: User[],
  clubVideos: ClubMatchVideo[] = [],
): PostMatchAnalysis | null {
  if (!isAnalyzableMatch(event)) return null;

  const stats = event.player_match_stats ?? {};
  const statRows = Object.entries(stats);
  const hasStats = statRows.length > 0;
  const finalized = Boolean(event.match_report_finalized_at);
  const score = scoreLabel(event);

  const positives: string[] = [];
  const improvements: string[] = [];

  if (score) {
    const [home, away] = (event.live_state?.home_score ?? 0) >= (event.live_state?.away_score ?? 0)
      ? ['domination au tableau', 'avantage au score']
      : ['résistance malgré le score', 'esprit combatif'];
    if ((event.live_state?.home_score ?? 0) > (event.live_state?.away_score ?? 0)) {
      positives.push(`Victoire ${score} : ${home}.`);
    } else if ((event.live_state?.home_score ?? 0) < (event.live_state?.away_score ?? 0)) {
      improvements.push(`Défaite ${score} : analyser les phases clés.`);
    } else {
      positives.push(`Match nul ${score} : ${home}.`);
    }
  }

  if (hasStats) {
    const totalGoals = statRows.reduce((n, [, r]) => n + (r.goals ?? 0), 0);
    const rated = statRows.filter(([, r]) => r.rating != null);
    const avgRating =
      rated.length > 0
        ? rated.reduce((s, [, r]) => s + (r.rating ?? 0), 0) / rated.length
        : null;

    if (totalGoals >= 2) {
      positives.push(`${totalGoals} but${totalGoals > 1 ? 's' : ''} inscrit${totalGoals > 1 ? 's' : ''} par l’effectif.`);
    } else if (totalGoals === 0) {
      improvements.push('Finition à travailler : 0 but marqué sur la feuille.');
    }

    if (avgRating != null && avgRating >= 7) {
      positives.push(`Bonne performance collective (note moy. ${avgRating.toFixed(1)}/10).`);
    } else if (avgRating != null && avgRating < 6) {
      improvements.push(`Niveau collectif en baisse (note moy. ${avgRating.toFixed(1)}/10).`);
    }

    const cards = statRows.reduce(
      (n, [, r]) => n + (r.yellow_cards ?? 0) + (r.red_cards ?? 0),
      0,
    );
    if (cards >= 3) {
      improvements.push(`${cards} cartons : discipline à renforcer.`);
    } else if (cards === 0 && statRows.length >= 7) {
      positives.push('Discipline exemplaire (aucun carton).');
    }
  } else if (finalized) {
    improvements.push('Feuille joueur incomplète : ajoutez notes et stats pour affiner l’analyse.');
  }

  let mvp: PostMatchAnalysis['mvp'] = null;
  if (hasStats) {
    const best = statRows
      .map(([uid, r]) => ({
        uid,
        name: r.player_name || memberName(members, uid),
        rating: r.rating ?? 0,
        goals: r.goals ?? 0,
        assists: r.assists ?? 0,
      }))
      .sort((a, b) => b.rating - a.rating || b.goals - a.goals || b.assists - a.assists)[0];
    if (best && (best.rating > 0 || best.goals > 0 || best.assists > 0)) {
      const parts: string[] = [];
      if (best.rating > 0) parts.push(`note ${best.rating.toFixed(1)}/10`);
      if (best.goals > 0) parts.push(`${best.goals} but${best.goals > 1 ? 's' : ''}`);
      if (best.assists > 0) parts.push(`${best.assists} passe${best.assists > 1 ? 's' : ''}`);
      mvp = {
        uid: best.uid,
        name: best.name,
        reason: parts.length > 0 ? parts.join(' · ') : 'Meilleure feuille du match.',
      };
    }
  }

  let nextMatchRecommendation =
    'Préparez la prochaine convocation en fonction de cette feuille.';
  if (improvements.some((i) => /finition/i.test(i))) {
    nextMatchRecommendation = 'Prochaine séance : finition et jeu dans le dernier tiers.';
  } else if (improvements.some((i) => /discipline|carton/i.test(i))) {
    nextMatchRecommendation = 'Travail comportemental et gestion émotionnelle avant le prochain match.';
  } else if (positives.length >= 2) {
    nextMatchRecommendation = 'Capitalisez sur cette dynamique : conservez le XI type et le pressing.';
  }

  const videoStatus = buildEventVideoStatus(event.id, event.title, clubVideos);

  const level: PostMatchDataLevel =
    finalized && hasStats ? 'ready' : hasStats || score ? 'partial' : 'none';

  if (positives.length === 0 && improvements.length === 0) {
    if (score) {
      positives.push(`Match terminé ${score}.`);
    } else {
      improvements.push('Données limitées : complétez la feuille de match.');
    }
  }

  return {
    eventId: event.id,
    title: event.title,
    date: event.starts_at,
    scoreLabel: score,
    level,
    positives: positives.slice(0, 4),
    improvements: improvements.slice(0, 4),
    mvp,
    nextMatchRecommendation,
    hasVideos: videoStatus.hasVideos,
    videos: videoStatus.videos,
    videoNote: videoStatus.note,
  };
}

/** Derniers matchs finalisés ou avec feuille, triés du plus récent au plus ancien. */
export function listRecentPostMatchAnalyses(
  events: TeamEvent[],
  members: User[],
  limit = 5,
  clubVideos: ClubMatchVideo[] = [],
): PostMatchAnalysis[] {
  const now = Date.now();
  return [...events]
    .filter((e) => isMatchEvent(e) && e.starts_at.getTime() < now)
    .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime())
    .map((e) => buildPostMatchAnalysis(e, members, clubVideos))
    .filter((a): a is PostMatchAnalysis => a != null)
    .slice(0, limit);
}

export function findLatestPostMatchAnalysis(
  events: TeamEvent[],
  members: User[],
  clubVideos: ClubMatchVideo[] = [],
): PostMatchAnalysis | null {
  return listRecentPostMatchAnalyses(events, members, 1, clubVideos)[0] ?? null;
}
