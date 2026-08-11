import type { JoueurAgeGroup } from './joueurExperienceTheme';

/** Date de naissance stockée en ISO calendaire `YYYY-MM-DD`. */
export type BirthDateIso = string;

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseBirthDateIso(raw: string | null | undefined): Date | null {
  if (!raw || typeof raw !== 'string') return null;
  const m = raw.trim().match(ISO_RE);
  if (!m) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(y, mo, day);
  if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== day) return null;
  return d;
}

export function toBirthDateIso(year: number, month: number, day: number): BirthDateIso | null {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function ageYearsAsOf(
  birth: Date | BirthDateIso,
  asOf: Date = new Date(),
): number | null {
  const d = birth instanceof Date ? birth : parseBirthDateIso(birth);
  if (!d) return null;
  let age = asOf.getFullYear() - d.getFullYear();
  const m = asOf.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && asOf.getDate() < d.getDate())) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
}

export function joueurAgeGroupFromYears(age: number | null | undefined): JoueurAgeGroup {
  if (age == null || !Number.isFinite(age)) return 'adult';
  if (age < 13) return 'youth';
  if (age < 18) return 'teen';
  return 'adult';
}

export function resolveJoueurAgeGroupFromBirth(
  birthDate: string | Date | null | undefined,
  asOf: Date = new Date(),
): JoueurAgeGroup {
  const age = birthDate ? ageYearsAsOf(birthDate, asOf) : null;
  return joueurAgeGroupFromYears(age);
}

/**
 * Date de naissance synthétique pour basculer un cockpit admin
 * (Monde -13 / 13–17 / 18+) sans saisir la date à la main.
 */
export function birthDateIsoForAgeGroup(
  group: JoueurAgeGroup,
  opts?: { asOf?: Date; month?: number; day?: number },
): BirthDateIso {
  const asOf = opts?.asOf ?? new Date();
  const years = group === 'youth' ? 11 : group === 'teen' ? 15 : 22;
  const month =
    opts?.month != null && opts.month >= 1 && opts.month <= 12 ? opts.month : 6;
  // Jour plafonné à 28 pour rester valide tous mois.
  const day =
    opts?.day != null && opts.day >= 1 && opts.day <= 28 ? opts.day : 15;
  const year = asOf.getFullYear() - years;
  return toBirthDateIso(year, month, day) ?? `${year}-06-15`;
}

/**
 * Prochaine date où le groupe d’âge change (13e ou 18e anniversaire),
 * ou null si déjà adulte / date invalide.
 */
export function nextAgeGroupTransitionDate(
  birthDate: string | Date | null | undefined,
  asOf: Date = new Date(),
): Date | null {
  const d = birthDate instanceof Date ? birthDate : parseBirthDateIso(birthDate ?? undefined);
  if (!d) return null;
  const age = ageYearsAsOf(d, asOf);
  if (age == null || age >= 18) return null;
  const targetAge = age < 13 ? 13 : 18;
  const transition = new Date(d.getFullYear() + targetAge, d.getMonth(), d.getDate());
  if (transition.getTime() <= asOf.getTime()) {
    // Sécurité calendaire : si on est le jour J après minuit, déjà basculé
    return null;
  }
  return transition;
}

export function isValidPlayerBirthDate(
  birthDate: string | null | undefined,
  asOf: Date = new Date(),
): { ok: true; age: number; ageGroup: JoueurAgeGroup } | { ok: false; reason: string } {
  const d = parseBirthDateIso(birthDate ?? undefined);
  if (!d) return { ok: false, reason: 'Date de naissance invalide.' };
  if (d.getTime() > asOf.getTime()) {
    return { ok: false, reason: 'La date de naissance ne peut pas être dans le futur.' };
  }
  const age = ageYearsAsOf(d, asOf);
  if (age == null) return { ok: false, reason: 'Date de naissance invalide.' };
  if (age < 5) return { ok: false, reason: 'Âge minimum : 5 ans.' };
  if (age > 80) return { ok: false, reason: 'Vérifie la date de naissance.' };
  return { ok: true, age, ageGroup: joueurAgeGroupFromYears(age) };
}

/** Libellés univers — trois espaces distincts. */
export const JOUEUR_UNIVERSE_LABELS: Record<
  JoueurAgeGroup,
  { short: string; title: string; range: string }
> = {
  youth: {
    short: 'Univers jeu',
    title: 'Monde -13',
    range: 'Moins de 13 ans',
  },
  teen: {
    short: 'Univers ado',
    title: 'Monde 13–17',
    range: '13 à 17 ans',
  },
  adult: {
    short: 'Univers pro',
    title: 'Monde 18+',
    range: '18 ans et plus',
  },
};
