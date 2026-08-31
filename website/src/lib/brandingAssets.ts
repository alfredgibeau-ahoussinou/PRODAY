/**
 * Assets identité ProDay (website/public/branding).
 * Production : symbole officiel ProDayFoot (P + ballon + traits).
 * Experimental (NEXT_PUBLIC_EXPERIMENTAL_BRAND=1) : même mark sous `_experimental/` + accents or.
 */

import { brandAssetRoot, isExperimentalBrand } from "./experimentalBrand";

const B = brandAssetRoot();

/** Master source HD — ingestion via ingest-symbol-master.mjs. */
export const PRODAY_SYMBOL_MASTER = `${B}/logo-proday-symbol-master.png`;

/** Lockup officiel paddé (symbole + PRODAY) — OG / emails. */
export const PRODAY_LOGO_OFFICIAL = `${B}/logo-proday-official.png`;

/** Lockup blanc transparent (dark UI). */
export const PRODAY_LOGO_ON_DARK = `${B}/logo-proday-lockup-white.png`;

/** Lockup noir transparent (light UI / documents). */
export const PRODAY_LOGO_ON_LIGHT = `${B}/logo-proday-lockup-black.png`;

/** Symbole seul — blanc transparent (favicon source / nav). */
export const PRODAY_MARK = `${B}/logo-proday-mark.png`;

/** Symbole seul — noir transparent. */
export const PRODAY_MARK_ON_LIGHT = `${B}/logo-proday-mark-black.png`;

/** Symbole Master or / accent. */
export const PRODAY_MARK_GOLD = `${B}/logo-proday-mark-gold.png`;

/** Symbole Master accent (alias historique « blue »). */
export const PRODAY_MARK_BLUE = `${B}/logo-proday-mark-blue.png`;

/** Ratio lockup officiel paddé (symbole + wordmark). */
export const PRODAY_OFFICIAL_LOGO_ASPECT = isExperimentalBrand()
  ? 649 / 172
  : 637 / 172;

/** Ratio lockup nav horizontal composé (experimental — symbole + typo CSS). */
export const PRODAY_LOCKUP_ASPECT = 3.77;

/** Ratio symbole ProDayFoot HD (≈566×518). */
export const PRODAY_MARK_ASPECT = 566 / 518;

/** Pictos pôle = même symbole teinté. */
export const PRODAY_MARK_BY_POLE = {
  joueur: `${B}/logo-proday-mark-joueur.png`,
  coach: `${B}/logo-proday-mark-coach.png`,
  club: `${B}/logo-proday-mark-club.png`,
  president: `${B}/logo-proday-mark-president.png`,
  parent: `${B}/logo-proday-mark-parent.png`,
  supporter: `${B}/logo-proday-mark-supporter.png`,
  sponsor: `${B}/logo-proday-mark-sponsor.png`,
  admin: `${B}/logo-proday-mark-admin.png`,
  evenements: `${B}/logo-proday-mark-evenements.png`,
} as const;

export type ProdayMarkPole = keyof typeof PRODAY_MARK_BY_POLE;

export function prodayMarkForPole(pole: string | null | undefined): string {
  if (!pole) return PRODAY_MARK;
  if (pole === "pro_club" || pole === "pro") return PRODAY_MARK_BY_POLE.club;
  if (pole === "pro_staff" || pole === "pro_joueur" || pole === "amateur" || pole === "homme" || pole === "woman") {
    return pole === "pro_staff" ? PRODAY_MARK_BY_POLE.coach : PRODAY_MARK_BY_POLE.joueur;
  }
  if (pole === "sante") return PRODAY_MARK_BY_POLE.parent;
  if (pole in PRODAY_MARK_BY_POLE) {
    return PRODAY_MARK_BY_POLE[pole as ProdayMarkPole];
  }
  return PRODAY_MARK;
}
