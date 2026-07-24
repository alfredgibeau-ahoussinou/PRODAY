import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirstLaunchIntro } from '../components/branding/FirstLaunchIntro';
import { LaunchVideoIntro } from '../components/branding/intro/LaunchVideoIntro';
import { LaunchVideoErrorBoundary } from '../components/branding/intro/LaunchVideoErrorBoundary';
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
import { Platform, StyleSheet, View } from 'react-native';

/** Une seule lecture de la vidéo d’intro par installation (évite crash natif répété). */
export const LAUNCH_VIDEO_SEEN_KEY = 'proday_launch_video_seen_v1';

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
  const [videoReady, setVideoReady] = useState(false);
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const seen = await AsyncStorage.getItem(LAUNCH_VIDEO_SEEN_KEY);
        if (!cancelled) {
          // Android : la vidéo d’intro a provoqué des crashes natifs au cold start sur certains APK.
          // On la saute pour garantir l’ouverture de l’app ; iOS conserve l’intro une fois.
          const playVideo = Platform.OS !== 'android' && seen !== '1';
          setShouldPlayVideo(playVideo);
          setVideoReady(true);
          if (!playVideo) setVideoIntroDone(true);
        }
      } catch {
        if (!cancelled) {
          // En cas d’échec stockage : on saute la vidéo pour ne pas bloquer le démarrage.
          setShouldPlayVideo(false);
          setVideoIntroDone(true);
          setVideoReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const finishVideoIntro = useCallback(() => {
    setVideoIntroDone(true);
    void AsyncStorage.setItem(LAUNCH_VIDEO_SEEN_KEY, '1').catch(() => {
      /* ignore */
    });
  }, []);

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
        {videoReady && shouldPlayVideo && !videoIntroDone ? (
          <LaunchVideoErrorBoundary onError={finishVideoIntro}>
            <LaunchVideoIntro onFinish={finishVideoIntro} />
          </LaunchVideoErrorBoundary>
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
