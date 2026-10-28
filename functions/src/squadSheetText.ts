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

function parseMultiLineRoster(lines: string[]): Array<{
  license: string;
  nom: string;
  prenom: string;
  category: string;
  medical: string;
  birthDate: string;
}> {
  const isNoise = (s: string) => {
    const l = s.toLowerCase();
    return (
      l.includes('liste licences') ||
      l.includes('généré le') ||
      l.includes('page ') ||
      l.includes('photo') ||
      l.startsWith('club :') ||
      l.includes('dernier club') ||
      l.includes('mutation') ||
      l.includes('fédération') ||
      l.includes('nom\tp') ||
      l.includes('date\tn') ||
      l.includes('sous-catégorie') ||
      l.includes('date enreg') ||
      l.includes('état') ||
      l.includes('etat') ||
      l === 'f' ||
      l === 'm' ||
      l === 'caf' ||
      l === 'e'
    );
  };

  const licenseRegex = /\b([12]\d{9})\b/;
  const dateRegex = /\b(\d{2}\/\d{2}\/\d{4})\b/;
  const players: Array<{
    license: string;
    nom: string;
    prenom: string;
    category: string;
    medical: string;
    birthDate: string;
  }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const licMatch = line.match(licenseRegex);
    if (!licMatch) continue;
    const license = licMatch[1]!;

    let birthDate = '';
    let nameLine = '';
    for (let back = 1; back <= 4 && i - back >= 0; back++) {
      const prev = lines[i - back]!;
      if (!birthDate && dateRegex.test(prev)) {
        birthDate = prev.match(dateRegex)![1]!;
        continue;
      }
      if (!nameLine && !isNoise(prev) && !dateRegex.test(prev) && !licenseRegex.test(prev)) {
        nameLine = prev;
      }
    }

    let category = '';
    let medical = 'Valide';
    for (let fwd = 1; fwd <= 4 && i + fwd < lines.length; fwd++) {
      const next = lines[i + fwd]!;
      if (!category && (/U\d+|Senior|Vétéran|Féminine|Libre/i.test(next) || next.includes('/'))) {
        category = next.replace(/\s+/g, ' ').trim();
      }
      if (next.toLowerCase().includes('validée') || next.toLowerCase().includes('apte')) {
        medical = 'Valide';
      }
    }

    let nom = '';
    let prenom = '';
    if (nameLine.includes('\t')) {
      const parts = nameLine.split('\t').map((s) => s.trim()).filter(Boolean);
      nom = parts[0] || '';
      prenom = parts.slice(1).join(' ');
    } else {
      const parts = nameLine.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        nom = parts[0] || '';
        prenom = parts.slice(1).join(' ');
      } else {
        nom = nameLine;
      }
    }

    if (nom || prenom) {
      players.push({ license, nom, prenom, birthDate, category, medical });
    }
  }
  return players;
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

  const multiPlayers = parseMultiLineRoster(lines);
  if (multiPlayers.length >= 2) {
    const columns = ['N° Licence', 'Nom', 'Prénom', 'Catégorie', 'Statut médical', 'Date de naissance'];
    const csvRows = [
      columns.join(';'),
      ...multiPlayers.map((p) => `${p.license};${p.nom};${p.prenom};${p.category};${p.medical};${p.birthDate}`),
    ];
    return {
      csv: csvRows.join('\n'),
      rows: multiPlayers.length,
      columns,
      warnings,
    };
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
