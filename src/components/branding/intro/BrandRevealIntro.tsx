import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import { UniverseChoicePager } from './UniverseChoicePager';
import { SeasonPriorityStep } from './SeasonPriorityStep';
import { shouldSkipPoleTransition } from './launchIntroFlow';
import type { ProductLineId } from '../../../models/ProductLine';
import type { UserRole } from '../../../models/User';
import { productLineToCarouselPole } from '../../../models/CarouselPole';
import {
  SEASON_PRIORITY_STORAGE_KEY,
  type SeasonPriorityOption,
} from '../../../content/seasonPriority';

export type IntroSpaceChoice = CarouselPoleId;

const FADE_IN_MS = 220;
const FADE_OUT_MS = 280;

interface BrandRevealIntroProps {
  onChooseSpace: (
    space: IntroSpaceChoice,
    presetRole?: UserRole | null,
  ) => void | Promise<void>;
  onExitComplete: () => void;
  onDismiss?: () => void;
  initialLine?: ProductLineId;
  initialRole?: UserRole | null;
  introTour?: boolean;
  skipReveal?: boolean;
  /** Entrée/sortie gérées par un parent (ex. PushScreenTransition). */
  skipLocalTransition?: boolean;
}

/** Carousel minimal plein écran par pôle (+ question priorité en first-run). */
export const BrandRevealIntro: React.FC<BrandRevealIntroProps> = ({
  onChooseSpace,
  onExitComplete,
  onDismiss,
  initialLine,
  initialRole,
  introTour = false,
  skipReveal = false,
  skipLocalTransition = false,
}) => {
  const [leavingLine, setLeavingLine] = useState<IntroSpaceChoice | null>(null);
  const [interactive, setInteractive] = useState(!skipReveal || skipLocalTransition);
  const [priorityDone, setPriorityDone] = useState(!introTour);
  const [priorityPresetRole, setPriorityPresetRole] = useState<UserRole | null>(null);
  const [priorityPole, setPriorityPole] = useState<CarouselPoleId | undefined>();
  const opacity = useSharedValue(skipReveal && !skipLocalTransition ? 0 : 1);

  useEffect(() => {
    if (!skipReveal || skipLocalTransition) return;
    opacity.value = withTiming(1, {
      duration: FADE_IN_MS,
      easing: Easing.out(Easing.cubic),
    });
    const timer = setTimeout(() => setInteractive(true), FADE_IN_MS);
    return () => clearTimeout(timer);
  }, [opacity, skipLocalTransition, skipReveal]);

  const finishLeave = useCallback(
    (line: IntroSpaceChoice | null, dismissOnly: boolean, role?: UserRole | null) => {
      if (dismissOnly) {
        onDismiss?.();
        return;
      }
      if (line) void onChooseSpace(line, role ?? priorityPresetRole);
      onExitComplete();
    },
    [onChooseSpace, onDismiss, onExitComplete, priorityPresetRole],
  );

  const beginLeave = useCallback(
    (line: IntroSpaceChoice | null, dismissOnly: boolean, role?: UserRole | null) => {
      if (!interactive || leavingLine) return;
      if (line) setLeavingLine(line);
      setInteractive(false);

      if (skipLocalTransition) {
        finishLeave(line, dismissOnly, role);
        return;
      }

      opacity.value = withTiming(
        0,
        { duration: FADE_OUT_MS, easing: Easing.in(Easing.cubic) },
        (finished) => {
          'worklet';
          if (finished) runOnJS(finishLeave)(line, dismissOnly, role ?? null);
        },
      );
    },
    [finishLeave, interactive, leavingLine, opacity, skipLocalTransition],
  );

  const handleChoose = useCallback(
    (line: IntroSpaceChoice) => {
      if (shouldSkipPoleTransition(line, initialLine, initialRole, skipReveal)) {
        beginLeave(null, true);
        return;
      }
      beginLeave(line, false, priorityPresetRole);
    },
    [beginLeave, initialLine, initialRole, priorityPresetRole, skipReveal],
  );

  const handleDismiss = useCallback(() => {
    beginLeave(null, true);
  }, [beginLeave]);

  const handlePrioritySelect = useCallback(
    (option: SeasonPriorityOption) => {
      setPriorityPresetRole(option.presetRole);
      setPriorityPole(option.pole);
      setPriorityDone(true);
      void AsyncStorage.setItem(SEASON_PRIORITY_STORAGE_KEY, option.id).catch(() => {
        /* ignore */
      });
      // Orientation automatique : on applique le pôle sans repasser par le carousel.
      void onChooseSpace(option.pole, option.presetRole);
      onExitComplete();
    },
    [onChooseSpace, onExitComplete],
  );

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const initialCarouselPole =
    priorityPole ??
    (initialLine ? productLineToCarouselPole(initialLine, initialRole) : undefined);

  if (introTour && !priorityDone) {
    return <SeasonPriorityStep onSelect={handlePrioritySelect} />;
  }

  return (
    <View style={styles.root} accessibilityViewIsModal>
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
    backgroundColor: '#0A0A0A',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
  },
});
