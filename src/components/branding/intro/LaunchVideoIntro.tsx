import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LAUNCH_INTRO_TIMING, LAUNCH_INTRO_VIDEO } from '../../../content/launchIntroAssets';

interface LaunchVideoIntroProps {
  /** Appelé une fois l'intro terminée (ou passée). */
  onFinish: () => void;
}

/**
 * Intro de lancement : lit la vidéo pré-rendue (foot + logo + musique) puis
 * fond vers l'app. Lecture d'un seul fichier = aucune saccade.
 */
export const LaunchVideoIntro: React.FC<LaunchVideoIntroProps> = ({ onFinish }) => {
  const finishedRef = useRef(false);
  const [showSkip, setShowSkip] = useState(false);
  const opacity = useSharedValue(1);

  const player = useVideoPlayer(LAUNCH_INTRO_VIDEO, (instance) => {
    try {
      instance.loop = false;
      // Muet par défaut sur Android : limite les crashes audio natifs au cold start.
      instance.muted = true;
    } catch {
      /* ignore */
    }
  });

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    try {
      player.pause();
    } catch {
      /* ignore */
    }
    opacity.value = withTiming(
      0,
      { duration: LAUNCH_INTRO_TIMING.fadeOutMs, easing: Easing.out(Easing.quad) },
      (done) => {
        'worklet';
        if (done) runOnJS(onFinish)();
      },
    );
  }, [onFinish, opacity, player]);

  // Démarrage prudent : si le lecteur échoue, on entre dans l’app sans bloquer.
  useEffect(() => {
    let active = true;
    const bootFailSafe = setTimeout(() => {
      if (active) finish();
    }, 2500);
    void (async () => {
      try {
        const { setAudioModeAsync } = await import('expo-audio');
        await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false });
      } catch {
        /* module natif absent */
      }
      if (!active) return;
      try {
        player.muted = false;
        player.play();
      } catch {
        finish();
      }
    })();
    return () => {
      active = false;
      clearTimeout(bootFailSafe);
    };
  }, [finish, player]);

  // Fin de lecture / erreur.
  useEffect(() => {
    let endSub: { remove: () => void } | null = null;
    let statusSub: { remove: () => void } | null = null;
    try {
      endSub = player.addListener('playToEnd', () => finish());
      statusSub = player.addListener('statusChange', ({ status }) => {
        if (status === 'error') finish();
        if (status === 'readyToPlay') {
          try {
            player.play();
          } catch {
            finish();
          }
        }
      });
    } catch {
      finish();
    }
    return () => {
      endSub?.remove();
      statusSub?.remove();
    };
  }, [finish, player]);

  // Filets de sécurité : ne jamais bloquer l'utilisateur.
  useEffect(() => {
    const maxTimer = setTimeout(finish, LAUNCH_INTRO_TIMING.maxDurationMs);
    const skipTimer = setTimeout(() => setShowSkip(true), LAUNCH_INTRO_TIMING.skipDelayMs);
    return () => {
      clearTimeout(maxTimer);
      clearTimeout(skipTimer);
    };
  }, [finish]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.root, rootStyle]} accessibilityViewIsModal accessibilityLabel="Intro ProDay">
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        fullscreenOptions={{ enable: false }}
        allowsPictureInPicture={false}
      />
      {showSkip ? (
        <Pressable
          style={styles.skip}
          onPress={finish}
          accessibilityRole="button"
          accessibilityLabel="Passer l'intro"
          hitSlop={12}
        >
          <Text style={styles.skipText}>Passer</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
    elevation: 2000,
    backgroundColor: '#000000',
  },
  skip: {
    position: 'absolute',
    top: 40,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
