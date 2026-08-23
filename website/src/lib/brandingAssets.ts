/**
 * Assets identité officielle ProDay (website/public/branding).
 * Symbole seul = favicon / nav compacte ; lockup = headers / OG.
 */

/** Lockup officiel (symbole + PRODAY) — blanc, fond transparent (UI sombre). */
export const PRODAY_LOGO_OFFICIAL = "/branding/logo-proday-official.png";

/** Lockup blanc (dark UI). */
export const PRODAY_LOGO_ON_DARK = "/branding/logo-proday-lockup-white.png";

/** Lockup noir (light UI / documents). */
export const PRODAY_LOGO_ON_LIGHT = "/branding/logo-proday-lockup-black.png";

/** Symbole seul — blanc transparent (favicon source / nav). */
export const PRODAY_MARK = "/branding/logo-proday-mark.png";

/** Symbole seul — noir transparent. */
export const PRODAY_MARK_ON_LIGHT = "/branding/logo-proday-mark-black.png";

/** Symbole Master bleu ProDay. */
export const PRODAY_MARK_BLUE = "/branding/logo-proday-mark-blue.png";

/** Ratio lockup officiel (≈ 636×375). */
export const PRODAY_OFFICIAL_LOGO_ASPECT = 636 / 375;

/** Ratio symbole seul (≈ 369×259). */
export const PRODAY_MARK_ASPECT = 369 / 259;

/** Pictos pôle = même symbole teinté (accents officiels). */
export const PRODAY_MARK_BY_POLE = {
  joueur: "/branding/logo-proday-mark-joueur.png",
  coach: "/branding/logo-proday-mark-coach.png",
  club: "/branding/logo-proday-mark-club.png",
  president: "/branding/logo-proday-mark-president.png",
  parent: "/branding/logo-proday-mark-parent.png",
  supporter: "/branding/logo-proday-mark-supporter.png",
  sponsor: "/branding/logo-proday-mark-sponsor.png",
  admin: "/branding/logo-proday-mark-admin.png",
  evenements: "/branding/logo-proday-mark-joueur.png",
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
