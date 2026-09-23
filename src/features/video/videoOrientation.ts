/**
 * Stratégie d'orientation vidéo — décisions de plateforme pures, testables sous
 * Jest (le module natif `expo-screen-orientation` n'existe pas dans
 * l'environnement de test, ses valeurs stables sont recopiées et typées ici).
 *
 * Règle produit : l'application reste portrait-first (comportement `app.json`
 * historique) ; seul le lecteur vidéo en mode plein écran déverrouille la
 * rotation (paysage capteur, les deux côtés) et la restitue en sortie.
 */
import { Platform } from 'react-native';
import type { OrientationLock } from 'expo-screen-orientation';

/** Verrou du lecteur en plein écran : paysage capteur (gauche ou droite) — `OrientationLock.LANDSCAPE`. */
export const FULLSCREEN_ORIENTATION_LOCK = 5 as OrientationLock;

/** Verrou de repos de l'application : portrait (règle produit ProDay) — `OrientationLock.PORTRAIT`. */
export const PORTRAIT_ORIENTATION_LOCK = 2 as OrientationLock;

/** Le verrou natif n'a de sens que sur iOS/Android — web/desktop s'agrandit sans lui. */
export function supportsOrientationLock(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
