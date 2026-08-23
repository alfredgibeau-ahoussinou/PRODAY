import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import { UniverseChoicePager } from './UniverseChoicePager';
import { shouldSkipPoleTransition } from './launchIntroFlow';
import type { ClubShellMode } from '../../../models/ClubShellMode';
import type { ProductLineId } from '../../../models/ProductLine';
import type { UserRole } from '../../../models/User';
import { productLineToCarouselPole } from '../../../models/CarouselPole';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { useAuthOptional } from '../../../context/AuthContext';
import { UNIVERSE_ACCENT } from './universeIntroAccents';
import { PRODAY_MASTER } from '../../../theme/prodayBrand';

export type IntroSpaceChoice = CarouselPoleId;

const FADE_IN_MS = 280;
const FADE_OUT_MS = 360;
const FADE_OUT_REDUCED_MS = 120;

interface BrandRevealIntroProps {
  onChooseSpace: (space: IntroSpaceChoice) => void | Promise<void>;
  onExitComplete: () => void;
  onDismiss?: () => void;
  initialLine?: ProductLineId;
  initialRole?: UserRole | null;
  initialClubShellMode?: ClubShellMode | null;
  introTour?: boolean;
  skipReveal?: boolean;
  /** Entrée/sortie gérées par un parent (ex. PushScreenTransition). */
  skipLocalTransition?: boolean;
}

/** Sélecteur d’univers immersif — 1 symbole + accents pôle. */
export const BrandRevealIntro: React.FC<BrandRevealIntroProps> = ({
  onChooseSpace,
  onExitComplete,
  onDismiss,
  initialLine,
  initialRole,
  initialClubShellMode,
  introTour = false,
  skipReveal = false,
  skipLocalTransition = false,
}) => {
  const reduced = useReducedMotion();
  const auth = useAuthOptional();
  const profile = auth?.profile ?? null;
  const accessRole = initialRole ?? profile?.role ?? null;
  const accessEmail = profile?.email ?? null;
  const accessIsAdmin = Boolean(auth?.isAdmin);

  const [leavingLine, setLeavingLine] = useState<IntroSpaceChoice | null>(null);
  const [interactive, setInteractive] = useState(!skipReveal || skipLocalTransition);
  const opacity = useSharedValue(skipReveal && !skipLocalTransition ? 0 : 1);
  const scale = useSharedValue(1);
  const veilOpacity = useSharedValue(0);
  const [veilAccent, setVeilAccent] = useState<string>(PRODAY_MASTER.blue);

  useEffect(() => {
    if (!skipReveal || skipLocalTransition) return;
    const dur = reduced ? 80 : FADE_IN_MS;
    opacity.value = withTiming(1, {
      duration: dur,
      easing: Easing.out(Easing.cubic),
    });
    const timer = setTimeout(() => setInteractive(true), dur);
    return () => clearTimeout(timer);
  }, [opacity, reduced, skipLocalTransition, skipReveal]);

  const finishLeave = useCallback(
    (line: IntroSpaceChoice | null, dismissOnly: boolean) => {
      if (dismissOnly) {
        onDismiss?.();
        return;
      }
      if (line) void onChooseSpace(line);
      onExitComplete();
    },
    [onChooseSpace, onDismiss, onExitComplete],
  );

  const beginLeave = useCallback(
    (line: IntroSpaceChoice | null, dismissOnly: boolean) => {
      if (!interactive || leavingLine) return;
      if (line) {
        setLeavingLine(line);
        setVeilAccent(UNIVERSE_ACCENT[line]);
      }
      setInteractive(false);

      // Parent (PushScreenTransition) gère l’exit — flash accent court pour continuité.
      if (skipLocalTransition) {
        if (line && !dismissOnly && !reduced) {
          veilOpacity.value = withTiming(0.4, { duration: 160, easing: Easing.out(Easing.cubic) });
          opacity.value = withTiming(
            0.15,
            { duration: 220, easing: Easing.in(Easing.cubic) },
            (finished) => {
              'worklet';
              if (finished) runOnJS(finishLeave)(line, dismissOnly);
            },
          );
          return;
        }
        finishLeave(line, dismissOnly);
        return;
      }

      const outMs = reduced ? FADE_OUT_REDUCED_MS : FADE_OUT_MS;
      if (line && !dismissOnly) {
        veilOpacity.value = withTiming(reduced ? 0.2 : 0.5, {
          duration: Math.min(outMs, 200),
          easing: Easing.out(Easing.cubic),
        });
      }
      opacity.value = withTiming(
        0,
        { duration: outMs, easing: Easing.in(Easing.cubic) },
        (finished) => {
          'worklet';
          if (finished) runOnJS(finishLeave)(line, dismissOnly);
        },
      );
      if (!reduced) {
        scale.value = withTiming(0.97, {
          duration: outMs,
          easing: Easing.in(Easing.cubic),
        });
      }
    },
    [
      finishLeave,
      interactive,
      leavingLine,
      opacity,
      reduced,
      scale,
      skipLocalTransition,
      veilOpacity,
    ],
  );

  const handleChoose = useCallback(
    (line: IntroSpaceChoice) => {
      if (
        shouldSkipPoleTransition(
          line,
          initialLine,
          initialRole,
          skipReveal,
          initialClubShellMode,
        )
      ) {
        beginLeave(null, true);
        return;
      }
      beginLeave(line, false);
    },
    [beginLeave, initialClubShellMode, initialLine, initialRole, skipReveal],
  );

  const handleDismiss = useCallback(() => {
    beginLeave(null, true);
  }, [beginLeave]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const veilStyle = useAnimatedStyle(() => ({
    opacity: veilOpacity.value,
  }));

  const initialCarouselPole = initialLine
    ? productLineToCarouselPole(initialLine, initialRole, initialClubShellMode)
    : undefined;

  return (
    <View style={styles.root} accessibilityViewIsModal>
      <Animated.View
        pointerEvents="none"
        style={[styles.veil, { backgroundColor: veilAccent }, veilStyle]}
      />
      <Animated.View
        style={[styles.content, contentStyle]}
        pointerEvents={interactive ? 'auto' : 'none'}
      >
        <UniverseChoicePager
          onChoose={handleChoose}
          introTour={introTour}
          interactionLocked={!interactive || !!leavingLine}
          initialLine={initialLine}
          initialCarouselPole={initialCarouselPole}
          accessRole={accessRole}
          accessEmail={accessEmail}
          accessIsAdmin={accessIsAdmin}
          showDismiss={skipReveal && interactive}
          onDismiss={handleDismiss}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: PRODAY_MASTER.black,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
});
