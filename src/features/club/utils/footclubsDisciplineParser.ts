// src/features/club/utils/footclubsDisciplineParser.ts
// Parseur de fichiers CSV d'extractions disciplinaires Footclubs (FFF) et PV officiels

import type {
  PlayerDisciplinaryRecord,
  DisciplinaryScope,
  SanctionType,
} from '../../../models/PlayerDisciplinary';
import { detectCsvDelimiter, splitCsvLine } from './footclubsCsvParser';

export interface FootclubsDisciplineParseResult {
  success: boolean;
  records: PlayerDisciplinaryRecord[];
  errors: string[];
  totalRows: number;
  validRowsCount: number;
}

/**
 * Normalise un en-tête CSV pour correspondance souple (minuscules, sans accents, sans caractères spéciaux).
 */
function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function formatDateToLocalIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcule le lundi suivant la date donnée (Règlements Généraux FFF - Art. 226).
 * Si la date tombe déjà un lundi, la prise d'effet est le lundi suivant (+7 jours)
 * sauf si date déjà explicitée.
 */
export function computeFffMondayEffectiveDate(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? parseFrenchOrIsoDate(dateInput) : new Date(dateInput);
  if (!d || isNaN(d.getTime())) {
    const today = new Date();
    return formatDateToLocalIso(computeNextMonday(today));
  }
  return formatDateToLocalIso(computeNextMonday(d));
}

function computeNextMonday(d: Date): Date {
  const res = new Date(d);
  const day = res.getDay(); // 0 = Dimanche, 1 = Lundi, 6 = Samedi
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  res.setDate(res.getDate() + daysUntilMonday);
  res.setHours(0, 0, 0, 0);
  return res;
}

/**
 * Parse une date au format français JJ/MM/AAAA ou ISO AAAA-MM-JJ.
 */
