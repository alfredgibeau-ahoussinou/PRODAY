/**
 * Conversion d'une feuille d'équipe PDF en tableau importable.
 *
 * Combine deux moteurs d'extraction :
 * 1. Extraction autonome locale (`clientPdfExtractor`) pour garantir une extraction
 *    immédiate hors-ligne et indépendante de Firebase Storage.
 * 2. Repli serveur sur la Cloud Function `extractSquadSheetText` si disponible.
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { callFunction } from '../lib/firebaseFunctions';
import { storageService, type UploadFileInput } from './storage.service';
import {
  extractPdfTextClient,
  convertExtractedTextToSquadCsv,
} from '../utils/clientPdfExtractor';

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

function decodeBase64ToUint8(base64: string): Uint8Array {
  if (!base64 || typeof base64 !== 'string') return new Uint8Array(0);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  const clean = base64.replace(/[\r\n\s]/g, '');
  const len = clean.length;
  let placeHolders = 0;
  if (clean.endsWith('==')) placeHolders = 2;
  else if (clean.endsWith('=')) placeHolders = 1;

  const outLen = Math.max(0, (len * 3) / 4 - placeHolders);
  const bytes = new Uint8Array(outLen);

  let cur = 0;
  for (let i = 0; i < len; i += 4) {
    const a = lookup[clean.charCodeAt(i)] ?? 0;
    const b = lookup[clean.charCodeAt(i + 1)] ?? 0;
    const c = lookup[clean.charCodeAt(i + 2)] ?? 0;
    const d = lookup[clean.charCodeAt(i + 3)] ?? 0;

    if (cur < outLen) bytes[cur++] = (a << 2) | (b >> 4);
    if (cur < outLen) bytes[cur++] = ((b & 15) << 4) | (c >> 2);
    if (cur < outLen) bytes[cur++] = ((c & 3) << 6) | (d & 63);
  }
  return bytes;
}

async function readPdfBytesLocally(file: UploadFileInput & { file?: Blob }): Promise<Uint8Array | null> {
  try {
    if (file.file && typeof file.file.arrayBuffer === 'function') {
      const buffer = await file.file.arrayBuffer();
      return new Uint8Array(buffer);
    }
    if (file.uri && file.uri.startsWith('data:')) {
      const comma = file.uri.indexOf(',');
      if (comma !== -1) {
        return decodeBase64ToUint8(file.uri.slice(comma + 1));
      }
    }
    if (Platform.OS === 'web' && file.uri) {
      const resp = await fetch(file.uri);
      const buffer = await resp.arrayBuffer();
      return new Uint8Array(buffer);
    }
    const encoding = (FileSystem as { EncodingType?: { Base64?: string } })?.EncodingType?.Base64 ?? 'base64';
    if (typeof FileSystem.readAsStringAsync === 'function' && file.uri) {
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: encoding as never,
      });
      return decodeBase64ToUint8(base64);
    }
    return null;
  } catch (err) {
    if (__DEV__) {
      console.warn('[squadSheet.service] Lecture locale des octets PDF impossible:', err);
    }
    return null;
  }
}

/**
 * Dépose puis convertit.
 * Tente d'abord l'extracteur local hors-ligne, puis le serveur si nécessaire.
 */
export async function extractSquadSheetCsv(params: {
  uid: string;
  file: UploadFileInput & { file?: Blob };
}): Promise<SquadSheetExtraction> {
  // 1. D'abord tenter l'extraction locale autonome (ultra-rapide et insensible aux pannes cloud)
  let localIsScanned = false;
  let localPageCount = 1;
  const localBytes = await readPdfBytesLocally(params.file);

  if (localBytes && localBytes.length > 0) {
    try {
      const extracted = extractPdfTextClient(localBytes);
      localPageCount = extracted.pageCount;
      localIsScanned = extracted.isScannedImageOnly;

      if (extracted.hasText) {
        const converted = convertExtractedTextToSquadCsv(extracted.text);
        if (converted.rowCount > 0 && converted.csv.trim()) {
          return {
            csv: converted.csv,
            rows: converted.rowCount,
            columns: ['N° Licence', 'Nom', 'Prénom', 'Catégorie', 'Statut médical', 'Date de naissance'],
            pages: extracted.pageCount,
            warnings: [],
          };
        }
      }
    } catch (localErr) {
      if (__DEV__) {
        console.warn('[squadSheet.service] Échec extracteur local, repli serveur:', localErr);
      }
    }
  }

  // 2. Si l'extraction locale n'a pas suffi, tenter le serveur Cloud Function si configuré
  if (params.uid && params.uid !== 'anonymous-coach') {
    try {
      const uploaded = await storageService.uploadSquadSheet(params.uid, params.file);
      const result = await callFunction<
        { storagePath: string },
        Partial<SquadSheetExtraction>
      >(SQUAD_SHEET_FUNCTION, { storagePath: uploaded.path });
      const serverExtraction = normalizeExtraction(result);
      if (serverExtraction.csv.trim().length > 0 && serverExtraction.rows > 0) {
        return serverExtraction;
      }
      if (serverExtraction.warnings.length > 0) {
        return serverExtraction;
      }
    } catch (cloudErr) {
      if (__DEV__) {
        console.warn('[squadSheet.service] Échec serveur:', cloudErr);
      }
    }
  }

  // 3. Si aucun texte n'a pu être extrait ni en local ni sur le serveur
  return {
    csv: '',
    rows: 0,
    columns: [],
    pages: localPageCount,
    warnings: [
      localIsScanned
        ? 'Document PDF sans texte sélectionnable (document scanné ou image). Préférez l’export CSV Footclubs officiel ou utilisez l’onglet Copier-coller.'
        : 'Document PDF sans texte exploitable (scan ou image). Préférez un export CSV Footclubs officiel ou utilisez l’onglet Copier-coller.',
    ],
  };
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
