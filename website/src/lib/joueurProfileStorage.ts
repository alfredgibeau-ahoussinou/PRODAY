/**
 * Persistance légère du profil joueur sur le site (session navigateur).
 * Rempli par la porte « Qui es-tu ? » puis relu sur /joueur/experience.
 */

import type { JoueurProfileHints } from "@/lib/joueurExperienceTheme";

export const JOUEUR_PROFILE_STORAGE_KEY = "proday_joueur_profile_v1";

export type StoredJoueurProfile = {
  age?: number | null;
  birthDate?: string | null;
  gender?: string | null;
  position?: string | null;
  updatedAt: string;
};

function canUseSession(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function readStoredJoueurProfile(): JoueurProfileHints | null {
  if (!canUseSession()) return null;
  try {
    const raw = sessionStorage.getItem(JOUEUR_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredJoueurProfile;
    return {
      age: typeof parsed.age === "number" ? parsed.age : null,
      birthDate: typeof parsed.birthDate === "string" ? parsed.birthDate : null,
      gender: typeof parsed.gender === "string" ? parsed.gender : null,
      position: typeof parsed.position === "string" ? parsed.position : null,
    };
  } catch {
    return null;
  }
}

export function writeStoredJoueurProfile(hints: JoueurProfileHints): void {
  if (!canUseSession()) return;
  const payload: StoredJoueurProfile = {
    age: hints.age ?? null,
    birthDate:
      hints.birthDate instanceof Date
        ? hints.birthDate.toISOString()
        : hints.birthDate ?? null,
    gender: hints.gender ?? null,
    position: hints.position ?? null,
    updatedAt: new Date().toISOString(),
  };
  try {
    sessionStorage.setItem(JOUEUR_PROFILE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // quota / private mode
  }
}

export function clearStoredJoueurProfile(): void {
  if (!canUseSession()) return;
  try {
    sessionStorage.removeItem(JOUEUR_PROFILE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Fusionne URL (prioritaire) + session pour un thème stable pendant la visite. */
export function mergeJoueurProfileHints(
  fromUrl: JoueurProfileHints,
  fromStore: JoueurProfileHints | null,
): JoueurProfileHints {
  const hasUrl =
    fromUrl.age != null ||
    Boolean(fromUrl.birthDate) ||
    Boolean(fromUrl.gender) ||
    Boolean(fromUrl.position);

  if (!hasUrl) {
    return fromStore ?? {};
  }

  return {
    age: fromUrl.age ?? fromStore?.age ?? null,
    birthDate: fromUrl.birthDate ?? fromStore?.birthDate ?? null,
    gender: fromUrl.gender ?? fromStore?.gender ?? null,
    position: fromUrl.position ?? fromStore?.position ?? null,
  };
}

function buildQuery(hints: JoueurProfileHints): string {
  const q = new URLSearchParams();
  if (hints.age != null && Number.isFinite(hints.age)) {
    q.set("age", String(hints.age));
  }
  if (hints.birthDate) {
    const v =
      hints.birthDate instanceof Date
        ? hints.birthDate.toISOString().slice(0, 10)
        : String(hints.birthDate);
    q.set("birth", v);
  }
  if (hints.gender) q.set("gender", String(hints.gender));
  if (hints.position) q.set("position", String(hints.position));
  return q.toString();
}

/** Porte d’entrée /joueur (question Qui es-tu ?). */
export function joueurGateHref(
  hints: Pick<JoueurProfileHints, "gender"> = {},
): string {
  const q = new URLSearchParams();
  if (hints.gender) q.set("gender", String(hints.gender));
  const qs = q.toString();
  return qs ? `/joueur?${qs}` : "/joueur";
}

/**
 * Page immersive dédiée /joueur/experience.
 * Requiert au minimum âge + genre (sinon la page renvoie à la porte).
 */
export function joueurExperienceHref(hints: JoueurProfileHints = {}): string {
  const qs = buildQuery(hints);
  return qs ? `/joueur/experience?${qs}` : "/joueur/experience";
}

/** True si le profil suffit pour ouvrir l’expérience immersive. */
export function hasJoueurExperienceProfile(hints: JoueurProfileHints): boolean {
  const hasAge = hints.age != null || Boolean(hints.birthDate);
  const hasGender = Boolean(hints.gender);
  return hasAge && hasGender;
}
