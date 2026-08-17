import type { CoachPlayerEvaluation } from '../models/CoachEvaluation';
import type { WellnessSignals } from '../models/SmartTactics';
import type { TeamEvent } from '../models/TeamEvent';
import type { User } from '../models/User';
import {
  countAttendanceMark,
  countRsvpYes,
  getPendingInviteeUids,
  isCoachMatchEvent,
} from '../models/TeamEvent';
import type { CoachPitchLineup } from './coachPitchLineup';
import { startersPlacedCount } from './coachPitchLineup';
import { resolveCoachCalendarContext } from './coachTrainingRecommendation';
import { buildCoachAiSuggestions } from './coachAiSuggestions';
import { EVENT_TYPE_LABELS } from '../models/TeamEvent';
import {
  averageCoachRatings,
  formatCoachRating,
  formatCoachRatingsSummary,
  hasAnyCoachRating,
  normalizeCoachRatings,
} from './coachEvaluationRatings';

export type CoachAiDataLevel = 'none' | 'partial' | 'ready';

export type CoachAiActionId =
  | 'add-match-sheets'
  | 'plan-session'
  | 'remind-rsvp'
  | 'complete-lineup'
  | 'add-wellness'
  | 'add-player-notes'
  | 'open-tactics'
  | 'open-forme'
  | 'invite-roster'
  | 'join-club';

export interface CoachAiAction {
  id: CoachAiActionId | string;
  title: string;
  detail: string;
  priority: number;
}

export interface CoachAiTeamOverview {
  level: CoachAiDataLevel;
  headline: string;
  synthesis: string;
  metrics: { label: string; value: string }[];
  emptyCta?: { label: string; action: CoachAiActionId };
}

export interface CoachAiStrategyPlayer {
  uid: string;
  name: string;
  reason: string;
}

export interface CoachAiStrategy {
  level: CoachAiDataLevel;
  primaryContext?: 'training' | 'match';
  formation?: string;
  formationDetail?: string;
  playersToStart: CoachAiStrategyPlayer[];
  playersToWatch: CoachAiStrategyPlayer[];
  /** Brief pré-match — affiché quand le prochain RDV est un match. */
  matchBrief?: string;
  /** Focus séance — uniquement pertinent si prochain RDV = entraînement. */
  trainingFocus?: string;
  emptyHint?: string;
}

export interface CoachAiInsightsInput {
  events: TeamEvent[];
  members: User[];
  wellnessByUid?: Record<string, WellnessSignals>;
  evaluations?: CoachPlayerEvaluation[];
  lineup?: CoachPitchLineup | null;
  hasClub: boolean;
}

export interface CoachAiInsights {
  overview: CoachAiTeamOverview;
  strategy: CoachAiStrategy;
  actions: CoachAiAction[];
}

export interface CoachPlayerAiInsightsInput {
  playerUid: string;
  playerName: string;
  events: TeamEvent[];
  evaluations: CoachPlayerEvaluation[];
  wellness?: WellnessSignals;
  note?: string;
}

export interface CoachPlayerAiInsights {
  level: CoachAiDataLevel;
  bullets: string[];
  emptyHint: string;
}

function eventsWithSheets(events: TeamEvent[]): TeamEvent[] {
  return events.filter(
    (e) => e.player_match_stats && Object.keys(e.player_match_stats).length > 0,
  );
}

function aggregatePlayerRatings(events: TeamEvent[]): Map<string, { sum: number; n: number; goals: number }> {
  const map = new Map<string, { sum: number; n: number; goals: number }>();
  for (const ev of eventsWithSheets(events)) {
    for (const [uid, row] of Object.entries(ev.player_match_stats ?? {})) {
      const prev = map.get(uid) ?? { sum: 0, n: 0, goals: 0 };
      if (row.rating != null) {
        prev.sum += row.rating;
        prev.n += 1;
      }
      prev.goals += row.goals ?? 0;
      map.set(uid, prev);
    }
  }
  return map;
}

function memberName(members: User[], uid: string): string {
  return members.find((m) => m.uid === uid)?.display_name ?? 'Joueur';
}

