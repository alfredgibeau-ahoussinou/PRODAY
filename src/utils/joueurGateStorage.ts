import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Gender } from '../models/User';
import type { JoueurAgeGroup } from './joueurExperienceTheme';
import {
  ageYearsAsOf,
  isValidPlayerBirthDate,
  joueurAgeGroupFromYears,
  parseBirthDateIso,
} from './joueurBirthAge';

const KEY = 'proday_joueur_gate_v1';

export type JoueurGateProfile = {
  gender: Extract<Gender, 'men' | 'women'>;
  /** Toujours recalculé depuis birthDate si présent. */
  ageGroup: JoueurAgeGroup;
  /** Âge courant dérivé (peut diverger si birthDate manquant — legacy). */
  age: number;
  /** Source de vérité pour l’évolution à l’anniversaire. */
  birthDate?: string;
  completedAt: string;
};

/** @deprecated Prefer birthDate — ages synthétiques pour migration legacy. */
export function ageForGroup(group: JoueurAgeGroup): number {
  if (group === 'youth') return 11;
  if (group === 'teen') return 15;
  return 22;
}

/** Recalcule age + ageGroup depuis birthDate (calendrier). */
export function hydrateJoueurGate(
  gate: JoueurGateProfile,
  asOf: Date = new Date(),
): JoueurGateProfile {
  if (gate.birthDate && parseBirthDateIso(gate.birthDate)) {
    const age = ageYearsAsOf(gate.birthDate, asOf);
    if (age != null) {
      return {
        ...gate,
        age,
        ageGroup: joueurAgeGroupFromYears(age),
      };
    }
  }
  return {
    ...gate,
    ageGroup: joueurAgeGroupFromYears(gate.age),
  };
}

export function hasJoueurGateComplete(input: {
  gender?: string | null;
  age?: number | null;
  birthDate?: string | null;
  gate?: JoueurGateProfile | null;
}): boolean {
  const birth =
    input.gate?.birthDate ??
    input.birthDate ??
    null;
  if (birth && isValidPlayerBirthDate(birth).ok) {
    const g = input.gate?.gender ?? input.gender;
    const hasGender = g === 'men' || g === 'women' || g === 'male' || g === 'female';
    return Boolean(hasGender);
  }
  // Legacy : genre + âge sans birthDate → incomplete (forcer collecter birthDate)
  if (input.gate?.gender && input.gate?.birthDate) {
    return isValidPlayerBirthDate(input.gate.birthDate).ok;
  }
  return false;
}

export async function readJoueurGate(uid: string): Promise<JoueurGateProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(`${KEY}:${uid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as JoueurGateProfile;
    return hydrateJoueurGate(parsed);
  } catch {
    return null;
  }
}

export async function writeJoueurGate(
  uid: string,
  profile: Omit<JoueurGateProfile, 'completedAt'>,
): Promise<JoueurGateProfile> {
  const hydrated = hydrateJoueurGate({
    ...profile,
    completedAt: new Date().toISOString(),
  });
  await AsyncStorage.setItem(`${KEY}:${uid}`, JSON.stringify(hydrated));
  return hydrated;
}

export async function clearJoueurGate(uid: string): Promise<void> {
  await AsyncStorage.removeItem(`${KEY}:${uid}`);
}
