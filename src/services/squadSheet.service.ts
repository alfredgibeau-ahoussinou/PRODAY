/**
 * Conversion d'une feuille d'équipe PDF en tableau importable.
 *
 * Le PDF ne peut pas être lu dans l'application : le dépôt n'embarque aucun
 * parseur PDF, et les feuilles FFF utilisent des polices composites qu'un
 * extracteur approximatif transformerait en charabia. La conversion se fait donc
 * dans la Cloud Function `extractSquadSheetText` (voir `functions/src/pdfText.ts`),
 * qui renvoie un tableau `;`-séparé relisible par le parseur de licences du pôle
 * Club — une seule implémentation du mapping de colonnes pour les deux pôles.
 */

import { callFunction } from '../lib/firebaseFunctions';
import { storageService, type UploadFileInput } from './storage.service';

export const SQUAD_SHEET_FUNCTION = 'extractSquadSheetText';

export type SquadSheetExtraction = {
  /** Tableau `;`-séparé, en-tête inclus. Vide si rien n'a pu être lu. */
  csv: string;
  rows: number;
  columns: string[];
  pages: number;
  warnings: string[];
};

export class SquadSheetExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SquadSheetExtractionError';
  }
}

/** Dépose puis convertit. Renvoie un CSV vide + avertissements si le PDF est un scan. */
export async function extractSquadSheetCsv(params: {
  uid: string;
  file: UploadFileInput;
}): Promise<SquadSheetExtraction> {
  const uploaded = await storageService.uploadSquadSheet(params.uid, params.file);

  const result = await callFunction<
    { storagePath: string },
    Partial<SquadSheetExtraction>
  >(SQUAD_SHEET_FUNCTION, { storagePath: uploaded.path });

  return normalizeExtraction(result);
}

/**
 * Normalise la réponse du serveur : un appel de fonction ne doit jamais laisser
 * passer un objet partiel jusqu'à l'écran.
 */
export function normalizeExtraction(result: unknown): SquadSheetExtraction {
  const value = (result ?? {}) as Partial<SquadSheetExtraction>;
  const warnings = Array.isArray(value.warnings)
    ? value.warnings.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
    : [];

  return {
    csv: typeof value.csv === 'string' ? value.csv : '',
    rows: typeof value.rows === 'number' && Number.isFinite(value.rows) ? value.rows : 0,
    columns: Array.isArray(value.columns)
      ? value.columns.filter((entry): entry is string => typeof entry === 'string')
      : [],
    pages: typeof value.pages === 'number' && Number.isFinite(value.pages) ? value.pages : 0,
    warnings,
  };
}
