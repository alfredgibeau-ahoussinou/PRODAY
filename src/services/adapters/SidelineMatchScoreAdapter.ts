/**
 * PRODAY — Adaptateur Saisie Terrain Staff Club (Sideline Match Entry).
 *
 * Gère la saisie manuelle certifiée des événements et scores de match
 * par les coachs, délégués et arbitres de club :
 * - Horodatage réel des événements saisis sans horloge inventée
 * - Traçabilité absolue de l'opérateur (verifiedByUid)
 * - Source étiquetée honnêtement : 'club_official_entry'
 * - Aucun chronomètre satellite simulé pour les matchs amateurs
 */

import type { NormalizedLiveScore } from './fffAdapterTypes';

export interface SidelineEventInput {
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'penalty_saved';
  team: 'home' | 'away';
  playerName?: string;
  minute?: number;
  detail?: string;
}

export class SidelineMatchScoreAdapter {
  /**
   * Crée un score initial pour un match en cours ou à venir.
   */
  public static initMatchScore(params: {
    fixtureId: string;
    homeTeamName: string;
    awayTeamName: string;
    operatorUid?: string;
  }): NormalizedLiveScore {
    return {
      fixtureId: params.fixtureId,
      status: 'scheduled',
      hasLiveTelemetry: false, // Pas de télémétrie satellitaire sur match amateur
      homeScore: 0,
      awayScore: 0,
      homeTeamName: params.homeTeamName,
      awayTeamName: params.awayTeamName,
      events: [],
      sourceType: 'club_official_entry',
      verifiedByUid: params.operatorUid,
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  /**
   * Ajoute un événement terrain (but, carton, remplacement) et met à jour le score de manière atomique.
   */
  public static recordSidelineEvent(
    current: NormalizedLiveScore,
    event: SidelineEventInput,
    operatorUid: string,
  ): NormalizedLiveScore {
    const nowIso = new Date().toISOString();
    const newEventId = `ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    let newHomeScore = current.homeScore;
    let newAwayScore = current.awayScore;

    if (event.type === 'goal') {
      if (event.team === 'home') newHomeScore += 1;
      else if (event.team === 'away') newAwayScore += 1;
    }

    const updatedEvents = [
      ...current.events,
      {
        id: newEventId,
        minute: event.minute,
        type: event.type,
        team: event.team,
        playerName: event.playerName,
        detail: event.detail,
        timestamp: nowIso,
      },
    ];

    return {
      ...current,
      status: current.status === 'scheduled' ? 'live' : current.status,
      homeScore: newHomeScore,
      awayScore: newAwayScore,
      events: updatedEvents,
      verifiedByUid: operatorUid,
      lastUpdatedAt: nowIso,
    };
  }

  /**
   * Met à jour manuellement le score sans ajouter d'événement détaillé.
   */
  public static updateManualScore(
    current: NormalizedLiveScore,
    homeScore: number,
    awayScore: number,
    status: NormalizedLiveScore['status'],
    operatorUid: string,
  ): NormalizedLiveScore {
    return {
      ...current,
      status,
      homeScore: Math.max(0, homeScore),
      awayScore: Math.max(0, awayScore),
      verifiedByUid: operatorUid,
      lastUpdatedAt: new Date().toISOString(),
    };
  }
}