function wellnessConcern(w?: WellnessSignals): boolean {
  if (!w) return false;
  if (w.injured || w.suspended) return true;
  if (typeof w.fatigue === 'number' && w.fatigue >= 7) return true;
  if (typeof w.recovery === 'number' && w.recovery <= 4) return true;
  if (typeof w.pain === 'number' && w.pain >= 5) return true;
  if (typeof w.wellness_score === 'number' && w.wellness_score <= 4) return true;
  return false;
}

/** Synthèse équipe — règles déterministes, jamais de chiffres inventés. */
export function buildCoachAiTeamOverview(input: CoachAiInsightsInput): CoachAiTeamOverview {
  const { events, members, hasClub, wellnessByUid = {}, evaluations = [] } = input;
  const now = Date.now();
  const played = eventsWithSheets(events);
  const upcoming = events.filter((e) => e.starts_at.getTime() > now);
  const next = [...upcoming].sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())[0];
  const wellnessAlerts = members.filter((m) => wellnessConcern(wellnessByUid[m.uid])).length;

  const metrics: { label: string; value: string }[] = [
    { label: 'Joueurs', value: String(members.length) },
    { label: 'Feuilles', value: String(played.length) },
    { label: 'À venir', value: String(upcoming.length) },
  ];
  if (wellnessAlerts > 0) {
    metrics.push({ label: 'Alertes forme', value: String(wellnessAlerts) });
  }
  const scoredEvals = evaluations.filter((e) => hasAnyCoachRating(e.ratings));
  if (scoredEvals.length > 0) {
    metrics.push({ label: 'Notes coach', value: String(scoredEvals.length) });
  }

  if (!hasClub) {
    return {
      level: 'none',
      headline: 'Club requis',
      synthesis: 'Rattache ton club pour que je puisse analyser l’effectif.',
      metrics,
      emptyCta: { label: 'Configurer le club', action: 'join-club' },
    };
  }

  if (members.length === 0) {
    return {
      level: 'none',
      headline: 'Effectif vide',
      synthesis: 'Invite tes joueurs — sans effectif, je ne peux pas croiser présences, forme et stats.',
      metrics,
      emptyCta: { label: 'Inviter des joueurs', action: 'invite-roster' },
    };
  }

  if (played.length === 0) {
    const parts: string[] = [];
    if (next) {
      const yes = countRsvpYes(next);
      const pending = getPendingInviteeUids(next).length;
      const typeLabel = isCoachMatchEvent(next)
        ? 'match'
        : next.event_type === 'training'
          ? 'entraînement'
          : EVENT_TYPE_LABELS[next.event_type].toLowerCase();
      parts.push(
        `Prochain ${typeLabel} : « ${next.title} » (${yes} confirmé${yes > 1 ? 's' : ''}${pending > 0 ? `, ${pending} sans réponse` : ''}).`,
      );
    } else {
      parts.push('Rien de planifié pour l’instant.');
    }
    if (wellnessAlerts > 0) {
      parts.push(`${wellnessAlerts} joueur(s) signalent une forme à surveiller.`);
    }
    return {
      level: 'partial',
      headline: 'Pas encore assez de matchs',
      synthesis: `${parts.join(' ')} Renseigne les feuilles de match après tes prochains matchs — l’analyse s’affûtera.`,
      metrics,
      emptyCta: { label: 'Voir le calendrier', action: 'plan-session' },
    };
  }

  let totalGoals = 0;
  let rated = 0;
  let ratingSum = 0;
  for (const ev of played) {
    for (const row of Object.values(ev.player_match_stats ?? {})) {
      totalGoals += row.goals ?? 0;
      if (row.rating != null) {
        rated += 1;
        ratingSum += row.rating;
      }
    }
  }
  const avgRating = rated > 0 ? (ratingSum / rated).toFixed(1) : null;

  const parts: string[] = [
    `${played.length} match${played.length > 1 ? 's' : ''} avec feuille`,
    `${totalGoals} but${totalGoals > 1 ? 's' : ''} marqué${totalGoals > 1 ? 's' : ''}`,
  ];
  if (avgRating) parts.push(`note moyenne ${avgRating}/10`);
  const coachAvg = averageCoachRatings(scoredEvals, 'overall');
  if (coachAvg != null) {
    parts.push(
      `évaluations coach ${formatCoachRating(coachAvg)} (${scoredEvals.length} joueur${scoredEvals.length > 1 ? 's' : ''})`,
    );
  }
  if (wellnessAlerts > 0) {
    parts.push(`${wellnessAlerts} alerte${wellnessAlerts > 1 ? 's' : ''} forme`);
  }
  if (next) {
    const yes = countRsvpYes(next);
    if (isCoachMatchEvent(next)) {
      parts.push(`prochain match « ${next.title} » : ${yes} présent${yes > 1 ? 's' : ''}`);
    } else if (next.event_type === 'training') {
      parts.push(`prochain entraînement « ${next.title} » : ${yes} présent${yes > 1 ? 's' : ''}`);
    }
  }

  return {
    level: 'ready',
    headline: 'Ton équipe en bref',
    synthesis: `${parts.join(', ')}.`,
    metrics,
  };
}