export function parseFrenchOrIsoDate(str: string): Date | null {
  if (!str) return null;
  const trimmed = str.trim();

  // Format ISO AAAA-MM-JJ
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // Format Français JJ/MM/AAAA ou JJ-MM-AAAA
  const frMatch = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
  if (frMatch) {
    const day = parseInt(frMatch[1], 10);
    const month = parseInt(frMatch[2], 10) - 1;
    const year = parseInt(frMatch[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Déduit le périmètre de la sanction à partir du texte extrait.
 */
export function deduceDisciplinaryScope(rawText: string): DisciplinaryScope {
  const lower = (rawText || '').toLowerCase();
  if (
    lower.includes('toutes competitions') ||
    lower.includes('toutes épreuves') ||
    lower.includes('ferme totale') ||
    lower.includes('toutes cat')
  ) {
    return 'all_competitions';
  }
  if (lower.includes('coupe')) {
    return 'cup_only';
  }
  if (lower.includes('championnat')) {
    return 'championship_only';
  }
  return 'official_only';
}

/**
 * Déduit le type de sanction (au nombre de matchs ou temps calendaire fixe).
 */
export function deduceSanctionType(
  rawMatchesStr: string,
  startDateStr?: string,
  endDateStr?: string
): { type: SanctionType; matchesTotal: number } {
  const matchDigits = (rawMatchesStr || '').match(/\d+/);
  const matches = matchDigits ? parseInt(matchDigits[0], 10) : 0;

  if (startDateStr && endDateStr && matches === 0) {
    return { type: 'time_fixed', matchesTotal: 0 };
  }

  if (rawMatchesStr && rawMatchesStr.toLowerCase().includes('sursis')) {
    return { type: 'conditional', matchesTotal: matches };
  }

  return { type: 'matches_fixed', matchesTotal: matches > 0 ? matches : 1 };
}

/**
 * Parse un export CSV de discipline Footclubs.
 */
export function parseFootclubsDisciplineCsv(
  csvContent: string,
  clubId: string
): FootclubsDisciplineParseResult {
  const errors: string[] = [];
  const records: PlayerDisciplinaryRecord[] = [];

  if (!csvContent || typeof csvContent !== 'string') {
    return {
      success: false,
      records: [],
      errors: ['Le contenu du fichier CSV est vide ou non lisible.'],
      totalRows: 0,
      validRowsCount: 0,
    };
  }

  const rawLines = csvContent.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (rawLines.length < 2) {
    return {
      success: false,
      records: [],
      errors: ['Le fichier CSV doit contenir au moins une ligne d’en-tête et une ligne de données.'],
      totalRows: 0,
      validRowsCount: 0,
    };
  }

  const delimiter = detectCsvDelimiter(rawLines[0]);
  const headers = splitCsvLine(rawLines[0], delimiter).map(normalizeHeader);

  // Mappage des colonnes
  const idxLicense = headers.findIndex((h) =>
    h.includes('licence') || h.includes('licencie') || h.includes('numerolicence')
  );
  const idxLastName = headers.findIndex((h) => h === 'nom' || h.includes('nomjoueur') || h.includes('nomusuel'));
  const idxFirstName = headers.findIndex((h) => h === 'prenom' || h.includes('prenomjoueur'));
  const idxFullName = headers.findIndex((h) => h.includes('nomprenom') || h.includes('identite') || h === 'joueur');
  const idxCommission = headers.findIndex((h) =>
    h.includes('commission') || h.includes('organisme') || h.includes('instance') || h.includes('ligue') || h.includes('district')
  );
  const idxPvNumber = headers.findIndex((h) =>
    h.includes('dossier') || h.includes('pv') || h.includes('reference') || h.includes('proces')
  );
  const idxPvDate = headers.findIndex((h) =>
    (h.includes('date') && (h.includes('pv') || h.includes('notification') || h.includes('decision'))) || h === 'date'
  );
  const idxEffectiveDate = headers.findIndex((h) =>
    h.includes('effet') || h.includes('priseeffet') || h.includes('debut') || h.includes('datedebut')
  );
  const idxEndDate = headers.findIndex((h) =>
    h.includes('fin') || h.includes('datefin') || h.includes('terme')
  );
  const idxSanction = headers.findIndex((h) =>
    h.includes('sanction') || h.includes('match') || h.includes('duree') || h.includes('peine')
  );
  const idxScope = headers.findIndex((h) =>
    h.includes('competition') || h.includes('perimetre') || h.includes('scope') || h.includes('portee') || h.includes('champ')
  );
  const idxCategory = headers.findIndex((h) =>
    h.includes('categorie') || h.includes('equipe') || h.includes('division')
  );
  const idxReason = headers.findIndex((h) =>
    h.includes('motif') || h.includes('infraction') || h.includes('faits') || h.includes('libelle')
  );

  if (idxLicense === -1) {
    return {
      success: false,
      records: [],
      errors: ['Colonne "N° Licence" obligatoire introuvable dans l’en-tête du fichier Footclubs.'],
      totalRows: rawLines.length - 1,
      validRowsCount: 0,
    };
  }

  const nowIso = new Date().toISOString();

  for (let i = 1; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const cells = splitCsvLine(rawLine, delimiter);
    if (cells.length < 2 || cells.every((c) => !c.trim())) {
      continue;
    }

    const rawLicense = (cells[idxLicense] || '').replace(/[^0-9A-Za-z]/g, '').trim();
    if (!rawLicense) {
      errors.push(`Ligne ${i + 1} : Numéro de licence manquant ou invalide.`);
      continue;
    }

    // Extraction nom / prénom
    let playerName = '';
    if (idxLastName >= 0 && cells[idxLastName]) {
      const lastName = cells[idxLastName].trim().toUpperCase();
      const firstName = idxFirstName >= 0 && cells[idxFirstName] ? cells[idxFirstName].trim() : '';
      playerName = firstName ? `${lastName} ${firstName}` : lastName;
    } else if (idxFullName >= 0 && cells[idxFullName]) {
      playerName = cells[idxFullName].trim();
    } else {
      playerName = `Licencié ${rawLicense}`;
    }

    const commissionName =
      (idxCommission >= 0 && cells[idxCommission]?.trim()) || 'Commission de Discipline FFF';
    const pvNumber =
      (idxPvNumber >= 0 && cells[idxPvNumber]?.trim()) || `PV-${Date.now().toString().slice(-4)}`;

    const rawPvDate = idxPvDate >= 0 ? cells[idxPvDate]?.trim() : '';
    const parsedPvDate = parseFrenchOrIsoDate(rawPvDate);
    const pvDateIso = parsedPvDate ? formatDateToLocalIso(parsedPvDate) : formatDateToLocalIso(new Date());

    // Date de prise d'effet : si renseignée dans le CSV on l'utilise, sinon calcul au lundi suivant FFF
    let effectiveDateIso: string;
    const rawEffectiveDate = idxEffectiveDate >= 0 ? cells[idxEffectiveDate]?.trim() : '';
    const parsedEffectiveDate = parseFrenchOrIsoDate(rawEffectiveDate);
    if (parsedEffectiveDate) {
      effectiveDateIso = formatDateToLocalIso(parsedEffectiveDate);
    } else {
      effectiveDateIso = computeFffMondayEffectiveDate(pvDateIso);
    }

    const rawEndDate = idxEndDate >= 0 ? cells[idxEndDate]?.trim() : '';
    const parsedEndDate = parseFrenchOrIsoDate(rawEndDate);
    const endDateIso = parsedEndDate ? formatDateToLocalIso(parsedEndDate) : undefined;

    const rawSanction = idxSanction >= 0 ? cells[idxSanction]?.trim() : '1 match';
    const { type: sanctionType, matchesTotal } = deduceSanctionType(
      rawSanction,
      effectiveDateIso,
      endDateIso
    );

    const rawScope = idxScope >= 0 ? cells[idxScope]?.trim() : '';
    const scope = deduceDisciplinaryScope(rawScope);

    const teamCategory = idxCategory >= 0 ? cells[idxCategory]?.trim() : undefined;
    const reason = idxReason >= 0 ? cells[idxReason]?.trim() : undefined;

    const record: PlayerDisciplinaryRecord = {
      id: `disc_${rawLicense}_${Date.now()}_${i}`,
      license_number: rawLicense,
      player_name: playerName,
      club_id: clubId,
      team_category: teamCategory,
      commission_name: commissionName,
      pv_number: pvNumber,
      pv_date: pvDateIso,
      effective_date: effectiveDateIso,
      sanction_type: sanctionType,
      matches_total: matchesTotal,
      matches_served: 0,
      start_date: effectiveDateIso,
      end_date: endDateIso,
      scope,
      status: 'active',
      source: 'footclubs_csv',
      imported_at: nowIso,
      notes: reason,
    };

    records.push(record);
  }

  return {
    success: records.length > 0 || errors.length === 0,
    records,
    errors,
    totalRows: rawLines.length - 1,
    validRowsCount: records.length,
  };
}
