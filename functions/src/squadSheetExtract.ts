/**
 * Conversion d'une feuille d'équipe PDF en tableau importable.
 *
 * Trois garanties, dans cet ordre :
 * 1. **Périmètre** — le chemin de stockage est borné au dossier du demandeur, et
 *    l'appartenance à un club est lue sur `users/{uid}` côté serveur, jamais
 *    depuis un paramètre client (même règle que `clubMemberSearch`).
 * 2. **Honnêteté** — un PDF scanné ou illisible ne produit aucun joueur : la
 *    fonction renvoie un avertissement et le coach doit fournir un CSV.
 * 3. **Vie privée** — la feuille contient des données de mineurs : le fichier
 *    déposé est supprimé après lecture.
 *
 * L'accès au stockage est **injecté** pour être testable sans émulateur.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { extractTextFromPdf } from './pdfText';
import { buildSheetCsv } from './squadSheetText';

export const SQUAD_SHEET_PREFIX = 'squad-sheets';
export const MAX_SQUAD_SHEET_BYTES = 8 * 1024 * 1024;

export type SquadSheetExtractResult = {
  csv: string;
  rows: number;
  columns: string[];
  pages: number;
  warnings: string[];
};

export class SquadSheetError extends Error {
  readonly code: 'unauthenticated' | 'permission-denied' | 'invalid-argument' | 'not-found';

  constructor(code: SquadSheetError['code'], message: string) {
    super(message);
    this.code = code;
    this.name = 'SquadSheetError';
  }
}

/**
 * Le fichier doit être **celui du demandeur** : premier segment réservé au
 * dossier, deuxième segment égal à son uid. Aucune remontée de répertoire.
 */
export function assertOwnSquadSheetPath(storagePath: unknown, callerUid: string): string {
  const path = typeof storagePath === 'string' ? storagePath.trim() : '';
  if (!path) {
    throw new SquadSheetError('invalid-argument', 'Fichier manquant.');
  }
  if (path.includes('..') || path.startsWith('/')) {
    throw new SquadSheetError('invalid-argument', 'Chemin de fichier invalide.');
  }
  const segments = path.split('/').filter(Boolean);
  if (segments.length < 3 || segments[0] !== SQUAD_SHEET_PREFIX) {
    throw new SquadSheetError('invalid-argument', 'Chemin de fichier invalide.');
  }
  if (segments[1] !== callerUid) {
    throw new SquadSheetError('permission-denied', 'Ce fichier n’appartient pas à votre compte.');
  }
  return segments.join('/');
}

/** Club du demandeur, lu sur son propre document — jamais fourni par le client. */
export function callerClubId(callerDoc: Record<string, unknown> | undefined | null): string | null {
  if (!callerDoc) return null;
  const profile = (callerDoc.profile ?? {}) as Record<string, unknown>;
  const raw = profile.club_id;
  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : null;
}

export type DownloadResult = { bytes: Buffer; contentType: string } | null;

export type SquadSheetExtractParams = {
  db: Firestore;
  callerUid: string;
  storagePath: unknown;
  download: (path: string) => Promise<DownloadResult>;
  /** Suppression best-effort après lecture (données de mineurs). */
  remove?: (path: string) => Promise<void>;
};

export async function extractSquadSheetFromStorage(
  params: SquadSheetExtractParams,
): Promise<SquadSheetExtractResult> {
  const { db, callerUid, storagePath, download, remove } = params;
  if (!callerUid) {
    throw new SquadSheetError('unauthenticated', 'Connexion requise.');
  }

  const safePath = assertOwnSquadSheetPath(storagePath, callerUid);

  const callerSnap = await db.collection('users').doc(callerUid).get();
  const clubId = callerClubId(callerSnap.data() as Record<string, unknown> | undefined);
  if (!clubId) {
    throw new SquadSheetError('permission-denied', 'Aucun club rattaché à votre compte.');
  }

  const file = await download(safePath);
  if (!file) {
    throw new SquadSheetError('not-found', 'Fichier introuvable. Rechargez la feuille.');
  }

  try {
    if (file.bytes.length > MAX_SQUAD_SHEET_BYTES) {
      throw new SquadSheetError('invalid-argument', 'Fichier trop volumineux (max 8 Mo).');
    }
    if (file.contentType && !file.contentType.toLowerCase().includes('pdf')) {
      throw new SquadSheetError(
        'invalid-argument',
        'Seuls les PDF sont convertis côté serveur. Exportez les tableurs en CSV.',
      );
    }

    const extracted = extractTextFromPdf(file.bytes);
    const warnings: string[] = [];
    if (!extracted.hasText) {
      if (extracted.reason) warnings.push(extracted.reason);
      return { csv: '', rows: 0, columns: [], pages: extracted.pages, warnings };
    }

    const table = buildSheetCsv(extracted.text);
    warnings.push(...table.warnings);
    if (table.rows === 0 && warnings.length === 0) {
      warnings.push('Aucune ligne de joueur détectée dans le document.');
    }

    return {
      csv: table.csv,
      rows: table.rows,
      columns: table.columns,
      pages: extracted.pages,
      warnings,
    };
  } finally {
    if (remove) {
      try {
        await remove(safePath);
      } catch {
        // Le fichier expirera de toute façon ; ne jamais masquer le résultat.
      }
    }
  }
}
