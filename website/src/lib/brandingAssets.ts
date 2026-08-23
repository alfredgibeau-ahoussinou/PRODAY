/**
 * Assets identité officielle ProDay (website/public/branding).
 * Source master HD : logo-proday-symbol-master.png → ingest-symbol-master.mjs.
 * Symbole seul = favicon / pictos pôle ; lockup nav = symbole + typo CSS.
 */

/** Master source (blanc sur fond noir) — ingestion uniquement. */
export const PRODAY_SYMBOL_MASTER = "/branding/logo-proday-symbol-master.png";

/** Lockup officiel paddé (symbole + PRODAY) — OG / emails. */
export const PRODAY_LOGO_OFFICIAL = "/branding/logo-proday-official.png";

/** @deprecated Lockup PNG — préférer ProdayLockup (symbole + typo). */
export const PRODAY_LOGO_ON_DARK = "/branding/logo-proday-lockup-white.png";

/** @deprecated Lockup PNG — préférer ProdayLockup (symbole + typo). */
export const PRODAY_LOGO_ON_LIGHT = "/branding/logo-proday-lockup-black.png";

/** Symbole seul — blanc transparent (favicon source / pictos). */
export const PRODAY_MARK = "/branding/logo-proday-mark.png";

/** Symbole seul — noir transparent. */
export const PRODAY_MARK_ON_LIGHT = "/branding/logo-proday-mark-black.png";

/** Symbole Master or. */
export const PRODAY_MARK_GOLD = "/branding/logo-proday-mark-gold.png";

/** @deprecated Alias or master (ex-bleu). */
export const PRODAY_MARK_BLUE = "/branding/logo-proday-mark-blue.png";

/** Ratio lockup officiel paddé (649×172, symbole + PRODAY). */
export const PRODAY_OFFICIAL_LOGO_ASPECT = 649 / 172;

/** Ratio lockup nav horizontal composé (symbole + typo PRODAY). */
export const PRODAY_LOCKUP_ASPECT = 3.77;

/** Ratio symbole master HD (675×552). */
export const PRODAY_MARK_ASPECT = 675 / 552;

/** Pictos pôle = même symbole teinté (accents planche). */
export const PRODAY_MARK_BY_POLE = {
  joueur: "/branding/logo-proday-mark-joueur.png",
  coach: "/branding/logo-proday-mark-coach.png",
  club: "/branding/logo-proday-mark-club.png",
  president: "/branding/logo-proday-mark-president.png",
  parent: "/branding/logo-proday-mark-parent.png",
  supporter: "/branding/logo-proday-mark-supporter.png",
  sponsor: "/branding/logo-proday-mark-sponsor.png",
  admin: "/branding/logo-proday-mark-admin.png",
  evenements: "/branding/logo-proday-mark-evenements.png",
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
