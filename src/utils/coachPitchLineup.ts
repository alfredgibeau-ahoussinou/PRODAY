import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isCoachPitchFormation,
  pitchSlotCount,
  type CoachPitchFormation,
} from './formationPitch';

const STORAGE_PREFIX = 'proday.coach.sporteasy.lineup.v1:';

export type CoachPitchLineup = {
  formation: CoachPitchFormation;
  starterUids: (string | null)[];
};

export function emptyCoachPitchLineup(
  formation: CoachPitchFormation = '4-3-3',
): CoachPitchLineup {
  return {
    formation,
    starterUids: Array.from({ length: pitchSlotCount(formation) }, () => null),
  };
}

export function normalizeCoachPitchLineup(
  raw: Partial<CoachPitchLineup> | null | undefined,
  rosterUids: string[],
): CoachPitchLineup {
  const formation = isCoachPitchFormation(raw?.formation ?? '')
    ? raw!.formation!
    : '4-3-3';
  const n = pitchSlotCount(formation);
  const roster = new Set(rosterUids);
  const seen = new Set<string>();
  const starterUids = Array.from({ length: n }, (_, i) => {
    const uid = raw?.starterUids?.[i];
    if (!uid || !roster.has(uid) || seen.has(uid)) return null;
    seen.add(uid);
    return uid;
  });
  return { formation, starterUids };
}

export function benchUidsForLineup(
  lineup: CoachPitchLineup,
  rosterUids: string[],
): string[] {
  const onPitch = new Set(lineup.starterUids.filter((uid): uid is string => Boolean(uid)));
  return rosterUids.filter((uid) => !onPitch.has(uid));
}

export function startersPlacedCount(lineup: CoachPitchLineup): number {
  return lineup.starterUids.filter(Boolean).length;
}

/** Premier chargement : remplit le XI depuis l’effectif si la compo est vide. */
export function autofillCoachPitchLineup(
  lineup: CoachPitchLineup,
  rosterUids: string[],
): CoachPitchLineup {
  if (startersPlacedCount(lineup) > 0 || rosterUids.length === 0) return lineup;
  const n = pitchSlotCount(lineup.formation);
  return {
    ...lineup,
    starterUids: Array.from({ length: n }, (_, i) => rosterUids[i] ?? null),
  };
}

/** Place un joueur (banc ou terrain) sur un cran ; échange si déjà titulaire. */
export function assignUidToSlot(
  lineup: CoachPitchLineup,
  uid: string,
  slotIndex: number,
): CoachPitchLineup {
  if (slotIndex < 0 || slotIndex >= lineup.starterUids.length) return lineup;
  const starterUids = [...lineup.starterUids];
  const prevIndex = starterUids.indexOf(uid);
  const displaced = starterUids[slotIndex];
  starterUids[slotIndex] = uid;
  if (prevIndex >= 0 && prevIndex !== slotIndex) {
    starterUids[prevIndex] = displaced ?? null;
  }
  return { ...lineup, starterUids };
}

export function clearPitchSlot(
  lineup: CoachPitchLineup,
  slotIndex: number,
): CoachPitchLineup {
  if (slotIndex < 0 || slotIndex >= lineup.starterUids.length) return lineup;
  const starterUids = [...lineup.starterUids];
  starterUids[slotIndex] = null;
  return { ...lineup, starterUids };
}

export function swapPitchSlots(
  lineup: CoachPitchLineup,
  a: number,
  b: number,
): CoachPitchLineup {
  if (a === b) return lineup;
  if (a < 0 || b < 0 || a >= lineup.starterUids.length || b >= lineup.starterUids.length) {
    return lineup;
  }
  const starterUids = [...lineup.starterUids];
  const tmp = starterUids[a];
  starterUids[a] = starterUids[b];
  starterUids[b] = tmp;
  return { ...lineup, starterUids };
}

export function changeCoachPitchFormation(
  lineup: CoachPitchLineup,
  next: CoachPitchFormation,
): CoachPitchLineup {
  if (next === lineup.formation) return lineup;
  const n = pitchSlotCount(next);
  const starterUids = Array.from({ length: n }, (_, i) => lineup.starterUids[i] ?? null);
  return { formation: next, starterUids };
}

export function coachPitchStorageKey(teamId: string): string {
  return `${STORAGE_PREFIX}${teamId}`;
}

export async function loadCoachPitchLineup(
  teamId: string,
): Promise<Partial<CoachPitchLineup> | null> {
  try {
    const raw = await AsyncStorage.getItem(coachPitchStorageKey(teamId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CoachPitchLineup>;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveCoachPitchLineup(
  teamId: string,
  lineup: CoachPitchLineup,
): Promise<void> {
  try {
    await AsyncStorage.setItem(coachPitchStorageKey(teamId), JSON.stringify(lineup));
  } catch {
    /* ignore quota / private mode */
  }
}
