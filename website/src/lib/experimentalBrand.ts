/**
 * Rebrand or/noir + symbole HD — local uniquement.
 * Activer via NEXT_PUBLIC_EXPERIMENTAL_BRAND=1 dans website/.env.local (jamais Netlify).
 */
export function isExperimentalBrand(): boolean {
  return process.env.NEXT_PUBLIC_EXPERIMENTAL_BRAND === "1";
}

/** Préfixe public des assets logo selon le mode build. */
export function brandAssetRoot(): "/branding" | "/branding/_experimental" {
  return isExperimentalBrand() ? "/branding/_experimental" : "/branding";
}
