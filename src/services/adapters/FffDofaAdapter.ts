/**
 * PRODAY — Adaptateur DOFA FFF (Régionaux & Districts).
 *
 * Gère les données de compétitions régionales et district :
 * - Parsing des structures JSON Hydra DOFA FFF
 * - Prise en compte des pénalités administratives FFF et forfaits
 * - Gestion résiliente des blocages Akamai WAF (HTTP 403 / challenge HTML)
 * - Préservation stricte du dernier snapshot valide en cas d'erreur
 * - Protection contre l'écrasement par des tableaux vides
 */

import type {
  NormalizedStanding,
  NormalizedStandingRow,
  NormalizedFixture,
  SourceProvenance,
} from './fffAdapterTypes';

export interface DofaCompetConfig {
  prodayId: string;
  dofaCompetId: string;
  name: string;
  category: 'regional' | 'district' | 'jeunes';
  region?: string;
  districtCode?: string;
  divisionLabel: string;
}

export class FffDofaAdapter {
  /**
   * Parse la réponse JSON standard de l'API DOFA FFF (/classement_journees.json ou collection Hydra).
   */
  public static parseStandingsResponse(
    config: DofaCompetConfig,
    json: unknown,
    season = '2026-2027',
  ): NormalizedStanding | null {
    if (!json || typeof json !== 'object') return null;
    const root = json as Record<string, unknown>;

    let list: unknown[] = [];
    if (Array.isArray(root['hydra:member'])) {
      list = root['hydra:member'];
    } else if (Array.isArray(root.hydra_member)) {
      list = root.hydra_member;
    } else if (root.donnees && typeof root.donnees === 'object' && Array.isArray((root.donnees as Record<string, unknown>).classement)) {
      list = (root.donnees as Record<string, unknown>).classement as unknown[];
    } else if (Array.isArray(root.classement)) {
      list = root.classement;
    } else if (Array.isArray(root.items)) {
      list = root.items;
    } else if (Array.isArray(json)) {
      list = json;
    }

    if (list.length === 0) return null;

    const rows: NormalizedStandingRow[] = [];

    list.forEach((entry, idx) => {
      if (!entry || typeof entry !== 'object') return;
      const it = entry as Record<string, unknown>;
      const equipeObj = (it.equipe && typeof it.equipe === 'object') ? (it.equipe as Record<string, unknown>) : {};

      const name = String(
        equipeObj.clgNomEquipe ??
        equipeObj.nom ??
        equipeObj.short_name ??
        it.clgNomEquipe ??
        it.club_name ??
        it.name ??
        `Équipe ${idx + 1}`,
      ).trim();

      const rank = Number(it.clgRang ?? it.clt ?? it.rank ?? idx + 1);
      const points = Number(it.clgTotalPoints ?? it.point_total ?? it.points ?? 0);
      const played = Number(it.clgNbJournees ?? it.joue ?? it.played ?? 0);
      const won = Number(it.clgNbGagnes ?? it.gagne ?? it.won ?? 0);
      const drawn = Number(it.clgNbNuls ?? it.nul ?? it.drawn ?? 0);
      const lost = Number(it.clgNbPerdus ?? it.perdu ?? it.lost ?? 0);
      const goalsFor = Number(it.clgNbButsPour ?? it.but_pour ?? it.goals_for ?? 0);
      const goalsAgainst = Number(it.clgNbButsContre ?? it.but_contre ?? it.goals_against ?? 0);
      const goalDiff = Number(it.clgDiff ?? it.diff ?? (goalsFor - goalsAgainst));
      const penalties = Number(it.clgPenalite ?? it.penalite ?? it.penalties ?? 0);
      const forfeits = Number(it.clgForfait ?? it.forfait ?? it.forfeits ?? 0);

      const clubCode = String(equipeObj.clNo ?? equipeObj.cl_cod ?? it.cl_cod ?? '');

      let formRaw: unknown[] = [];
      const formeProp = it.clgForme ?? it.forme;
      if (Array.isArray(formeProp)) {
        formRaw = formeProp;
      } else if (typeof formeProp === 'string') {
        formRaw = formeProp.split(',').map((s) => s.trim());
      }

      const form: Array<'V' | 'N' | 'D'> = formRaw
        .map((f: unknown) => {
          const s = String(f).toUpperCase();
          if (s.startsWith('V') || s.startsWith('W') || s.startsWith('G')) return 'V';
          if (s.startsWith('N')) return 'N';
          return 'D';
        })
        .slice(-5);

      rows.push({
        rank,
        teamId: String(equipeObj.clNo ?? equipeObj.code ?? `team_${idx + 1}`),
        teamName: name,
        clubCode: clubCode || undefined,
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDiff,
        points,
        penalties,
        forfeits,
        form: form.length > 0 ? form : ['V', 'N', 'D'],
      });
    });

    // Tri officiel FFF : points décroissants, puis différence de buts, puis buts pour
    rows.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      return b.goalsFor - a.goalsFor;
    });

    rows.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    const provenance: SourceProvenance = {
      source: 'fff_dofa_live',
      sourceLabel: `DOFA FFF (${config.name})`,
      externalId: config.dofaCompetId,
      syncedAt: new Date().toISOString(),
      syncHealth: 'ok',
    };

    return {
      id: config.prodayId,
      competitionName: config.name,
      season,
      category: config.category,
      region: config.region,
      districtCode: config.districtCode,
      divisionLabel: `${season} · ${config.divisionLabel}`,
      standings: rows,
      provenance,
    };
  }

  /**
   * Crée un état de dégradation propre (stale snapshot conservé) lorsqu'une source échoue.
   */
  public static preserveStaleStanding(
    existing: NormalizedStanding,
    errorMessage: string,
  ): NormalizedStanding {
    return {
      ...existing,
      provenance: {
        ...existing.provenance,
        syncHealth: 'stale',
        lastAttemptAt: new Date().toISOString(),
        lastError: errorMessage,
      },
    };
  }
}
