import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import { UniverseChoicePager } from './UniverseChoicePager';
import { BrandWelcomeReveal } from './BrandWelcomeReveal';
import { shouldSkipPoleTransition, UNIVERSE_CONFIRM_LEAVE } from './launchIntroFlow';
import type { ClubShellMode } from '../../../models/ClubShellMode';
import type { ProductLineId } from '../../../models/ProductLine';
import type { UserRole } from '../../../models/User';
import { productLineToCarouselPole } from '../../../models/CarouselPole';
import { prodayMotion, useReducedMotion } from '../../../motion';
import { useAuthOptional } from '../../../context/AuthContext';
import { UNIVERSE_ACCENT } from './universeIntroAccents';
import { PRODAY_MASTER } from '../../../theme/prodayBrand';

export type IntroSpaceChoice = CarouselPoleId;

const ENTER_MS = 280;
const ENTER_REDUCED_MS = 100;
const { exitMs: EXIT_MS, exitReducedMs: EXIT_REDUCED_MS, veilMs: EXIT_VEIL_MS } =
  UNIVERSE_CONFIRM_LEAVE;

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

/** Intro brand (Bienvenue) puis sélecteur d’univers — symbole pôle + transitions fluides. */
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

  const [welcomeDone, setWelcomeDone] = useState(skipReveal);
  const [leavingLine, setLeavingLine] = useState<IntroSpaceChoice | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [interactive, setInteractive] = useState(
    skipReveal ? Boolean(skipLocalTransition) : false,
  );
  const leaveDone = React.useRef(false);
  const leaveSafetyRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const opacity = useSharedValue(skipReveal && !skipLocalTransition ? 0 : welcomeDone ? 1 : 0);
  const scale = useSharedValue(
    skipReveal && !skipLocalTransition ? 0.985 : welcomeDone ? 1 : 0.985,
  );
  const veilOpacity = useSharedValue(0);
  const [veilAccent, setVeilAccent] = useState<string>(PRODAY_MASTER.gold);

  const showWelcome = !skipReveal && !welcomeDone;

  const onWelcomeComplete = useCallback(() => {
    setWelcomeDone(true);
  }, []);

  // Entrée picker : après Bienvenue, ou à l’ouverture manuelle (skipReveal).
  useEffect(() => {
    if (showWelcome) return;
    if (skipReveal && skipLocalTransition) {
      setInteractive(true);
      opacity.value = 1;
      scale.value = 1;
      return;
    }
    const dur = reduced ? ENTER_REDUCED_MS : ENTER_MS;
    opacity.value = withTiming(1, {
      duration: dur,
      easing: prodayMotion.easing.out,
    });
    if (!reduced) {
      scale.value = withSpring(1, prodayMotion.spring.smooth);
    } else {
      scale.value = 1;
    }
    const timer = setTimeout(() => setInteractive(true), dur);
    return () => clearTimeout(timer);
  }, [opacity, reduced, scale, showWelcome, skipLocalTransition, skipReveal]);

  const finishLeave = useCallback(
    (line: IntroSpaceChoice | null, dismissOnly: boolean) => {
      if (leaveDone.current) return;
      leaveDone.current = true;
      if (dismissOnly) {
        onDismiss?.();
        return;
      }
      // Auth d’abord (sync via onChooseSpace), puis fermeture intro.
      if (line) void onChooseSpace(line);
      onExitComplete();
    },
    [onChooseSpace, onDismiss, onExitComplete],
  );

  const beginLeave = useCallback(
    (line: IntroSpaceChoice | null, dismissOnly: boolean) => {
      if (!interactive || leaving) return;
      if (line) {
        setLeavingLine(line);
        setVeilAccent(UNIVERSE_ACCENT[line]);
      }
      setLeaving(true);
      setInteractive(false);

      // Parent PushScreenTransition owns exit — no local opacity/scale redo.
      if (skipLocalTransition) {
        if (line && !dismissOnly && !reduced) {
          veilOpacity.value = withTiming(0.22, {
            duration: Math.min(EXIT_VEIL_MS, 80),
            easing: prodayMotion.easing.out,
          });
        }
        finishLeave(line, dismissOnly);
        return;
      }

      const outMs = reduced ? EXIT_REDUCED_MS : EXIT_MS;
      if (line && !dismissOnly) {
        veilOpacity.value = withTiming(reduced ? 0.16 : 0.36, {
          duration: Math.min(outMs, EXIT_VEIL_MS),
          easing: prodayMotion.easing.out,
        });
      }
      opacity.value = withTiming(
        0,
        { duration: outMs, easing: prodayMotion.easing.in },
        (finished) => {
          'worklet';
          if (finished) runOnJS(finishLeave)(line, dismissOnly);
        },
      );
      if (!reduced) {
        scale.value = withTiming(0.975, {
          duration: outMs,
          easing: prodayMotion.easing.in,
        });
      }
      // Secours : si finished=false, terminer quand même (sans rallonger l’anim).
      if (leaveSafetyRef.current) clearTimeout(leaveSafetyRef.current);
      leaveSafetyRef.current = setTimeout(() => finishLeave(line, dismissOnly), outMs + 80);
    },
    [
      finishLeave,
      interactive,
      leaving,
      opacity,
      reduced,
      scale,
      skipLocalTransition,
      veilOpacity,
    ],
  );

  useEffect(
    () => () => {
      if (leaveSafetyRef.current) clearTimeout(leaveSafetyRef.current);
    },
    [],
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
      {showWelcome ? (
        <BrandWelcomeReveal onComplete={onWelcomeComplete} />
      ) : (
        <>
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
              interactionLocked={!interactive || leaving}
              confirmingPole={leavingLine}
              initialLine={initialLine}
              initialCarouselPole={initialCarouselPole}
              accessRole={accessRole}
              accessEmail={accessEmail}
              accessIsAdmin={accessIsAdmin}
              showDismiss={skipReveal && interactive}
              onDismiss={handleDismiss}
            />
          </Animated.View>
        </>
      )}
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
