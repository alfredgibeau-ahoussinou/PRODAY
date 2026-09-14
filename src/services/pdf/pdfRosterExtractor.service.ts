/**
 * ProDay - Service d'extraction et de parsing de PDF structurés (Section 28)
 * Traite les listes d'effectif, feuilles de match FFF et fiches tactiques PDF
 */

export type TacticalPositionCategory = 'GK' | 'DEF' | 'MID' | 'ATT';

export interface ExtractedPlayer {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  number?: number;
  category?: string;
  positionCategory?: TacticalPositionCategory;
  positionLabel?: string;
  licenseNumber?: string;
  isDuplicate?: boolean;
  duplicateWithPlayerId?: string;
  duplicateReason?: string;
  status: 'ready' | 'needs_review' | 'duplicate';
  isStarter?: boolean;
}

export interface ExtractedTacticsInfo {
  matchTitle?: string;
  matchDate?: string;
  formation?: '4-3-3' | '4-2-3-1' | '4-4-2' | '3-5-2' | '3-4-3' | '5-3-2';
  starters: ExtractedPlayer[];
  substitutes: ExtractedPlayer[];
}

export interface ExistingSquadPlayer {
  id: string;
  name: string;
  number?: number;
  licenseNumber?: string;
}

export interface PdfRosterParseResult {
  fileName: string;
  parsedAt: string;
  players: ExtractedPlayer[];
  tactics?: ExtractedTacticsInfo;
  confidence: number;
  duplicatesCount: number;
  rawTextSample?: string;
}

/**
 * Normalise une chaîne pour comparaison souple (accents, casse, ponctuation).
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = [];

  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // suppression
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  return dp[m][n];
}

/**
 * Calcule un score de similarité entre 0 et 1 (1 = identique).
 */
