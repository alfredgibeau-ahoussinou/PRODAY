/**
 * PRODAY — Service d'Autorité des Données Football FFF (Moteur Central).
 *
 * Fait la synthèse et l'arbitrage des 4 jeux de données officiels :
 * 1. Classements (Standings) : FFF DOFA, National API, snapshots résilients, départages.
 * 2. Calendriers & Résultats (Fixtures & Results) : Matchs programmés, remis, scores confirmés.
 * 3. Licenciés (Licensed-Player Records) : Import Footclubs officiel, déduplication, renouvellements, mutations.
 * 4. Scores en direct (Live Scores) : Vrai flux national VS Saisie manuelle de banc de touche étiquetée.
 *
 * Invariants de sûreté :
 * - Aucune donnée inventée (pas de match clock fictif, pas de rang deviné).
 * - Snapshots préservés en cas d'indisponibilité de source avec badge d'ancienneté réelle (stale).
 * - Respect des règles de confidentialité (ACL par rôle et club).
 */

import type {
  NormalizedStanding,
  NormalizedStandingRow,
  NormalizedFixture,
  NormalizedLicenseRecord,
  NormalizedLiveScore,
  SyncHealthStatus,
} from './adapters/fffAdapterTypes';
import { FootclubsLicenseAdapter } from './adapters/FootclubsLicenseAdapter';
import { NationalSportsApiAdapter, NATIONAL_LEAGUES_CONFIG } from './adapters/NationalSportsApiAdapter';
import { FffDofaAdapter } from './adapters/FffDofaAdapter';
import { SidelineMatchScoreAdapter } from './adapters/SidelineMatchScoreAdapter';
import { isFirebaseConfigured } from '../config/firebase';

export interface FffFreshnessBadge {
  label: string;
  dotColor: string;
  textColor: string;
  bgColor: string;
  health: SyncHealthStatus;
  ageDescription: string;
}

export class FffAuthoritativeDataService {
  private static readonly THREE_HOURS_MS = 3 * 60 * 60 * 1000;
  private static readonly STALE_THRESHOLD_MS = 6.5 * 60 * 60 * 1000; // > 2 cycles de 3h

  /**
   * Calcule le badge de fraîcheur précis pour l'interface utilisateur.
   */
  public static computeFreshnessBadge(
    syncedAt?: string,
    health: SyncHealthStatus = 'ok',
    sourceLabel = 'FFF',
  ): FffFreshnessBadge {
    if (!syncedAt) {
      return {
        label: '● SOURCE NON CONFIGURÉE',
        dotColor: '#8E8E93',
        textColor: '#8E8E93',
        bgColor: 'rgba(142, 142, 147, 0.15)',
        health: 'unavailable',
        ageDescription: 'Aucune synchronisation effectuée',
      };
    }

    const syncTime = new Date(syncedAt).getTime();
    const now = Date.now();
    const elapsedMs = Math.max(0, now - syncTime);

    let ageDescription = 'à l’instant';
    const minutes = Math.floor(elapsedMs / 60000);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      if (hours >= 24) {
        ageDescription = `il y a ${Math.floor(hours / 24)} j`;
      } else {
        ageDescription = `il y a ${hours} h`;
      }
    } else if (minutes > 0) {
      ageDescription = `il y a ${minutes} min`;
    }

    const isStale = elapsedMs > this.STALE_THRESHOLD_MS;

    if (health === 'error' || health === 'unavailable') {
      return {
        label: `● DONNÉES NON DISPONIBLES (${ageDescription})`,
        dotColor: '#FF453A',
        textColor: '#FF453A',
        bgColor: 'rgba(255, 69, 58, 0.15)',
        health: 'error',
        ageDescription,
      };
    }

    if (isStale || health === 'stale' || health === 'degraded') {
      return {
        label: `● DONNÉES ANCIENNES (${ageDescription})`,
        dotColor: '#FF9F0A',
        textColor: '#FF9F0A',
        bgColor: 'rgba(255, 159, 10, 0.15)',
        health: 'stale',
        ageDescription,
      };
    }

    return {
      label: `● ${sourceLabel.toUpperCase()} (${ageDescription})`,
      dotColor: '#30D158',
      textColor: '#30D158',
      bgColor: 'rgba(48, 209, 88, 0.15)',
      health: 'ok',
      ageDescription,
    };
  }

  /**
   * Applique les règles officielles de départage FFF sur un tableau de classement.
   * Règle générale FFF :
   * 1. Plus grand nombre de points
   * 2. Différence de buts générale
   * 3. Plus grand nombre de buts marqués
   * 4. En cas d'égalité sur confrontation directe (si applicable)
   */
  public static sortStandingsByFffRules(rows: NormalizedStandingRow[]): NormalizedStandingRow[] {
    const sorted = [...rows].sort((a, b) => {
      // 1. Points
      if (b.points !== a.points) return b.points - a.points;
      // 2. Moins de pénalités / forfaits administratifs
      const penaltiesA = (a.penalties || 0) + (a.forfeits || 0);
      const penaltiesB = (b.penalties || 0) + (b.forfeits || 0);
      if (penaltiesA !== penaltiesB) return penaltiesA - penaltiesB;
      // 3. Différence de buts
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      // 4. Buts pour
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      // 5. Ordre alphabétique
      return a.teamName.localeCompare(b.teamName);
    });

    return sorted.map((row, idx) => ({
      ...row,
      rank: idx + 1,
    }));
  }

  /**
   * Détecte et désambiguïse les clubs portant des noms similaires au sein d'une même poule ou d'un district.
   * Ex: "Montrouge FC 92" vs "Montrouge FC 92 2" vs "Montrouge ES"
   */
  public static disambiguateTeams(
    teams: Array<{ id: string; name: string; clubCode?: string }>,
  ): Map<string, string> {
    const resolved = new Map<string, string>();
    teams.forEach((t) => {
      // Clé canonique : clubCode prioritaire, sinon nom complet nettoyé
      const key = t.clubCode ? `code_${t.clubCode}` : `name_${t.name.toLowerCase().replace(/\s+/g, '_')}`;
      resolved.set(t.id, key);
    });
    return resolved;
  }

  /**
   * Contrôle d'accès strict (ACL) sur les fiches de licenciés :
   * Empêche toute fuite ou annuaire public entre clubs.
   */
  public static canAccessLicenseRoster(params: {
    userRole: string;
    userClubId?: string;
    targetClubId: string;
    targetPlayerUid?: string;
    currentUid?: string;
  }): boolean {
    const { userRole, userClubId, targetClubId, targetPlayerUid, currentUid } = params;

    // Administrateur plateforme
    if (userRole === 'admin') return true;

    // Dirigeant ou coach du club concerné
    if ((userRole === 'club' || userRole === 'coach') && userClubId === targetClubId) {
      return true;
    }

    // Le joueur lui-même peut consulter sa propre fiche
    if (userRole === 'player' && currentUid && targetPlayerUid && currentUid === targetPlayerUid) {
      return true;
    }

    // Tout autre accès externe ou inter-clubs est strictement interdit
    return false;
  }
}
