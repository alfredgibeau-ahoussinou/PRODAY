import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const INTRO_SPACE_CHOSEN_KEY = 'proday_intro_space_chosen';

/**
 * Intro avec choix d’espace — uniquement tant que l’utilisateur n’a pas choisi (première ouverture).
 */
export function useAppLaunchIntro() {
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [playKey, setPlayKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const chosen = await AsyncStorage.getItem(INTRO_SPACE_CHOSEN_KEY);
        if (!cancelled) {
          setVisible(chosen !== '1');
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setVisible(true);
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const markIntroComplete = useCallback(async () => {
    await AsyncStorage.setItem(INTRO_SPACE_CHOSEN_KEY, '1');
    setVisible(false);
  }, []);

  return { visible: ready && visible, playKey, markIntroComplete };
}
