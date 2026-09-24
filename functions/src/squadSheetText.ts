/**
 * Mise en forme d'une feuille d'équipe extraite d'un PDF.
 *
 * Une feuille FFF / FootClubs imprimée ne contient pas de séparateurs : les
 * colonnes sont alignées à l'œil, le texte extrait arrive donc avec des espaces.
 * Ce module **ne devine pas** les joueurs : il rend le tableau lisible en
 * `;`-séparé avec un en-tête, puis le client le relit avec le parseur de
 * licences déjà utilisé par le pôle Club (`parseFootclubsCsv`). Une seule
 * implémentation du mapping de colonnes pour les deux pôles.
 *
 * Quand l'en-tête du PDF n'est pas reconnaissable, les colonnes sont **déduites
 * de leur contenu** (licence, email, date, téléphone) et un avertissement est
 * remonté : le coach voit l'aperçu et garde la main.
 */

export type SheetTable = {
  /** Tableau `;`-séparé, en-tête inclus, directement relisible par le client. */
  csv: string;
  /** Nombre de lignes joueur (hors en-tête). */
  rows: number;
  columns: string[];
  warnings: string[];
};

const HEADER_KEYWORDS = [
  'nom',
  'prenom',
  'licence',
  'license',
  'joueur',
  'categorie',
  'name',
  'firstname',
  'lastname',
];

const MAX_ROWS = 400;

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Découpe une ligne en cellules en testant les séparateurs du plus strict au plus souple. */
export function splitCells(line: string): string[] {
  if (line.includes('\t')) {
    return line.split('\t').map((cell) => cell.trim());
  }
  if (line.includes(';')) {
    return line.split(';').map((cell) => cell.trim());
  }
  if ((line.match(/,/g) ?? []).length >= 2) {
    return line.split(',').map((cell) => cell.trim());
  }
  const wide = line.split(/\s{2,}/).map((cell) => cell.trim()).filter(Boolean);
  if (wide.length >= 3) return wide;
  return line.split(/\s+/).map((cell) => cell.trim()).filter(Boolean);
}

function looksLikeHeader(cells: string[]): boolean {
  const normalized = cells.map(normalize);
  return normalized.some((cell) => HEADER_KEYWORDS.some((keyword) => cell === keyword || cell.includes(keyword)));
}

function isLicenceLike(value: string): boolean {
  const compact = value.replace(/\s+/g, '');
  if (!/^[A-Z0-9]{6,12}$/i.test(compact)) return false;
  return (compact.match(/\d/g) ?? []).length >= 5;
}

function isEmailLike(value: string): boolean {
  return /@/.test(value);
}

function isDateLike(value: string): boolean {
  return /^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/.test(value.trim());
}

function isPhoneLike(value: string): boolean {
  const compact = value.replace(/[\s.]/g, '');
  return /^\+?\d{9,15}$/.test(compact);
}

function dominantCellCount(lines: string[]): number {
  const counts = new Map<number, number>();
  for (const line of lines) {
    const size = splitCells(line).length;
    counts.set(size, (counts.get(size) ?? 0) + 1);
  }
  let best = 1;
  let bestCount = -1;
  for (const [size, occurrences] of counts) {
    if (occurrences > bestCount || (occurrences === bestCount && size > best)) {
      best = size;
      bestCount = occurrences;
    }
  }
  return best;
}

/**
 * Déduit un en-tête à partir du contenu quand le PDF n'en fournit pas.
 * Les deux premières cellules textuelles deviennent `Nom` puis `Prenom`, dans
 * l'ordre d'apparition — jamais l'inverse, une feuille FFF liste NOM avant prénom.
 */
export function inferHeader(rows: string[][]): string[] {
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const header = Array.from({ length: width }, (_, index) => `Colonne ${index + 1}`);
  const claimed = new Set<number>();

  rows.slice(0, 12).forEach((row) => {
    row.forEach((cell, index) => {
      if (!cell || claimed.has(index)) return;
      if (isLicenceLike(cell)) {
        header[index] = 'Licence';
        claimed.add(index);
        return;
      }
      if (isEmailLike(cell)) {
        header[index] = 'Email';
        claimed.add(index);
        return;
      }
      if (isDateLike(cell)) {
        header[index] = 'Naissance';
        claimed.add(index);
        return;
      }
      if (isPhoneLike(cell)) {
        header[index] = 'Telephone';
        claimed.add(index);
      }
    });
  });

  let nameSlots = 0;
  rows.slice(0, 12).forEach((row) => {
    row.forEach((cell, index) => {
      if (!cell || claimed.has(index) || nameSlots >= 2) return;
      const letters = (cell.match(/[A-Za-z\u00C0-\u024F]/g) ?? []).length;
      if (letters < 2) return;
      header[index] = nameSlots === 0 ? 'Nom' : 'Prenom';
      nameSlots += 1;
      claimed.add(index);
    });
  });

  return header;
}

function escapeCell(value: string): string {
  return /[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function alignRow(cells: string[], width: number): string[] {
  const out = cells.slice(0, width);
  while (out.length < width) out.push('');
  return out;
}

/**
 * Transforme du texte extrait de PDF en tableau relisible par `parseFootclubsCsv`.
 * Ne renvoie jamais une ligne inventée : les lignes non exploitables sont
 * comptées dans les avertissements.
 */
export function buildSheetCsv(pdfText: string): SheetTable {
  const warnings: string[] = [];
  const lines = pdfText
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { csv: '', rows: 0, columns: [], warnings: ['Aucun texte lisible dans le document.'] };
  }

  const headerIndex = lines.findIndex((line) => looksLikeHeader(splitCells(line)));
  const width = dominantCellCount(lines);
  const bodyLines = (headerIndex >= 0 ? lines.slice(headerIndex + 1) : lines).filter(
    (line) => splitCells(line).length >= Math.max(2, Math.floor(width / 2)),
  );

  if (bodyLines.length === 0) {
    return {
      csv: '',
      rows: 0,
      columns: [],
      warnings: ['Aucune ligne de joueur détectée dans le document.'],
    };
  }

  const bodyRows = bodyLines.slice(0, MAX_ROWS).map((line) => alignRow(splitCells(line), width));

  let header: string[];
  if (headerIndex >= 0) {
    const raw = splitCells(lines[headerIndex]!);
    header = alignRow(raw, width).map((cell, index) => cell || `Colonne ${index + 1}`);
  } else {
    header = inferHeader(bodyRows);
    warnings.push(
      'En-tête absent : les colonnes ont été déduites du contenu. Vérifiez l’aperçu avant d’importer.',
    );
  }

  const hasName = header.some((cell) => {
    const key = normalize(cell);
    return key === 'nom' || key.includes('nom') || key.includes('name');
  });
  if (!hasName) {
    return {
      csv: '',
      rows: 0,
      columns: header,
      warnings: [...warnings, 'Impossible d’identifier une colonne de nom : préférez un export CSV.'],
    };
  }

  if (bodyLines.length > MAX_ROWS) {
    warnings.push(`Seules les ${MAX_ROWS} premières lignes ont été conservées.`);
  }

  const csv = [header, ...bodyRows].map((row) => row.map(escapeCell).join(';')).join('\n');
  return { csv, rows: bodyRows.length, columns: header, warnings };
}
