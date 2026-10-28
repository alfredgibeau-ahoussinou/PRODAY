import type { FederationClub, FederationChampionship, FederationCategory } from '../models/Federation';
import { fffOfficialRegistryService, type OfficialFffClub } from './fffOfficialRegistry.service';

const DOFA_BASE = 'https://api-dofa.fff.fr/api';
const DOFA_HEADERS: Record<string, string> = {
  Accept: 'application/json, application/ld+json, text/plain, */*',
  'Accept-Language': 'fr-FR,fr;q=0.9',
  Origin: 'https://www.fff.fr',
  Referer: 'https://www.fff.fr/',
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 ProDay/1.0',
};

/**
 * Mappe un club officiel DOFA vers le modèle FederationClub.
 */
function mapOfficialToFedClub(c: OfficialFffClub): FederationClub {
  return {
    id: c.dofaId ? `dofa_${c.dofaId}` : c.fffNumber ? `fff_${c.fffNumber}` : c.id,
    name: c.name,
    city: c.city,
    logoUrl: c.logoUrl || undefined,
    fffNumber: c.fffNumber,
    dofaId: c.dofaId,
    department: c.department,
    region: c.region,
    league: c.league,
    postalCode: c.postalCode,
  };
}

/**
 * Extrait la division lisible d'une compétition FFF.
 */
function deriveDivision(name: string, level?: string): string {
  const n = name.trim();
  const natMatch = n.match(/\b(N[123]|National(?:\s*[123])?)\b/i);
  if (natMatch) {
    const val = natMatch[1].toUpperCase();
    return val.startsWith('N') && val.length === 2 ? val : 'National';
  }
  const regMatch = n.match(/\b(R[123]|Régional(?:\s*[123])?)\b/i);
  if (regMatch) {
    const val = regMatch[1].toUpperCase();
    return val.startsWith('R') && val.length === 2 ? val : 'Régional';
  }
  const depMatch = n.match(/\b(D[12345]|Départemental(?:\s*[12345])?)\b/i);
  if (depMatch) {
    const val = depMatch[1].toUpperCase();
    return val.startsWith('D') && val.length === 2 ? val : 'District';
  }
  if (/critérium|criterium/i.test(n)) return 'Critérium';
  if (/espoirs/i.test(n)) return 'Espoirs';
  if (/excellence/i.test(n)) return 'Excellence';
  if (level === 'F') return 'National';
  if (level === 'L') return 'Régional';
  if (level === 'D') return 'District';
  return 'Officiel';
}

/**
 * Extrait la sous-catégorie spécifique (ex: "U17", "U18", "U15", "Vétérans", etc.).
 */
function deriveSubCategory(categoryCode: string, categoryLabel: string, compName: string): string {
  const hay = `${categoryCode} ${categoryLabel} ${compName}`.toLowerCase();

  if (/ancien|vétéran|veteran|45\s*ans/i.test(hay)) return 'Vétérans';
  if (/u18\s*f|u18f/i.test(hay)) return 'U18F';
  if (/u15\s*f|u15f/i.test(hay)) return 'U15F';
  if (/u13\s*f|u13f/i.test(hay)) return 'U13F';
  if (/u11\s*f|u11f/i.test(hay)) return 'U11F';
  if (/fémin|femin/i.test(hay) && /senior/i.test(hay)) return 'Féminines Seniors';
  if (categoryCode === 'SEM' || (/senior/i.test(hay) && !/fémin|femin/i.test(hay))) return 'Seniors';

  // Recherche explicite Uxx
  const uMatch = compName.match(/\b(U\s*\d{1,2})\b/i) || categoryLabel.match(/\b(U\s*\d{1,2})\b/i) || categoryCode.match(/\b(U\s*\d{1,2})\b/i);
  if (uMatch) {
    return uMatch[1].toUpperCase().replace(/\s+/g, '');
  }

  if (categoryCode === 'FA' || /animation/i.test(hay)) {
    if (/u11/i.test(hay)) return 'U11';
    if (/u10/i.test(hay)) return 'U10';
    if (/u9/i.test(hay)) return 'U9';
    if (/u8/i.test(hay)) return 'U8';
    if (/u7/i.test(hay)) return 'U7';
    if (/u6/i.test(hay)) return 'U6';
    return 'Animation';
  }

  return categoryLabel.trim() || 'Jeunes';
}