export function stringSimilarity(a: string, b: string): number {
  const normA = normalizeString(a);
  const normB = normalizeString(b);
  if (normA === normB) return 1.0;
  if (!normA.length || !normB.length) return 0;

  // Inclusion de nom / prénom (ex: "Kylian Mbappe" et "Kylian Mbappe Gauche")
  if (normA.includes(normB) || normB.includes(normA)) {
    const minLen = Math.min(normA.length, normB.length);
    const maxLen = Math.max(normA.length, normB.length);
    if (minLen / maxLen >= 0.5) {
      return 0.92;
    }
  }

  const maxLen = Math.max(normA.length, normB.length);
  const dist = levenshteinDistance(normA, normB);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Détecte la catégorie de poste à partir d'un libellé ou token.
 */
export function detectPositionCategory(token: string): {
  category?: TacticalPositionCategory;
  label: string;
} {
  const t = normalizeString(token);

  // Gardien
  if (/\b(gk|gb|gardien|goalkeeper|goal|gardienne)\b/.test(t)) {
    return { category: 'GK', label: 'Gardien' };
  }
  // Défenseur
  if (/\b(def|defenseur|defenseuse|dc|dl|dg|dd|cb|lb|rb|lateral|laterale|arriere)\b/.test(t)) {
    return { category: 'DEF', label: 'Défenseur' };
  }
  // Milieu
  if (/\b(mid|milieu|milieux|mc|mdc|moc|mg|md|cm|cdm|cam|rm|lm)\b/.test(t)) {
    return { category: 'MID', label: 'Milieu' };
  }
  // Attaquant
  if (/\b(att|attaquant|attaquante|buteur|buteuse|bu|ac|ag|ad|st|cf|lw|rw|avant|pointe)\b/.test(t)) {
    return { category: 'ATT', label: 'Attaquant' };
  }

  return { label: token };
}

/**
 * Détecte une formation tactique dans le texte (e.g. 4-3-3, 4-2-3-1, etc.).
 */
export function detectFormation(text: string): ExtractedTacticsInfo['formation'] | undefined {
  const match = text.match(/\b(4-3-3|4-2-3-1|4-4-2|3-5-2|3-4-3|5-3-2)\b/);
  if (match) {
    return match[1] as ExtractedTacticsInfo['formation'];
  }
  return undefined;
}

/**
 * Parse une ligne de texte représentant un joueur.
 * Formats gérés :
 * - "1. Thomas DUPONT (GK) - Lic: 254199"
 * - "N° 10 MBAPPE Kylian Attaquant"
 * - "Antoine GRIEZMANN, 7, Milieu"
 * - "9 - Olivier GIROUD"
 */
export function parsePlayerLine(line: string, index: number): ExtractedPlayer | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 3) return null;

  // Ignorer les lignes de ponctuation pure (ex: '---', '===')
  if (/^[\s\-_=*#|:.]+$/.test(trimmed)) {
    return null;
  }

  // Ignorer les entêtes évidentes de tableau ou sections
  const headerCheck = normalizeString(trimmed);
  if (
    headerCheck.startsWith('nom prenom') ||
    headerCheck.startsWith('numero') ||
    headerCheck.startsWith('feuille de match') ||
    headerCheck.startsWith('composition') ||
    headerCheck.startsWith('remplacant') ||
    headerCheck.startsWith('rencontre') ||
    headerCheck.startsWith('systeme tactique') ||
    headerCheck.startsWith('equipe')
  ) {
    return null;
  }

  let text = trimmed;
  let jerseyNumber: number | undefined;
  let licenseNumber: string | undefined;
  let detectedCat: TacticalPositionCategory | undefined;
  let positionLabel = 'Joueur';

  // Recherche numéro de licence (format FFF : 7 à 10 chiffres, parfois précédé de Lic/Licence)
  const licMatch = text.match(/(?:lic(?:ence)?[:.\s]*|[#\b])(\d{7,10})\b/i);
  if (licMatch) {
    licenseNumber = licMatch[1];
    text = text.replace(licMatch[0], ' ');
  }

  // Recherche numéro de maillot : "N° 10", "10 -", "#10", ou en tout début de ligne "1. ", "10 "
  const numMatch = text.match(/^(?:n[°o]?\s*|#\s*)?(\d{1,2})(?:[\s.\-)]+)/i);
  if (numMatch) {
    const parsedNum = parseInt(numMatch[1], 10);
    if (parsedNum >= 1 && parsedNum <= 99) {
      jerseyNumber = parsedNum;
      text = text.replace(numMatch[0], ' ');
    }
  } else {
    // Numéro isolé avec tiret ou virgule à l'intérieur
    const inlineNumMatch = text.match(/[,|\s]+(?:n[°o]?\s*|#\s*)?(\d{1,2})(?:[,|\s]+|$)/i);
    if (inlineNumMatch) {
      const parsedNum = parseInt(inlineNumMatch[1], 10);
      if (parsedNum >= 1 && parsedNum <= 99) {
        jerseyNumber = parsedNum;
        text = text.replace(inlineNumMatch[0], ' ');
      }
    }
  }

  // Détection du poste
  const words = text.split(/[\s,()\-;:]+/).filter(Boolean);
  for (const word of words) {
    const res = detectPositionCategory(word);
    if (res.category) {
      detectedCat = res.category;
      positionLabel = res.label;
      text = text.replace(new RegExp(`\\b${word}\\b`, 'i'), ' ');
      break;
    }
  }

  // Déduction du poste par défaut basé sur le numéro de maillot si non spécifié
  if (!detectedCat && jerseyNumber !== undefined) {
    if (jerseyNumber === 1 || jerseyNumber === 16 || jerseyNumber === 30) {
      detectedCat = 'GK';
      positionLabel = 'Gardien';
    } else if (jerseyNumber >= 2 && jerseyNumber <= 5) {
      detectedCat = 'DEF';
      positionLabel = 'Défenseur';
    } else if (jerseyNumber >= 6 && jerseyNumber <= 8) {
      detectedCat = 'MID';
      positionLabel = 'Milieu';
    } else if (jerseyNumber >= 9 && jerseyNumber <= 11) {
      detectedCat = 'ATT';
      positionLabel = 'Attaquant';
    }
  }

  // Nettoyage final du nom
  const cleanedName = text
    .replace(/[()[\]{}_|/\\#*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanedName || cleanedName.length < 2) {
    return null;
  }

  // Séparation Prénom / Nom approximative
  const nameParts = cleanedName.split(' ');
  let firstName: string | undefined;
  let lastName: string | undefined;

  if (nameParts.length === 1) {
    lastName = nameParts[0];
  } else if (nameParts.length >= 2) {
    // Si une partie est toute en majuscules, c'est généralement le nom de famille en France
    const allUpperPart = nameParts.find((p) => p.length > 1 && p === p.toUpperCase());
    if (allUpperPart) {
      lastName = allUpperPart;
      firstName = nameParts.filter((p) => p !== allUpperPart).join(' ');
    } else {
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    }
  }

  return {
    id: `extracted-${index}-${Date.now()}`,
    fullName: cleanedName,
    firstName,
    lastName,
    number: jerseyNumber,
    positionCategory: detectedCat,
    positionLabel,
    licenseNumber,
    status: 'ready',
    isStarter: index < 11,
  };
}

/**
 * Analyse le texte brut complet extrait d'un PDF d'effectif ou de feuille de match.
 */
export function parseRosterText(
  rawText: string,
  existingPlayers: ExistingSquadPlayer[] = [],
  fileName = 'feuille_de_match.pdf'
): PdfRosterParseResult {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const formation = detectFormation(rawText);

  const players: ExtractedPlayer[] = [];
  let duplicatesCount = 0;

  lines.forEach((line, idx) => {
    const parsed = parsePlayerLine(line, players.length);
    if (!parsed) return;

    // Rapprochement et détection de doublon avec l'effectif existant
    for (const existing of existingPlayers) {
      // 1. Vérification par licence si disponible
      if (
        parsed.licenseNumber &&
        existing.licenseNumber &&
        parsed.licenseNumber === existing.licenseNumber
      ) {
        parsed.isDuplicate = true;
        parsed.duplicateWithPlayerId = existing.id;
        parsed.duplicateReason = `Licence identique (#${existing.licenseNumber})`;
        parsed.status = 'duplicate';
        duplicatesCount++;
        break;
      }

      // 2. Vérification par nom avec similarité de Levenshtein
      const sim = stringSimilarity(parsed.fullName, existing.name);
      if (sim >= 0.85) {
        parsed.isDuplicate = true;
        parsed.duplicateWithPlayerId = existing.id;
        parsed.duplicateReason = `Nom très proche de "${existing.name}" (${Math.round(sim * 100)}% similarité)`;
        parsed.status = 'duplicate';
        duplicatesCount++;
        break;
      }

      // 3. Même numéro de maillot ET au moins 60% de similarité
      if (
        parsed.number &&
        existing.number &&
        parsed.number === existing.number &&
        sim >= 0.6
      ) {
        parsed.isDuplicate = true;
        parsed.duplicateWithPlayerId = existing.id;
        parsed.duplicateReason = `Même N° ${parsed.number} et profil proche "${existing.name}"`;
        parsed.status = 'needs_review';
        duplicatesCount++;
        break;
      }
    }

    players.push(parsed);
  });

  const starters = players.slice(0, 11);
  const substitutes = players.slice(11);

  // Évaluation de la confiance de l'extraction
  let confidence = 0.5;
  if (players.length >= 11) confidence += 0.3;
  if (players.some((p) => p.positionCategory)) confidence += 0.1;
  if (formation) confidence += 0.1;

  const tactics: ExtractedTacticsInfo = {
    formation: formation || '4-3-3',
    starters,
    substitutes,
    matchTitle: fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
    matchDate: new Date().toISOString().split('T')[0],
  };

  return {
    fileName,
    parsedAt: new Date().toISOString(),
    players,
    tactics,
    confidence: Math.min(1.0, confidence),
    duplicatesCount,
    rawTextSample: rawText.slice(0, 300),
  };
}

/**
 * Exemple de jeu de données réaliste d'une feuille de match FFF pour démo et tests.
 */
export const SAMPLE_FFF_MATCH_SHEET = `
FEUILLE DE MATCH OFFICIELLE FFF
Rencontre : AS ProDay vs Étoile Sportive
Système tactique : 4-3-3

COMPOSITION DE DÉPART :
1. Hugo LLORIS (GK / Gardien) Lic. 2541009101
2. Jules KOUNDE (Défenseur) Lic. 2541009102
4. Raphael VARANE (DC / Défenseur) Lic. 2541009104
5. Presnel KIMPEMBE (Défenseur) Lic. 2541009105
3. Theo HERNANDEZ (Latéral Gauche) Lic. 2541009103
6. Paul POGBA (Milieu défensif) Lic. 2541009106
8. Aurelien TCHOUAMENI (Milieu) Lic. 2541009108
7. Antoine GRIEZMANN (MOC / Milieu) Lic. 2541009107
11. Ousmane DEMBELE (Attaquant Droit) Lic. 2541009111
9. Olivier GIROUD (Buteur / Attaquant) Lic. 2541009109
10. Kylian MBAPPE (Attaquant Gauche) Lic. 2541009110

REMPLAÇANTS :
16. Mike MAIGNAN (GB / Gardien) Lic. 2541009116
12. Benjamin PAVARD (Défenseur) Lic. 2541009112
14. Adrien RABIOT (Milieu) Lic. 2541009114
15. Eduardo CAMAVINGA (Milieu) Lic. 2541009115
18. Marcus THURAM (Attaquant) Lic. 2541009118
20. Kingsley COMAN (Attaquant) Lic. 2541009120
`;
