import React, {
  Suspense,
  createContext,
  lazy,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirstLaunchIntro } from '../components/branding/FirstLaunchIntro';
import { LaunchVideoErrorBoundary } from '../components/branding/intro/LaunchVideoErrorBoundary';
import type { IntroSpaceChoice } from '../components/branding/intro/BrandRevealIntro';
import { resolveIntroExitAction } from '../components/branding/intro/launchIntroFlow';
import {
  carouselPoleSignupPresetRole,
  carouselPoleToProductLine,
} from '../models/CarouselPole';
import { clubShellModeFromCarouselPole } from '../models/ClubShellMode';
import { useAppLaunchIntro } from '../hooks/useAppLaunchIntro';
import { useProductLine } from './ProductLineContext';
import { useAuthOptional } from './AuthContext';
import { PushScreenTransition } from '../components/motion';
import { StyleSheet, View } from 'react-native';
import { UNIVERSE_CONFIRM_LEAVE } from '../components/branding/intro/launchIntroFlow';

/**
 * Une seule lecture de la vidéo d’intro par installation (évite crash natif répété).
 * v2 : l’ancienne MP4 embarquait le logo legacy (P coureur bleu / RÉUSSIR) — désactivée.
 */
export const LAUNCH_VIDEO_SEEN_KEY = 'proday_launch_video_seen_v2';

/** Vidéo pré-rendue désactivée tant qu’elle n’est pas régénérée avec le lockup officiel. */
const ENABLE_LAUNCH_VIDEO_INTRO = false;

/**
 * Import dynamique : `expo-video` n’est chargé que si la vidéo d’intro monte
 * (évite de tirer le module au cold start JS).
 */
const LaunchVideoIntroLazy = lazy(() =>
  import('../components/branding/intro/LaunchVideoIntro').then((module) => ({
    default: module.LaunchVideoIntro,
  })),
);

interface LaunchIntroContextValue {
  openSpacePicker: () => void;
}

const LaunchIntroContext = createContext<LaunchIntroContextValue | null>(null);

export const LaunchIntroProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { visible: firstLaunchVisible, playKey, markIntroComplete } = useAppLaunchIntro();
  const auth = useAuthOptional();
  const profile = auth?.profile ?? null;
  const { productLine, setProductLine, setProSignupPresetRole, clubShellMode, setClubShellMode } =
    useProductLine();
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
          const playVideo = ENABLE_LAUNCH_VIDEO_INTRO && seen !== '1';
          setShouldPlayVideo(playVideo);
          setVideoReady(true);
          if (!playVideo) setVideoIntroDone(true);
        }
      } catch {
        if (!cancelled) {
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
      const shellMode = clubShellModeFromCarouselPole(pole);
      if (shellMode) await setClubShellMode(shellMode);
      const line = carouselPoleToProductLine(pole);
      await setProductLine(line);
    },
    [setProductLine, setProSignupPresetRole, setClubShellMode],
  );

  const onIntroExitComplete = useCallback(() => {
    const action = resolveIntroExitAction(manualOpen);
    if (action === 'close-manual') {
      setManualOpen(false);
      return;
    }
    void markIntroComplete();
  }, [manualOpen, markIntroComplete]);

  const showLaunchVideo = videoReady && shouldPlayVideo && !videoIntroDone;

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
        <PushScreenTransition
          active={manualOpen}
          directExit
          directExitMs={UNIVERSE_CONFIRM_LEAVE.pushExitMs}
        >
          {/* Toujours passé en children : Push garde le contenu pendant l’exit direct. */}
          <FirstLaunchIntro
            key={`manual-${pickerSession}`}
            onChooseSpace={onChooseSpace}
            onExitComplete={onIntroExitComplete}
            onDismiss={closeSpacePicker}
            initialLine={productLine}
            initialRole={profile?.role}
            initialClubShellMode={clubShellMode}
            skipReveal
            skipLocalTransition
          />
        </PushScreenTransition>
        {showLaunchVideo ? (
          <LaunchVideoErrorBoundary onError={finishVideoIntro}>
            <Suspense fallback={null}>
              <LaunchVideoIntroLazy onFinish={finishVideoIntro} />
            </Suspense>
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
