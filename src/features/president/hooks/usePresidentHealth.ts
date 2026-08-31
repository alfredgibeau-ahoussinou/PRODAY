import { useMemo } from 'react';
import type { ClubWorkspace } from '../../club/hooks/useClubWorkspace';
import type { PresidentHealthAxisId } from '../navigation/presidentNavConfig';

export type PresidentHealthAxis = {
  id: PresidentHealthAxisId;
  label: string;
  score: number;
  tone: 'ok' | 'warn' | 'alert';
  summary: string;
};

export type PresidentHealth = {
  overall: number;
  axes: PresidentHealthAxis[];
  insights: string[];
};

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function toneFromScore(score: number): 'ok' | 'warn' | 'alert' {
  if (score >= 75) return 'ok';
  if (score >= 50) return 'warn';
  return 'alert';
}

/**
 * Heuristiques santé du club à partir du workspace réel (pas de LLM).
 */
export function buildPresidentHealth(ws: ClubWorkspace): PresidentHealth {
  const teams = ws.teams.length;
  const players = ws.players.length;
  const coaches = ws.coaches.length;
  const pending = ws.pendingMemberships;
  const noCoach = ws.teamsWithoutCoach;
  const matchesToday = ws.todayMatches.length;
  const trainingsToday = ws.todayTrainings.length;
  const events = ws.events.length;

  const sportScore = clampScore(
    55 +
      Math.min(25, teams * 4) +
      Math.min(15, matchesToday * 8 + trainingsToday * 4) +
      (events > 0 ? 5 : 0) -
      noCoach * 8,
  );

  const financeScore = clampScore(62 + (players > 0 ? 8 : 0));
  const adminScore = clampScore(80 - pending * 12 + (ws.club?.verified ? 10 : 0));
  const humanScore = clampScore(
    50 + Math.min(30, coaches * 8) + Math.min(20, players > 0 ? 12 : 0) - noCoach * 10,
  );
  const growthScore = clampScore(58 + Math.min(20, players > 20 ? 12 : players > 5 ? 6 : 0));

  const axes: PresidentHealthAxis[] = [
    {
      id: 'sport',
      label: 'Sportif',
      score: sportScore,
      tone: toneFromScore(sportScore),
      summary:
        teams === 0
          ? 'Aucune équipe structurée.'
          : `${teams} équipe${teams > 1 ? 's' : ''} · ${matchesToday + trainingsToday} séance${matchesToday + trainingsToday > 1 ? 's' : ''} aujourd’hui.`,
    },
    {
      id: 'finance',
      label: 'Financier',
      score: financeScore,
      tone: toneFromScore(financeScore),
      summary: 'Cotisations et dépenses — ouvrez Finances pour le détail.',
    },
    {
      id: 'admin',
      label: 'Administratif',
      score: adminScore,
      tone: toneFromScore(adminScore),
      summary:
        pending > 0
          ? `${pending} adhésion${pending > 1 ? 's' : ''} en attente.`
          : 'Adhésions à jour.',
    },
    {
      id: 'human',
      label: 'Humain',
      score: humanScore,
      tone: toneFromScore(humanScore),
      summary:
        noCoach > 0
          ? `${noCoach} équipe${noCoach > 1 ? 's' : ''} sans coach.`
          : `${coaches} coach${coaches > 1 ? 's' : ''} · ${players} licencié${players > 1 ? 's' : ''}.`,
    },
    {
      id: 'growth',
      label: 'Développement',
      score: growthScore,
      tone: toneFromScore(growthScore),
      summary: 'Sponsoring & objectifs : ouvrir la section Partenaires.',
    },
  ];

  const overall = clampScore(
    axes.reduce((sum, a) => sum + a.score, 0) / Math.max(1, axes.length),
  );

  const insights: string[] = [];
  if (pending > 0) {
    insights.push(
      `${pending} adhésion${pending > 1 ? 's' : ''} en attente — validez depuis Adhérents.`,
    );
  }
  if (noCoach > 0) {
    insights.push(
      `${noCoach} équipe${noCoach > 1 ? 's' : ''} sans coach — affectez le staff.`,
    );
  }
  if (matchesToday > 0) {
    insights.push(
      `${matchesToday} match${matchesToday > 1 ? 's' : ''} aujourd’hui — suivez le sportif.`,
    );
  }
  if (insights.length === 0) {
    insights.push(
      ws.briefingSummary ||
        'Structure stable. Surveillez partenaires et objectifs de saison.',
    );
  }

  return { overall, axes, insights };
}

export function usePresidentHealth(ws: ClubWorkspace): PresidentHealth {
  return useMemo(() => buildPresidentHealth(ws), [
    ws.teams.length,
    ws.players.length,
    ws.coaches.length,
    ws.pendingMemberships,
    ws.teamsWithoutCoach,
    ws.todayMatches.length,
    ws.todayTrainings.length,
    ws.events.length,
    ws.club?.verified,
    ws.briefingSummary,
  ]);
}
