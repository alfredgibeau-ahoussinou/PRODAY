import { useEffect, useMemo, useState } from 'react';
import { fffScraperService, type MyFffTeamLink } from '../../../services/fffScraper.service';
import { useClubWorkspace } from './useClubWorkspace';
import {
  activeFffSeason,
  resolveActiveClubLeague,
  type ClubLeagueResolutionSource,
} from './clubLeagueResolution';

export type ClubLeagueSource = ClubLeagueResolutionSource;

export interface ClubLeagueInfo {
  /** Identifiant de ligue FFF à afficher en priorité. Null si aucun rattachement exact. */
  leagueId: string | null;
  /** Identifiant d'équipe FFF / ProDay quand il est connu. */
  teamId: string | null;
  /** Nom de l'équipe ou du club à mettre en évidence dans le tableau. */
  clubTeamName: string | null;
  /** Trace d'où provient la ligue détectée. */
  source: ClubLeagueSource;
  districtCode?: string;
  divisionLabel?: string;
  groupLabel?: string;
  season: string;
  /** Vrai tant que le workspace ou le lien local n'est pas prêt. */
  loading: boolean;
}

/** Détecte la compétition FFF explicitement rattachée au club/à son équipe active. */
export function useClubLeagueId(): ClubLeagueInfo {
  const ws = useClubWorkspace();
  const season = activeFffSeason();
  const [myFffTeam, setMyFffTeam] = useState<MyFffTeamLink | null | undefined>(undefined);


  useEffect(() => {
    let active = true;
    fffScraperService
      .getMyFffTeam()
      .then((linked) => {
        if (active) setMyFffTeam(linked ?? null);
      })
      .catch(() => {
        if (active) setMyFffTeam(null);
      });
    return () => {
      active = false;
    };
  }, []);

  return useMemo<ClubLeagueInfo>(() => {
    if (ws.loading || myFffTeam === undefined) {
      return {
        leagueId: null,
        teamId: null,
        clubTeamName: null,
        source: null,
        season,
        loading: true,
      };
    }

    const resolved = resolveActiveClubLeague({
      club: ws.club,
      teams: ws.teams,
      linked: myFffTeam,
      season,
    });

    return {
      leagueId: resolved.leagueId,
      teamId: resolved.teamId,
      clubTeamName: resolved.teamName ?? null,
      source: resolved.source,
      districtCode: resolved.districtCode,
      divisionLabel: resolved.divisionLabel,
      groupLabel: resolved.groupLabel,
      season: resolved.season,
      loading: false,
    };
  }, [myFffTeam, season, ws.club, ws.loading, ws.teams]);
}
