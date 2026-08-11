/**
 * Tournoi club généré (poules / terrains / live) — distinct de l’Arena publique.
 */

import type {
  ClubTournamentFormat,
  GeneratedTournamentFixture,
  GeneratedTournamentPlan,
} from '../utils/clubTournamentGenerator';

export type ClubTournamentFixtureStatus =
  | 'scheduled'
  | 'live'
  | 'done'
  | 'forfeit'
  | 'delayed';

export interface ClubTournamentLiveFixture extends GeneratedTournamentFixture {
  home_score: number | null;
  away_score: number | null;
  status: ClubTournamentFixtureStatus;
  delay_min?: number;
}

export interface ClubTournamentEvent {
  id: string;
  club_id: string;
  created_by: string;
  name: string;
  category: string;
  format: ClubTournamentFormat;
  /** Visible sur page publique / QR. */
  public: boolean;
  status: 'draft' | 'live' | 'finished';
  pools: GeneratedTournamentPlan['pools'];
  teams: GeneratedTournamentPlan['teams'];
  fixtures: ClubTournamentLiveFixture[];
  partners?: { name: string; role?: string }[];
  created_at: Date;
  updated_at: Date;
}

export function planToLiveFixtures(
  plan: GeneratedTournamentPlan,
): ClubTournamentLiveFixture[] {
  return plan.fixtures.map((f) => ({
    ...f,
    home_score: null,
    away_score: null,
    status: 'scheduled' as const,
  }));
}

export function computePoolTable(fixtures: ClubTournamentLiveFixture[], poolId: string) {
  const rows = new Map<
    string,
    { teamId: string; name: string; played: number; pts: number; gf: number; ga: number }
  >();
  const ensure = (id: string, name: string) => {
    if (!rows.has(id)) rows.set(id, { teamId: id, name, played: 0, pts: 0, gf: 0, ga: 0 });
    return rows.get(id)!;
  };
  for (const f of fixtures) {
    if (f.poolId !== poolId || f.status !== 'done') continue;
    if (f.home_score == null || f.away_score == null) continue;
    const h = ensure(f.homeTeamId, f.homeName);
    const a = ensure(f.awayTeamId, f.awayName);
    h.played += 1;
    a.played += 1;
    h.gf += f.home_score;
    h.ga += f.away_score;
    a.gf += f.away_score;
    a.ga += f.home_score;
    if (f.home_score > f.away_score) h.pts += 3;
    else if (f.home_score < f.away_score) a.pts += 3;
    else {
      h.pts += 1;
      a.pts += 1;
    }
  }
  return [...rows.values()].sort(
    (x, y) => y.pts - x.pts || y.gf - y.ga - (x.gf - x.ga) || y.gf - x.gf,
  );
}

export function publicTournamentUrl(tournamentId: string): string {
  const base = (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://proday75.fr').replace(/\/$/, '');
  return `${base}/tournoi/${tournamentId}`;
}
