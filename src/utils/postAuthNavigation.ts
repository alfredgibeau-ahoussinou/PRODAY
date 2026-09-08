/**
 * Après login/signup : ne pas réouvrir le carousel univers
 * si le pôle a déjà été choisi (parcours invité univers → gate).
 */
export function shouldReopenUniverseAfterAuth(opts: {
  /** Pôle déjà fixé via univers / openAuth */
  hasChosenPole: boolean;
}): boolean {
  return !opts.hasChosenPole;
}