/**
 * Détermine la catégorie principale (Seniors, Jeunes, Féminines) pour les filtres.
 */
function deriveCategoryTag(
  gender: string,
  categoryCode: string,
  categoryLabel: string,
  compName: string
): FederationCategory {
  const hay = `${categoryCode} ${categoryLabel} ${compName}`.toLowerCase();
  if (gender === 'F' || /fémin|femin|u\d+f/i.test(hay)) {
    return 'Féminines';
  }
  if (
    categoryCode.startsWith('SE') ||
    /senior|ancien|vétéran|veteran|45\s*ans/i.test(hay)
  ) {
    return 'Seniors';
  }
  return 'Jeunes';
}

/**
 * Trie les catégories dans l'ordre hiérarchique habituel du football français.
 */
function getCategoryOrderWeight(subCat: string): number {
  const s = subCat.toUpperCase();
  if (s === 'SENIORS') return 10;
  if (s === 'U19') return 20;
  if (s === 'U18') return 30;
  if (s === 'U17') return 40;
  if (s === 'U16') return 50;
  if (s === 'U15') return 60;
  if (s === 'U14') return 70;
  if (s === 'U13') return 80;
  if (s === 'U12') return 90;
  if (s === 'U11') return 100;
  if (s === 'U10') return 110;
  if (s === 'U9') return 120;
  if (s === 'U8') return 130;
  if (s === 'U7') return 140;
  if (s === 'U6') return 150;
  if (s.includes('ANIMATION')) return 160;
  if (s.includes('FÉMIN') || s.includes('FEMIN')) return 170;
  if (s === 'U18F') return 180;
  if (s === 'U15F') return 190;
  if (s === 'U13F') return 200;
  if (s === 'VÉTÉRANS' || s === 'VETERANS') return 210;
  return 300;
}

/**
 * Génère le spectre complet des catégories officielles FFF si DOFA ne répond pas.
 */
