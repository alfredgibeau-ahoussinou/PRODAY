/**
 * Parseur de fichiers CSV Footclubs FFF & standard ProDay pour l'import de licences.
 */

export interface ParsedLicenseRow {
  licenseNumber: string;
  lastName: string;
  firstName: string;
  displayName: string;
  birthDate?: string;
  category?: string;
  email?: string;
  phone?: string;
  medicalValid: boolean;
  raw: Record<string, string>;
}

export interface FootclubsParseResult {
  success: boolean;
  rows: ParsedLicenseRow[];
  errors: string[];
  totalRows: number;
  validRowsCount: number;
}

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Détecte si le séparateur est virgule, point-virgule ou tabulation. */
export function detectCsvDelimiter(headerLine: string): string {
  const semicolons = (headerLine.match(/;/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  const tabs = (headerLine.match(/\t/g) || []).length;

  if (tabs > semicolons && tabs > commas) return '\t';
  if (semicolons >= commas) return ';';
  return ',';
}

/** Découpe une ligne CSV en tenant compte des guillemets. */
export function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parse le contenu texte d'un fichier CSV Footclubs ou standard.
 */
export function parseFootclubsCsv(csvContent: string): FootclubsParseResult {
  const errors: string[] = [];
  const rows: ParsedLicenseRow[] = [];

  if (!csvContent || typeof csvContent !== 'string') {
    return {
      success: false,
      rows: [],
      errors: ['Fichier CSV vide ou invalide.'],
      totalRows: 0,
      validRowsCount: 0,
    };
  }

  const rawLines = csvContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (rawLines.length === 0) {
    return {
      success: false,
      rows: [],
      errors: ['Aucune ligne exploitable dans le fichier.'],
      totalRows: 0,
      validRowsCount: 0,
    };
  }

  const delimiter = detectCsvDelimiter(rawLines[0]);
  const headers = splitCsvLine(rawLines[0], delimiter);
  const normalizedHeaders = headers.map(normalizeHeader);

  // Détection des colonnes clés
  const colLicense = normalizedHeaders.findIndex((h) =>
    h.includes('licence') || h.includes('license') || h === 'num' || h === 'no' || h === 'id',
  );
  const colNom = normalizedHeaders.findIndex((h) =>
    h === 'nom' || h.includes('nom') || h === 'lastname',
  );
  const colPrenom = normalizedHeaders.findIndex((h) =>
    h === 'prenom' || h.includes('prenom') || h === 'firstname',
  );
  const colBirth = normalizedHeaders.findIndex((h) =>
    h.includes('naissance') || h.includes('birth') || h.includes('nele'),
  );
  const colCategory = normalizedHeaders.findIndex((h) =>
    h.includes('categorie') || h.includes('category') || h.includes('equipe'),
  );
  const colEmail = normalizedHeaders.findIndex((h) =>
    h.includes('email') || h.includes('mail') || h.includes('courriel'),
  );
  const colPhone = normalizedHeaders.findIndex((h) =>
    h.includes('tel') || h.includes('phone') || h.includes('mobile'),
  );
  const colMedical = normalizedHeaders.findIndex((h) =>
    h.includes('medical') || h.includes('certificat') || h.includes('sante'),
  );

  if (colNom === -1 && colLicense === -1) {
    return {
      success: false,
      rows: [],
      errors: [
        'En-tête invalide : impossible de trouver la colonne "Nom" ou "Licence". Assurez-vous d\'inclure les en-têtes.',
      ],
      totalRows: rawLines.length - 1,
      validRowsCount: 0,
    };
  }

  for (let i = 1; i < rawLines.length; i++) {
    const line = rawLines[i];
    const cells = splitCsvLine(line, delimiter);

    // Dictionnaire brut
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      raw[h] = cells[idx] ?? '';
    });

    const lastName = (colNom !== -1 ? cells[colNom] : '').trim();
    const firstName = (colPrenom !== -1 ? cells[colPrenom] : '').trim();
    const licenseNumber = (colLicense !== -1 ? cells[colLicense] : '').replace(/\s+/g, '').trim();

    if (!lastName && !firstName && !licenseNumber) {
      // Ligne vide ignorée
      continue;
    }

    if (!lastName && !firstName) {
      errors.push(`Ligne ${i + 1} ignorée : nom et prénom manquants.`);
      continue;
    }

    const displayName = [firstName, lastName].filter(Boolean).join(' ');
    const birthDate = colBirth !== -1 && cells[colBirth] ? cells[colBirth].trim() : undefined;
    const category = colCategory !== -1 && cells[colCategory] ? cells[colCategory].trim() : undefined;
    const email = colEmail !== -1 && cells[colEmail] ? cells[colEmail].trim().toLowerCase() : undefined;
    const phone = colPhone !== -1 && cells[colPhone] ? cells[colPhone].trim() : undefined;

    let medicalValid = false;
    if (colMedical !== -1 && cells[colMedical]) {
      const med = cells[colMedical].toLowerCase();
      medicalValid = med.includes('oui') || med.includes('valid') || med === 'ok' || med === '1' || med === 'true';
    }

    rows.push({
      licenseNumber: licenseNumber || `TEMP-${Date.now().toString().slice(-6)}-${i}`,
      lastName,
      firstName,
      displayName,
      birthDate,
      category,
      email,
      phone,
      medicalValid,
      raw,
    });
  }

  return {
    success: rows.length > 0,
    rows,
    errors,
    totalRows: rawLines.length - 1,
    validRowsCount: rows.length,
  };
}

/** Exporte une liste de joueurs / licenciés au format CSV standard. */
export function exportLicensesToCsv(
  players: {
    displayName?: string;
    email?: string;
    licenseNumber?: string;
    category?: string;
    verified?: boolean;
  }[],
): string {
  const headers = ['Licence FFF', 'Nom Complet', 'Email', 'Catégorie', 'Statut'];
  const lines: string[] = [headers.join(';')];

  players.forEach((p) => {
    const row = [
      `"${p.licenseNumber || 'N/C'}"`,
      `"${p.displayName || 'Joueur'}"`,
      `"${p.email || ''}"`,
      `"${p.category || 'Général'}"`,
      p.verified ? '"Valide"' : '"À vérifier"',
    ];
    lines.push(row.join(';'));
  });

  return lines.join('\r\n');
}
