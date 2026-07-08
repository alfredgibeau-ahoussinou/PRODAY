import React, { createContext, useCallback, useContext, useState } from 'react';
import { FirstLaunchIntro } from '../components/branding/FirstLaunchIntro';
import { LaunchVideoIntro } from '../components/branding/intro/LaunchVideoIntro';
import type { IntroSpaceChoice } from '../components/branding/intro/BrandRevealIntro';
import { resolveIntroExitAction } from '../components/branding/intro/launchIntroFlow';
import {
  carouselPoleSignupPresetRole,
  carouselPoleToProductLine,
} from '../models/CarouselPole';
import { useAppLaunchIntro } from '../hooks/useAppLaunchIntro';
import { useProductLine } from './ProductLineContext';
import { useAuth } from './AuthContext';
import { PushScreenTransition } from '../components/motion';
import { StyleSheet, View } from 'react-native';

interface LaunchIntroContextValue {
  openSpacePicker: () => void;
}

const LaunchIntroContext = createContext<LaunchIntroContextValue | null>(null);

export const LaunchIntroProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { visible: firstLaunchVisible, playKey, markIntroComplete } = useAppLaunchIntro();
  const { profile } = useAuth();
  const { productLine, setProductLine, setProSignupPresetRole } = useProductLine();
  const [manualOpen, setManualOpen] = useState(false);
  const [pickerSession, setPickerSession] = useState(0);
  const [videoIntroDone, setVideoIntroDone] = useState(false);

  const openSpacePicker = useCallback(() => {
    setPickerSession((session) => session + 1);
    setManualOpen(true);
  }, []);

  const closeSpacePicker = useCallback(() => {
    setManualOpen(false);
  }, []);

  const onChooseSpace = useCallback(
    async (pole: IntroSpaceChoice) => {
      const preset = carouselPoleSignupPresetRole(pole);
      await setProSignupPresetRole(preset);
      const line = carouselPoleToProductLine(pole);
      await setProductLine(line);
    },
    [setProductLine, setProSignupPresetRole],
  );

  const onIntroExitComplete = useCallback(() => {
    const action = resolveIntroExitAction(manualOpen);
    if (action === 'close-manual') {
      setManualOpen(false);
      return;
    }
    void markIntroComplete();
  }, [manualOpen, markIntroComplete]);

  return (
    <LaunchIntroContext.Provider value={{ openSpacePicker }}>
      <View style={styles.wrap}>
        {children}
        {firstLaunchVisible && !manualOpen ? (
          <FirstLaunchIntro
            key={`first-${playKey}`}
            onChooseSpace={onChooseSpace}
            onExitComplete={onIntroExitComplete}
            introTour
          />
        ) : null}
        <PushScreenTransition active={manualOpen}>
          {manualOpen ? (
            <FirstLaunchIntro
              key={`manual-${pickerSession}`}
              onChooseSpace={onChooseSpace}
              onExitComplete={onIntroExitComplete}
              onDismiss={closeSpacePicker}
              initialLine={productLine}
              initialRole={profile?.role}
              skipReveal
              skipLocalTransition
            />
          ) : null}
        </PushScreenTransition>
        {!videoIntroDone ? (
          <LaunchVideoIntro onFinish={() => setVideoIntroDone(true)} />
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
