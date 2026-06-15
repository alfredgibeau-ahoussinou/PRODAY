/** Feature flags V3 — activation progressive des modules. */
export function isV3ShellEnabled(): boolean {
  return process.env.EXPO_PUBLIC_V3_SHELL === '1';
}

/** Panneau « Intelligence » par onglet — désactivé (bruit UI). */
export function isV3IntelligenceUiEnabled(): boolean {
  return false;
}
