/**
 * Verrou d'orientation du lecteur plein écran — une seule frontière avec le
 * module natif `expo-screen-orientation`, dérivée de `supportsOrientationLock`
 * (web/desktop : aucun verrou natif, aucun import natif exécuté).
 *
 * - Le hook s'accroche à `expo-screen-orientation` **uniquement** sur
 *   iOS/Android (`supportsOrientationLock`), jamais sur le web.
 * - Sous Jest, le module natif est simulé par `jest.setup.js` : les appels sont
 *   des jest.fn neutres, la logique reste vérifiable.
 * - `active` monte : verrou paysage (paysage capteur, les deux côtés).
 *   `active` redescend : retour au portrait produit (règle `app.json`
 *   historique). Le verrou est appliqué **de façon impérative** au démontage :
 *   une navigation brutale (back geste) ne doit jamais laisser l'app en
 *   paysage.
 */
import { useEffect } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  FULLSCREEN_ORIENTATION_LOCK,
  PORTRAIT_ORIENTATION_LOCK,
  supportsOrientationLock,
} from './videoOrientation';

export function useVideoOrientationLock(active: boolean): void {
  useEffect(() => {
    if (!supportsOrientationLock() || !active) return;

    let cancelled = false;

    ScreenOrientation.lockAsync(FULLSCREEN_ORIENTATION_LOCK).catch((err) => {
      console.warn('[useVideoOrientationLock] Error locking fullscreen orientation:', err);
    });

    return () => {
      if (cancelled) return;
      cancelled = true;
      ScreenOrientation.lockAsync(PORTRAIT_ORIENTATION_LOCK).catch((err) => {
        console.warn('[useVideoOrientationLock] Error restoring portrait orientation:', err);
      });
    };
  }, [active]);
}
