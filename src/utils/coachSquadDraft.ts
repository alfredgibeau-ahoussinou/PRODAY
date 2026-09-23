/**
 * Brouillon de composition — persistance locale, par équipe.
 *
 * Le coach doit pouvoir quitter l'écran sans perdre son onze. On stocke donc
 * **des identifiants**, jamais des objets joueurs : si un joueur quitte
 * l'effectif, le brouillon reste lisible et le cran devient simplement libre.
 *
 * `normalizeSquadDraft` est volontairement tolérant : il ignore les inconnus,
 * supprime les doublons et complète la longueur attendue. Une composition
 * restaurée ne peut donc jamais contenir deux fois le même joueur.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'proday.coach.squad.draft.v1';

export type CoachSquadDraft = {
  format: string;
  formation: string;
  /** Identifiant par cran de terrain (« null » = poste libre). */
  starterIds: (string | null)[];
  /** Ordre du banc retenu par le coach. */
  benchIds: string[];
  savedAt: string;
  /** Horodatage de publication, si la composition a été publiée. */
  publishedAt?: string;
};

export function coachSquadDraftKey(teamKey: string): string {
  return `${PREFIX}:${teamKey || 'default'}`;
}

export function buildSquadDraft(input: {
  format: string;
  formation: string;
  starterIds: (string | null)[];
  benchIds: string[];
  publishedAt?: string;
}): CoachSquadDraft {
  return {
    format: input.format,
    formation: input.formation,
    starterIds: [...input.starterIds],
    benchIds: [...input.benchIds],
    savedAt: new Date().toISOString(),
    ...(input.publishedAt ? { publishedAt: input.publishedAt } : {}),
  };
}

/**
 * Nettoie un brouillon relu : inconnus retirés, doublons interdits, longueur
 * alignée sur le nombre de crans attendu.
 */
export function normalizeSquadDraft(
  raw: unknown,
  rosterIds: string[],
  slotCount: number,
): CoachSquadDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<CoachSquadDraft>;
  const roster = new Set(rosterIds);
  const used = new Set<string>();

  const starterIds = Array.from({ length: Math.max(0, slotCount) }, (_, index) => {
    const candidate = value.starterIds?.[index];
    if (typeof candidate !== 'string' || !roster.has(candidate) || used.has(candidate)) return null;
    used.add(candidate);
    return candidate;
  });

  const benchIds = (Array.isArray(value.benchIds) ? value.benchIds : []).filter(
    (id): id is string => typeof id === 'string' && roster.has(id) && !used.has(id),
  );

  return {
    format: typeof value.format === 'string' ? value.format : '11v11',
    formation: typeof value.formation === 'string' ? value.formation : '4-3-3',
    starterIds,
    benchIds,
    savedAt: typeof value.savedAt === 'string' ? value.savedAt : new Date().toISOString(),
    ...(typeof value.publishedAt === 'string' ? { publishedAt: value.publishedAt } : {}),
  };
}

export async function loadCoachSquadDraft(
  teamKey: string,
  rosterIds: string[],
  slotCount: number,
): Promise<CoachSquadDraft | null> {
  try {
    const stored = await AsyncStorage.getItem(coachSquadDraftKey(teamKey));
    if (!stored) return null;
    return normalizeSquadDraft(JSON.parse(stored), rosterIds, slotCount);
  } catch {
    return null;
  }
}

export async function saveCoachSquadDraft(
  teamKey: string,
  draft: CoachSquadDraft,
): Promise<void> {
  await AsyncStorage.setItem(coachSquadDraftKey(teamKey), JSON.stringify(draft));
}

export function squadDraftIsEmpty(draft: CoachSquadDraft | null): boolean {
  if (!draft) return true;
  return draft.starterIds.every((id) => id === null) && draft.benchIds.length === 0;
}
