/**
 * Import de feuille d'équipe — logique pure, partagée par le panneau Coach.
 *
 * Deux entrées possibles : un fichier texte (CSV FootClubs / FFF) ou une feuille
 * PDF convertie côté serveur. Dans les deux cas on retombe sur **le même
 * parseur** (`parseFootclubsCsv`) : un seul mapping de colonnes dans tout le
 * dépôt, donc aucune divergence entre le pôle Club et le pôle Coach.
 */

import {
  parseFootclubsCsv,
  type ParsedLicenseRow,
} from '../features/club/utils/footclubsCsvParser';

export type SheetFileKind = 'csv' | 'pdf' | 'spreadsheet' | 'unknown';

export type ParsedSheet = {
  rows: ParsedLicenseRow[];
  errors: string[];
  /** Vrai si le document a livré au moins un licencié exploitable. */
  ok: boolean;
};

/**
 * Classe un fichier choisi par le coach. Un tableur n'est **pas** deviné : les
 * formats `.xlsx`/`.xls` sont des archives compressées, illisibles sans
 * bibliothèque dédiée — on demande explicitement un export CSV.
 */
export function classifySheetFile(name: string, mimeType?: string | null): SheetFileKind {
  const lowerName = (name || '').toLowerCase().trim();
  const lowerMime = (mimeType || '').toLowerCase().trim();

  if (lowerName.endsWith('.pdf') || lowerMime.includes('pdf')) return 'pdf';
  if (
    lowerName.endsWith('.xlsx') ||
    lowerName.endsWith('.xls') ||
    lowerName.endsWith('.ods') ||
    lowerMime.includes('spreadsheetml') ||
    lowerMime.includes('ms-excel')
  ) {
    return 'spreadsheet';
  }
  if (lowerName.endsWith('.csv') || lowerName.endsWith('.txt') || lowerMime.includes('csv')) {
    return 'csv';
  }
  if (lowerMime.startsWith('text/')) return 'csv';
  return 'unknown';
}

export const SPREADSHEET_HINT =
  'Depuis FootClubs / FFF, choisissez « Exporter en CSV », puis réimportez ce fichier. Les classeurs Excel ne sont pas lus directement.';

export const SCANNED_PDF_HINT =
  'Feuille sans texte exploitable (document scanné). Fournissez l’export CSV FootClubs ou saisissez les joueurs à la main.';

/** Relit un tableau texte (CSV exporté ou converti depuis un PDF). */
export function parseImportedSheetText(text: string): ParsedSheet {
  if (!text || text.trim().length < 8) {
    return { rows: [], errors: [], ok: false };
  }
  const result = parseFootclubsCsv(text);
  return {
    rows: result.success ? result.rows : [],
    errors: result.errors,
    ok: result.success && result.rows.length > 0,
  };
}

/** Catégories distinctes d'un lot importé, plafonnées pour l'aperçu. */
export function sheetCategories(rows: ParsedLicenseRow[], limit = 8): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    const category = row.category?.trim();
    if (category) seen.add(category);
  }
  return [...seen].slice(0, limit);
}

/** Prénoms/noms affichés dans l'aperçu, plafonnés. */
export function sheetPreviewNames(rows: ParsedLicenseRow[], limit = 6): string[] {
  return rows
    .map((row) => row.displayName.trim())
    .filter(Boolean)
    .slice(0, limit);
}

/**
 * Message unique remonté au coach pour un PDF converti mais vide : on préfère
 * les avertissements du serveur (plus précis) au message générique.
 */
export function resolvePdfWarnings(warnings: string[]): string[] {
  const cleaned = warnings.map((entry) => entry.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : [SCANNED_PDF_HINT];
}
