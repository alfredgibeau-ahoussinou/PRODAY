import React, { createContext, useCallback, useContext, useState } from 'react';
import { FirstLaunchIntro } from '../components/branding/FirstLaunchIntro';
import type { IntroSpaceChoice } from '../components/branding/intro/BrandRevealIntro';
import { useAppLaunchIntro } from '../hooks/useAppLaunchIntro';
import { useProductLine } from './ProductLineContext';
import { StyleSheet, View } from 'react-native';

interface LaunchIntroContextValue {
  /** Rouvre l'écran Homme / Woman / Pro. */
  openSpacePicker: () => void;
}

const LaunchIntroContext = createContext<LaunchIntroContextValue | null>(null);

export const LaunchIntroProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { visible: firstLaunchVisible, playKey, markIntroComplete } = useAppLaunchIntro();
  const { enterHommeSpace, enterWomanSpace, enterProSpace, enterSanteSpace } = useProductLine();
  const [manualOpen, setManualOpen] = useState(false);

  const visible = firstLaunchVisible || manualOpen;

  const openSpacePicker = useCallback(() => {
    setManualOpen(true);
  }, []);

  const onChooseSpace = useCallback(
    (space: IntroSpaceChoice) => {
      void (async () => {
        if (space === 'woman') await enterWomanSpace();
        else if (space === 'pro') await enterProSpace();
        else if (space === 'sante') await enterSanteSpace();
        else await enterHommeSpace();
        await markIntroComplete();
        setManualOpen(false);
      })();
    },
    [enterHommeSpace, enterWomanSpace, enterProSpace, enterSanteSpace, markIntroComplete]
  );

  return (
    <LaunchIntroContext.Provider value={{ openSpacePicker }}>
      <View style={styles.wrap}>
        {children}
        {visible ? (
          <FirstLaunchIntro
            key={manualOpen ? 'manual' : playKey}
            onChooseSpace={onChooseSpace}
            introTour={firstLaunchVisible && !manualOpen}
          />
        ) : null}
      </View>
    </LaunchIntroContext.Provider>
  );
};

export function useLaunchIntro(): LaunchIntroContextValue {
  const ctx = useContext(LaunchIntroContext);
  if (!ctx) {
    throw new Error('useLaunchIntro doit être utilisé dans LaunchIntroProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
});
