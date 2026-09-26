import type { LiveMatchAction, MatchLiveState, MatchLiveStatus, TeamEvent } from '../models/TeamEvent';

export const MATCH_LIVE_STATUS_LABELS: Record<MatchLiveStatus, string> = {
  scheduled: 'À venir',
  live: 'En direct',
  halftime: 'Mi-temps',
  finished: 'Terminé',
  cancelled: 'Annulé',
};

export function countGoalsFromActions(actions: LiveMatchAction[] | undefined): number {
  return (actions ?? []).filter((a) => a.type === 'goal').length;
}

export function resolveLiveState(event: TeamEvent): MatchLiveState {
  const stored = event.live_state;
  const actionGoals = countGoalsFromActions(event.live_actions);
  const homeLabel = stored?.home_label ?? event.club_name ?? event.organizer_name ?? 'Domicile';
  const opponent = stored?.opponent_name ?? 'Adversaire';

  if (stored) {
    return {
      ...stored,
      home_label: homeLabel,
      opponent_name: opponent,
      home_score: Math.max(stored.home_score, actionGoals > stored.home_score ? actionGoals : stored.home_score),
      minute: stored.minute ?? (stored.has_live_telemetry ? estimateLiveMinute(event) : undefined),
      has_live_telemetry: stored.has_live_telemetry ?? false,
      source_type: stored.source_type ?? (stored.verified_by_uid ? 'club_official_entry' : 'unconfirmed'),
    };
  }

  const inferredStatus = inferMatchStatus(event);
  return {
    status: inferredStatus,
    minute: undefined, // Jamais de chronomètre simulé en l'absence de flux télémétrique
    home_score: actionGoals,
    away_score: 0,
    home_label: homeLabel,
    opponent_name: opponent,
    has_live_telemetry: false,
    source_type: 'unconfirmed',
  };
}

export function inferMatchStatus(event: TeamEvent): MatchLiveStatus {
  if (event.live_state?.status) return event.live_state.status;
  if (event.match_report_finalized_at) return 'finished';

  const now = Date.now();
  const start = event.starts_at.getTime();
  const end = event.ends_at?.getTime() ?? start + 2 * 60 * 60 * 1000;

  if (now < start - 30 * 60 * 1000) return 'scheduled';
  if (now > end + 30 * 60 * 1000) return 'finished';
  if (now >= start && now <= end) return 'live';
  if (now > end) return 'finished';
  return 'scheduled';
}

/**
 * Retourne la minute de jeu officielle UNIQUEMENT si le match bénéficie d'une vraie télémétrie.
 * Ne simule jamais une progression arbitraire pour les matchs amateurs sans capteurs.
 */
export function estimateLiveMinute(event: TeamEvent): number | undefined {
  if (event.live_state?.minute != null) return event.live_state.minute;
  if (event.live_state?.has_live_telemetry) {
    const elapsed = Math.floor((Date.now() - event.starts_at.getTime()) / 60000);
    return Math.max(0, Math.min(120, elapsed));
  }
  return undefined;
}

export function formatMatchScoreSourceLabel(state: MatchLiveState): string {
  if (state.source_type === 'national_api_sports' || state.has_live_telemetry) {
    return '● DIRECT OFFICIEL FFF (API)';
  }
  if (state.source_type === 'club_official_entry' || state.verified_by_uid) {
    return '● SAISIE BANC DE TOUCHE CLUB';
  }
  if (state.status === 'finished') {
    return '● RÉSULTAT FINAL HOMOLOGUÉ';
  }
  return '● SCORE NON CONFIRMÉ';
}

export function isInMatchWindow(event: TeamEvent): boolean {
  const status = resolveLiveState(event).status;
  return status === 'live' || status === 'halftime';
}

export function isMatchHubEligible(event: TeamEvent): boolean {
  return (
    event.event_type === 'friendly' ||
    event.event_type === 'training' ||
    event.event_type === 'tournament' ||
    event.event_type === 'detection'
  );
}

export function formatScoreLine(state: MatchLiveState): string {
  return `${state.home_score} à ${state.away_score}`;
}

export function getMyMatchStat(
  event: TeamEvent,
  uid: string
): import('../models/TeamEvent').PlayerMatchSheetStat | undefined {
  return event.player_match_stats?.[uid];
}
