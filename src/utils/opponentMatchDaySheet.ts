import type { TeamEvent } from '../models/TeamEvent';
import type { OpponentAnalysis } from '../models/SmartTactics';
import { resolveLiveState } from './matchLive';
import {
  buildOpponentAnalysis,
  previousResultsFromEvents,
} from './smartTacticsEngine';

export type OpponentMatchDaySheetModel = {
  opponentName: string;
  homeLabel: string;
  metaLine: string;
  analysis: OpponentAnalysis;
  h2h: { goals_for: number; goals_against: number }[];
  h2hLabel: string;
  confidenceLabel: string;
  coachNotes?: string;
};

/** Construit la fiche adversaire jour J à partir de l’événement + historique club. */
export function buildOpponentMatchDaySheet(input: {
  event: TeamEvent;
  clubEvents?: TeamEvent[];
  coachNotes?: string;
}): OpponentMatchDaySheetModel {
  const live = resolveLiveState(input.event);
  const opponentName =
    live.opponent_name?.trim() ||
    input.event.title.replace(/^.*\bvs\b/i, '').trim() ||
    'Adversaire';

  const history = input.clubEvents?.length ? input.clubEvents : [input.event];
  const h2h = previousResultsFromEvents(history, opponentName);
  const analysis = buildOpponentAnalysis({
    opponent_name: opponentName,
    previous_results: h2h,
    notes: input.coachNotes,
  });

  const metaBits = [
    input.event.location_label,
    input.event.city,
    input.event.club_name,
  ].filter(Boolean);

  const wins = h2h.filter((r) => r.goals_for > r.goals_against).length;
  const draws = h2h.filter((r) => r.goals_for === r.goals_against).length;
  const losses = h2h.filter((r) => r.goals_for < r.goals_against).length;

  const confidenceLabel =
    analysis.data_confidence === 'high'
      ? 'Confiance haute (historique solide)'
      : analysis.data_confidence === 'medium'
        ? 'Confiance moyenne'
        : 'Peu d’historique — à confirmer en live';

  return {
    opponentName,
    homeLabel: live.home_label,
    metaLine: metaBits.join(' · '),
    analysis,
    h2h,
    h2hLabel:
      h2h.length === 0
        ? 'Aucun score passé contre cet adversaire'
        : `H2H récent · ${wins}V ${draws}N ${losses}D (${h2h.length} matchs)`,
    confidenceLabel,
    coachNotes: input.coachNotes?.trim() || undefined,
  };
}