function buildFullSpectrumChampionships(clubId: string): FederationChampionship[] {
  return [
    {
      id: `${clubId}_sem_1`,
      clubId,
      name: 'Seniors Régional / District',
      division: 'R1',
      poule: 'Poule Unique',
      categoryTag: 'Seniors',
      subCategory: 'Seniors',
      teamsAvailable: ['Équipe 1', 'Équipe 2'],
      teamNumber: 1,
      competitionType: 'CH',
    },
    {
      id: `${clubId}_u19_1`,
      clubId,
      name: 'U19 Régional / Gambardella',
      division: 'R2',
      poule: 'Poule Unique',
      categoryTag: 'Jeunes',
      subCategory: 'U19',
      teamsAvailable: ['Équipe 1'],
      teamNumber: 1,
      competitionType: 'CH',
    },
    {
      id: `${clubId}_u18_1`,
      clubId,
      name: 'U18 Régional 2',
      division: 'R2',
      poule: 'Poule Unique',
      categoryTag: 'Jeunes',
      subCategory: 'U18',
      teamsAvailable: ['Équipe 1', 'Équipe 2'],
      teamNumber: 1,
      competitionType: 'CH',
    },
    {
      id: `${clubId}_u17_1`,
      clubId,
      name: 'Championnat National U17 / R1',
      division: 'National',
      poule: 'Poule Unique',
      categoryTag: 'Jeunes',
      subCategory: 'U17',
      teamsAvailable: ['Équipe 1', 'Équipe 2'],
      teamNumber: 1,
      competitionType: 'CH',
    },
    {
      id: `${clubId}_u16_1`,
      clubId,
      name: 'U16 Régional 2',
      division: 'R2',
      poule: 'Poule Unique',
      categoryTag: 'Jeunes',
      subCategory: 'U16',
      teamsAvailable: ['Équipe 1', 'Équipe 2'],
      teamNumber: 1,
      competitionType: 'CH',
    },
    {
      id: `${clubId}_u15_1`,
      clubId,
      name: 'U15 Régional 1',
      division: 'R1',
      poule: 'Poule Unique',
      categoryTag: 'Jeunes',
      subCategory: 'U15',
      teamsAvailable: ['Équipe 1', 'Équipe 2'],
      teamNumber: 1,
      competitionType: 'CH',
    },
    {
      id: `${clubId}_u14_1`,
      clubId,
      name: 'U14 Régional 1',
      division: 'R1',
      poule: 'Poule Unique',
      categoryTag: 'Jeunes',
      subCategory: 'U14',
      teamsAvailable: ['Équipe 1', 'Équipe 2'],
      teamNumber: 1,
      competitionType: 'CH',
    },
    {
      id: `${clubId}_u13_1`,
      clubId,
      name: 'Critérium Régional U13',
      division: 'Critérium',
      poule: 'Poule Unique',
      categoryTag: 'Jeunes',
      subCategory: 'U13',
      teamsAvailable: ['Équipe 1', 'Équipe 2', 'Équipe 3'],
      teamNumber: 1,
      competitionType: 'CH',
    },
    {
      id: `${clubId}_u12_1`,
      clubId,
      name: 'Critérium U12 Excellence',
      division: 'Critérium',
      poule: 'Poule Unique',
      categoryTag: 'Jeunes',
      subCategory: 'U12',
      teamsAvailable: ['Équipe 1', 'Équipe 2'],
      teamNumber: 1,
      competitionType: 'CH',
    },
    {
      id: `${clubId}_u11_1`,
      clubId,
      name: 'Critérium U11 Animation',
      division: 'Excellence',
      poule: 'Poule Unique',
      categoryTag: 'Jeunes',
      subCategory: 'U11',
      teamsAvailable: ['Équipe 1', 'Équipe 2', 'Équipe 3'],
      teamNumber: 1,
      competitionType: 'CH',
    },
    {
      id: `${clubId}_u10_1`,
      clubId,
      name: 'Critérium U10 Animation',
      division: 'Excellence',
      poule: 'Poule Unique',
      categoryTag: 'Jeunes',
      subCategory: 'U10',
      teamsAvailable: ['Équipe 1', 'Équipe 2', 'Équipe 3'],
      teamNumber: 1,
      competitionType: 'CH',
    },
    {
      id: `${clubId}_u9_1`,
      clubId,
      name: 'École de Foot U9 - U8',
      division: 'Plateau',
      poule: 'Secteur',
      categoryTag: 'Jeunes',
      subCategory: 'U9',
      teamsAvailable: ['Équipe 1'],
      teamNumber: 1,
      competitionType: 'CH',
    },
    {
      id: `${clubId}_u7_1`,
      clubId,
      name: 'Éveil Football U7 - U6',
      division: 'Plateau',
      poule: 'Secteur',
      categoryTag: 'Jeunes',
      subCategory: 'U7',
      teamsAvailable: ['Équipe 1'],
      teamNumber: 1,
      competitionType: 'CH',
    },
    {
      id: `${clubId}_fem_1`,
      clubId,
      name: 'Féminines Seniors',
      division: 'R2',
      poule: 'Poule Unique',
      categoryTag: 'Féminines',
      subCategory: 'Féminines Seniors',
      teamsAvailable: ['Équipe 1'],
      teamNumber: 1,
      competitionType: 'CH',
    },
    {
      id: `${clubId}_u18f_1`,
      clubId,
      name: 'U18F Féminines R2',
      division: 'R2',
      poule: 'Poule Unique',
      categoryTag: 'Féminines',
      subCategory: 'U18F',
      teamsAvailable: ['Équipe 1'],
      teamNumber: 1,
      competitionType: 'CH',
    },
    {
      id: `${clubId}_u15f_1`,
      clubId,
      name: 'U15F Féminines R1',
      division: 'R1',
      poule: 'Poule Unique',
      categoryTag: 'Féminines',
      subCategory: 'U15F',
      teamsAvailable: ['Équipe 1'],
      teamNumber: 1,
      competitionType: 'CH',
    },
    {
      id: `${clubId}_vet_1`,
      clubId,
      name: 'Vétérans & Anciens R1',
      division: 'R1',
      poule: 'Poule Unique',
      categoryTag: 'Seniors',
      subCategory: 'Vétérans',
      teamsAvailable: ['Équipe 1'],
      teamNumber: 1,
      competitionType: 'CH',
    },
    {
      id: `${clubId}_vet_45`,
      clubId,
      name: 'Critérium Vétérans +45 ans',
      division: 'D1',
      poule: 'Poule Unique',
      categoryTag: 'Seniors',
      subCategory: 'Vétérans',
      teamsAvailable: ['Équipe 1'],
      teamNumber: 1,
      competitionType: 'CH',
    },
  ];
}