/** Stratégie recommandée — formation, titulaires, brief match ou focus entraînement. */
export function buildCoachAiStrategy(input: CoachAiInsightsInput): CoachAiStrategy {
  const { events, members, wellnessByUid = {}, lineup, evaluations = [] } = input;
  const ratings = aggregatePlayerRatings(events);
  const calendar = resolveCoachCalendarContext(events);
  const nextMatch = calendar.nextMatch;
  const nextTraining = calendar.nextTraining;
  const primaryContext = calendar.primary;

  const formation = lineup?.formation ?? nextMatch?.lineup?.formation ?? undefined;
  const placed = lineup ? startersPlacedCount(lineup) : 0;

  const topRated = [...ratings.entries()]
    .filter(([, v]) => v.n > 0)
    .map(([uid, v]) => ({
      uid,
      name: memberName(members, uid),
      avg: v.sum / v.n,
      goals: v.goals,
    }))
    .sort((a, b) => b.avg - a.avg || b.goals - a.goals)
    .slice(0, 5);

  const watchList = members
    .filter((m) => wellnessConcern(wellnessByUid[m.uid]))
    .slice(0, 4)
    .map((m) => ({
      uid: m.uid,
      name: m.display_name,
      reason: 'Forme ou récupération à surveiller (check-in joueur).',
    }));

  const playersToStart = topRated.slice(0, 4).map((p) => {
    const matchCount = ratings.get(p.uid)?.n ?? 0;
    return {
      uid: p.uid,
      name: p.name,
      reason:
        matchCount > 1
          ? `Note moy. ${p.avg.toFixed(1)}/10 sur ${matchCount} matchs`
          : `Note ${p.avg.toFixed(1)}/10 · ${p.goals} but${p.goals !== 1 ? 's' : ''}`,
    };
  });

  if (playersToStart.length < 4) {
    const evalByPlayer = new Map<string, CoachPlayerEvaluation>();
    for (const ev of evaluations) {
      if (!hasAnyCoachRating(ev.ratings)) continue;
      if (!evalByPlayer.has(ev.player_uid)) evalByPlayer.set(ev.player_uid, ev);
    }
    const fromCoachEvals = [...evalByPlayer.entries()]
      .filter(([uid]) => !playersToStart.some((p) => p.uid === uid))
      .map(([uid, ev]) => {
        const normalized = normalizeCoachRatings(ev.ratings);
        const score = normalized.overall ?? normalized.technical ?? normalized.tactical;
        return {
          uid,
          name: ev.player_name || memberName(members, uid),
          score: score ?? 0,
          summary: formatCoachRatingsSummary(normalized),
        };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4 - playersToStart.length);

    for (const row of fromCoachEvals) {
      playersToStart.push({
        uid: row.uid,
        name: row.name,
        reason: row.summary ?? `Éval coach ${formatCoachRating(row.score)}`,
      });
    }
  }

  if (placed >= 7 && lineup) {
    const starters = lineup.starterUids.filter(Boolean) as string[];
    for (const uid of starters) {
      if (!playersToStart.some((p) => p.uid === uid)) {
        playersToStart.push({
          uid,
          name: memberName(members, uid),
          reason: 'Titulaire dans ta compo enregistrée.',
        });
      }
    }
  }

  let trainingFocus: string | undefined;
  let matchBrief: string | undefined;

  if (primaryContext === 'training' && nextTraining) {
    const absent = countAttendanceMark(nextTraining, 'absent');
    const yes = countRsvpYes(nextTraining);
    trainingFocus =
      absent > 2
        ? 'Groupe réduit — technique individuelle et duels.'
        : yes >= 12
          ? 'Effectif large — jeu opposé et transitions.'
          : 'Séance mixte — activation, jeu réduit, finition.';
  }

  if (primaryContext === 'match' && nextMatch) {
    const opp = nextMatch.live_state?.opponent_name?.trim() || nextMatch.title;
    const yes = countRsvpYes(nextMatch);
    matchBrief = `Match « ${opp} » — ${yes} présent${yes > 1 ? 's' : ''}. Finalise la compo et le briefing avant le coup d’envoi.`;
  }

  const hasData = playersToStart.length > 0 || formation || trainingFocus || matchBrief;

  if (!hasData) {
    return {
      level: 'none',
      playersToStart: [],
      playersToWatch: watchList,
      emptyHint:
        'Renseigne des feuilles de match ou une compo — je pourrai te proposer des idées tactiques.',
    };
  }

  return {
    level: playersToStart.length > 0 ? 'ready' : 'partial',
    primaryContext,
    formation,
    formationDetail: formation
      ? placed >= 7
        ? `${placed} titulaires déjà placés sur le terrain.`
        : 'Complète la compo pour affiner la stratégie.'
      : undefined,
    playersToStart: playersToStart.slice(0, 5),
    playersToWatch: watchList,
    matchBrief,
    trainingFocus: primaryContext === 'training' ? trainingFocus : undefined,
  };
}

/** Actions prioritaires — 3 à 5 items concrets. */
export function buildCoachAiNowActions(input: CoachAiInsightsInput): CoachAiAction[] {
  const { events, members, hasClub, evaluations = [], lineup, wellnessByUid = {} } = input;
  const actions: CoachAiAction[] = [];
  const now = Date.now();
  const played = eventsWithSheets(events);
  const upcoming = events.filter((e) => e.starts_at.getTime() > now);
  const next = [...upcoming].sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())[0];

  if (!hasClub) {
    actions.push({
      id: 'join-club',
      title: 'Configurer le club',
      detail: 'Sans club, l’assistant ne peut pas analyser votre effectif.',
      priority: 100,
    });
    return actions;
  }

  if (members.length === 0) {
    actions.push({
      id: 'invite-roster',
      title: 'Constituer l’effectif',
      detail: 'Invitez vos joueurs pour débloquer convocations et analyses.',
      priority: 98,
    });
  }

  const pastMatches = events.filter(
    (e) => e.starts_at.getTime() < now && isCoachMatchEvent(e),
  );
  const missingSheets = pastMatches.filter(
    (e) => !e.player_match_stats || Object.keys(e.player_match_stats).length === 0,
  );
  if (missingSheets.length > 0) {
    actions.push({
      id: 'add-match-sheets',
      title: 'Compléter les feuilles de match',
      detail: `${missingSheets.length} match${missingSheets.length > 1 ? 's' : ''} sans stats — « ${missingSheets[0]?.title ?? ''} » en attente.`,
      priority: 92,
    });
  }

  if (next) {
    const pending = getPendingInviteeUids(next).length;
    if (pending > 0) {
      actions.push({
        id: 'remind-rsvp',
        title: 'Relancer les convocations',
        detail: `${pending} joueur(s) n’ont pas répondu à « ${next.title} ».`,
        priority: 95,
      });
    }
  }

  if (lineup && startersPlacedCount(lineup) < 7 && members.length >= 7) {
    actions.push({
      id: 'complete-lineup',
      title: 'Finaliser la composition',
      detail: 'Moins de 7 titulaires placés — complétez le XI type.',
      priority: 88,
    });
  }

  const wellnessMissing = members.filter((m) => !wellnessByUid[m.uid]).length;
  if (wellnessMissing > members.length * 0.6 && members.length > 3) {
    actions.push({
      id: 'add-wellness',
      title: 'Encourager les check-ins forme',
      detail: `${wellnessMissing} joueur(s) sans signalement récent.`,
      priority: 75,
    });
  }

  const notesCount = evaluations.filter((e) => e.notes?.trim() || hasAnyCoachRating(e.ratings)).length;
  if (notesCount === 0 && members.length > 0 && played.length > 0) {
    actions.push({
      id: 'add-player-notes',
      title: 'Ajouter des notes joueurs',
      detail: 'Vos observations enrichissent l’analyse individuelle.',
      priority: 70,
    });
  }

  const suggestions = buildCoachAiSuggestions({ events, membersCount: members.length });
  for (const s of suggestions) {
    if (actions.some((a) => a.id === s.id)) continue;
    actions.push({
      id: s.id,
      title: s.title,
      detail: s.detail,
      priority: s.priority,
    });
  }

  const seen = new Set<string>();
  return [...actions]
    .sort((a, b) => b.priority - a.priority)
    .filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    })
    .slice(0, 5);
}

