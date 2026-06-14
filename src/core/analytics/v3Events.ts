/** Analytics V3 — événements produit (Phase 0+). */
export function trackV3Event(
  name: string,
  props?: Record<string, string | number | boolean | string[]>
): void {
  if (__DEV__) {
    console.log(`[v3:${name}]`, props ?? {});
  }
}