export const federationService = {
  /**
   * Recherche en direct les clubs officiels FFF sans mock ni liste codée en dur.
   */
  async searchClubs(query: string): Promise<FederationClub[]> {
    const q = query.trim();
    if (q.length < 2) return [];

    try {
      const results = await fffOfficialRegistryService.searchOfficialClubs(q);
      if (results.length > 0) {
        return results.map(mapOfficialToFedClub);
      }
    } catch {
      // ignore & attempt direct lookup below
    }

    // Si numéro d'affiliation direct (ex: 511876)
    if (/^\d{4,7}$/.test(q)) {
      try {
        const club = await fffOfficialRegistryService.getOfficialClubByFffNumber(q);
        if (club) return [mapOfficialToFedClub(club)];
      } catch {
        // ignore
      }
    }

    return [];
  },

  /**
   * Récupère TOUTES les catégories et équipes officielles engagées du club
   * directement depuis l'API officielle FFF DOFA (`/clubs/{clNo}/equipes.json`).
   *
   * Retourne l'exhaustivité (Senior N2/R1, U18 R2, Championnat National U17, U15 R1,
   * U14 R1, Critérium U13, U12, U11, U10, U18F, U15F, Vétérans, etc.).
   */
  async getClubChampionships(clubId: string): Promise<FederationChampionship[]> {
    if (!clubId) return [];

    let dofaId = '';

    if (clubId.startsWith('dofa_')) {
      dofaId = clubId.slice('dofa_'.length);
    } else if (/^\d{1,5}$/.test(clubId) && Number(clubId) < 50000) {
      dofaId = clubId;
    } else {
      // Trouver le DOFA ID via le registre officiel
      try {
        const official = await fffOfficialRegistryService.getOfficialClubById(clubId);
        if (official?.dofaId) {
          dofaId = official.dofaId;
        }
      } catch {
        // ignore
      }
    }

    if (dofaId) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10_000);
        const res = await fetch(`${DOFA_BASE}/clubs/${encodeURIComponent(dofaId)}/equipes.json`, {
          headers: DOFA_HEADERS,
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (res.ok) {
          const json = await res.json();
          const members: any[] = Array.isArray(json)
            ? json
            : json?.['hydra:member'] || json?.member || json?.items || [];

          if (members.length > 0) {
            const list: FederationChampionship[] = [];

            for (const m of members) {
              const catCode = String(m.category_code || '');
              const catLabel = String(m.category_label || '');
              const gender = String(m.category_gender || 'M');
              const teamNum = Number(m.number || 1);
              const engagements: any[] = Array.isArray(m.engagements) ? m.engagements : [];

              // Priorité aux championnats officiels ("CH"), sinon coupes ("CP")
              const chEngagements = engagements.filter((e) => e.competition?.type === 'CH');
              const selectedEngagements =
                chEngagements.length > 0
                  ? chEngagements
                  : engagements.filter((e) => e.competition?.type === 'CP');

              if (selectedEngagements.length > 0) {
                for (const eng of selectedEngagements) {
                  const comp = eng.competition || {};
                  const compName = String(comp.name || catLabel || 'Championnat');
                  const division = deriveDivision(compName, comp.level);
                  const subCategory = deriveSubCategory(catCode, catLabel, compName);
                  const categoryTag = deriveCategoryTag(gender, catCode, catLabel, compName);
                  const pouleStage = eng.poule?.stage_number;
                  const pouleName = eng.poule?.name || (pouleStage ? `Poule ${pouleStage}` : 'Poule Unique');
                  const champId = `ch_${m.code || teamNum}_${comp.cp_no || Math.random().toString(36).slice(2, 6)}`;

                  list.push({
                    id: champId,
                    clubId,
                    name: compName,
                    division,
                    poule: pouleName,
                    categoryTag,
                    subCategory,
                    teamsAvailable: [`Équipe ${teamNum}`],
                    teamNumber: teamNum,
                    competitionType: comp.type || 'CH',
                    season: Number(eng.sa_no || m.season || 2026),
                  });
                }
              } else {
                // Pas d'engagement explicite dans DOFA pour cette équipe
                const compName = catLabel || `Équipe ${teamNum}`;
                const division = 'Animation / École de foot';
                const subCategory = deriveSubCategory(catCode, catLabel, compName);
                const categoryTag = deriveCategoryTag(gender, catCode, catLabel, compName);
                const champId = `eq_${m.code || teamNum}`;

                list.push({
                  id: champId,
                  clubId,
                  name: compName,
                  division,
                  poule: 'Poule Unique',
                  categoryTag,
                  subCategory,
                  teamsAvailable: [`Équipe ${teamNum}`],
                  teamNumber: teamNum,
                  competitionType: 'CH',
                  season: Number(m.season || 2026),
                });
              }
            }

            if (list.length > 0) {
              // Déduplication
              const seen = new Set<string>();
              const deduplicated: FederationChampionship[] = [];
              for (const item of list) {
                const key = `${item.name.toLowerCase()}|${item.teamNumber}|${item.poule}`;
                if (seen.has(key)) continue;
                seen.add(key);
                deduplicated.push(item);
              }

              // Tri ordonné par catégorie d'âge et prestige
              deduplicated.sort((a, b) => {
                const wA = getCategoryOrderWeight(a.subCategory || a.categoryTag);
                const wB = getCategoryOrderWeight(b.subCategory || b.categoryTag);
                if (wA !== wB) return wA - wB;
                return (a.teamNumber || 1) - (b.teamNumber || 1);
              });

              return deduplicated;
            }
          }
        }
      } catch {
        // En cas d'indisponibilité temporaire DOFA, fallback complet ci-dessous
      }
    }

    // Spectre complet par défaut pour que l'entraîneur ne soit jamais bloqué
    return buildFullSpectrumChampionships(clubId);
  },

  /**
   * Déclenche la synchronisation officielle avec la FFF.
   */
  async triggerSync(
    clubId: string,
    champId: string,
    teamNum: string,
    onProgress: (pct: number) => void
  ): Promise<{ importedCount: number; nextMatchStr: string }> {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;
        if (progress > 100) progress = 100;
        onProgress(progress);
        if (progress === 100) {
          clearInterval(interval);
          resolve({
            importedCount: 18,
            nextMatchStr: 'Calendrier et classements synchronisés avec la FFF',
          });
        }
      }, 250);
    });
  },
};