export function buildCoachAiInsights(input: CoachAiInsightsInput): CoachAiInsights {
  return {
    overview: buildCoachAiTeamOverview(input),
    strategy: buildCoachAiStrategy(input),
    actions: buildCoachAiNowActions(input),
  };
}

/** Analyse joueur — données réelles + notes coach uniquement. */
export function buildCoachPlayerAiInsights(
  input: CoachPlayerAiInsightsInput,
): CoachPlayerAiInsights {
  const { playerUid, events, evaluations, wellness, note } = input;
  const bullets: string[] = [];
  const playerEvals = evaluations.filter((e) => e.player_uid === playerUid);
  const sheets = events
    .map((ev) => {
      const st = ev.player_match_stats?.[playerUid];
      return st ? { ev, st } : null;
    })
    .filter(Boolean) as { ev: TeamEvent; st: NonNullable<TeamEvent['player_match_stats']>[string] }[];

  if (sheets.length === 0 && playerEvals.length === 0 && !note?.trim() && !wellness) {
    return {
      level: 'none',
      bullets: [],
      emptyHint:
        'Pas encore de feuille de match, d’évaluation ni de note pour ce joueur. Ajoutez une observation ou attendez un match joué.',
    };
  }

  if (sheets.length > 0) {
    const ratings = sheets.map((s) => s.st.rating).filter((r): r is number => r != null);
    const goals = sheets.reduce((n, s) => n + (s.st.goals ?? 0), 0);
    const assists = sheets.reduce((n, s) => n + (s.st.assists ?? 0), 0);
    if (ratings.length >= 2) {
      const recent = ratings.slice(0, 3);
      const older = ratings.slice(3);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg =
        older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
      if (recentAvg > olderAvg + 0.4) {
        bullets.push(`Forme en hausse — note récente ${recentAvg.toFixed(1)}/10.`);
      } else if (recentAvg < olderAvg - 0.4) {
        bullets.push(`Forme en baisse — note récente ${recentAvg.toFixed(1)}/10.`);
      } else {
        bullets.push(`Niveau stable — moyenne ${recentAvg.toFixed(1)}/10 sur les derniers matchs.`);
      }
    } else if (ratings.length === 1) {
      bullets.push(`Dernière note : ${ratings[0]!.toFixed(1)}/10.`);
    }
    if (goals > 0) bullets.push(`${goals} but${goals > 1 ? 's' : ''} cette saison.`);
    if (assists > 0) bullets.push(`${assists} passe${assists > 1 ? 's' : ''} décisive${assists > 1 ? 's' : ''}.`);
  }

  const latestEval = playerEvals[0];
  if (latestEval) {
    const summary = formatCoachRatingsSummary(latestEval.ratings);
    if (summary) {
      bullets.push(`Dernière éval coach : ${summary}.`);
    }
  }

  if (wellness) {
    if (wellnessConcern(wellness)) {
      bullets.push('Check-in forme : vigilance recommandée avant la prochaine séance.');
    } else {
      bullets.push('Check-in forme récent : disponibilité OK.');
    }
  }

  if (note?.trim()) {
    bullets.push(`Note coach : « ${note.trim().slice(0, 120)}${note.trim().length > 120 ? '…' : ''} ».`);
  }

  return {
    level: bullets.length >= 2 ? 'ready' : bullets.length === 1 ? 'partial' : 'none',
    bullets: bullets.slice(0, 5),
    emptyHint:
      bullets.length === 0
        ? 'Données insuffisantes — ajoutez une note ou une feuille de match.'
        : '',
  };
}
