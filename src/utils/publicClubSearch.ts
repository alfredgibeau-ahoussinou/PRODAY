/**
 * Normalisation + score recherche annuaire clubs (fautes / partiel).
 */

export function normalizeClubSearchText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Préfixes indexables (2–4) sur tokens du nom / ville / CP / n° FFF. */
export function buildClubSearchPrefixes(
  parts: Array<string | undefined | null>,
  max = 48,
): string[] {
  const out = new Set<string>();
  for (const part of parts) {
    const n = normalizeClubSearchText(part ?? '');
    if (!n) continue;
    if (/^\d{5}$/.test(n) || /^\d{5,}$/.test(n.replace(/\s/g, ''))) {
      const digits = n.replace(/\s/g, '');
      out.add(digits.slice(0, 2));
      out.add(digits.slice(0, 3));
      out.add(digits.slice(0, 5));
      continue;
    }
    for (const token of n.split(' ')) {
      if (token.length < 2) continue;
      const lim = Math.min(4, token.length);
      for (let i = 2; i <= lim; i++) out.add(token.slice(0, i));
      if (token.length >= 5) out.add(token.slice(0, 5));
    }
  }
  return Array.from(out).slice(0, max);
}

export function buildClubSearchHaystack(parts: {
  name?: string;
  city?: string;
  postalCode?: string;
  department?: string;
  fffNumber?: string;
  league?: string;
}): string {
  return normalizeClubSearchText(
    [parts.name, parts.city, parts.postalCode, parts.department, parts.fffNumber, parts.league]
      .filter(Boolean)
      .join(' '),
  );
}

/**
 * Score 0–100 — tolérant aux omissions (US Melun / Melun FC).
 */
export function scorePublicClubMatch(
  query: string,
  haystack: string,
  nameNormalized: string,
): number {
  const q = normalizeClubSearchText(query);
  if (!q || q.length < 2) return 0;
  const h = haystack || nameNormalized;
  if (!h) return 0;

  if (nameNormalized === q) return 100;
  if (nameNormalized.startsWith(q)) return 92;
  if (h.includes(q)) return 80;

  const qTokens = q.split(' ').filter((t) => t.length >= 2);
  if (qTokens.length === 0) return 0;
  let hit = 0;
  for (const t of qTokens) {
    if (h.includes(t)) hit += 1;
  }
  const ratio = hit / qTokens.length;
  if (ratio >= 1) return 72;
  if (ratio >= 0.5) return 55;
  if (hit > 0) return 35;
  return 0;
}

export function pickDirectorySearchPrefix(query: string): string | null {
  const n = normalizeClubSearchText(query);
  if (!n) return null;
  const digits = n.replace(/\s/g, '');
  if (/^\d{2,}$/.test(digits)) return digits.slice(0, Math.min(5, digits.length));
  const first = n.split(' ')[0] ?? '';
  if (first.length >= 2) return first.slice(0, Math.min(4, first.length));
  return null;
}
