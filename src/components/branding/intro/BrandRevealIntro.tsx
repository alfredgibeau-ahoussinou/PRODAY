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
import type { ProductLineId } from '../../../models/ProductLine';
import type { UserRole } from '../../../models/User';
import { productLineToCarouselPole } from '../../../models/CarouselPole';

export type IntroSpaceChoice = CarouselPoleId;

const FADE_IN_MS = 220;
const FADE_OUT_MS = 280;

interface BrandRevealIntroProps {
  onChooseSpace: (space: IntroSpaceChoice) => void | Promise<void>;
  onExitComplete: () => void;
  onDismiss?: () => void;
  initialLine?: ProductLineId;
  initialRole?: UserRole | null;
  introTour?: boolean;
  skipReveal?: boolean;
}

/** Carousel minimal plein écran par pôle. */
export const BrandRevealIntro: React.FC<BrandRevealIntroProps> = ({
  onChooseSpace,
  onExitComplete,
  onDismiss,
  initialLine,
  initialRole,
  introTour = false,
  skipReveal = false,
}) => {
  const [leavingLine, setLeavingLine] = useState<IntroSpaceChoice | null>(null);
  const [interactive, setInteractive] = useState(!skipReveal);
  const opacity = useSharedValue(skipReveal ? 0 : 1);

  useEffect(() => {
    if (!skipReveal) return;
    opacity.value = withTiming(1, {
      duration: FADE_IN_MS,
      easing: Easing.out(Easing.cubic),
    });
    const timer = setTimeout(() => setInteractive(true), FADE_IN_MS);
    return () => clearTimeout(timer);
  }, [opacity, skipReveal]);

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
      if (line) setLeavingLine(line);
      setInteractive(false);

      opacity.value = withTiming(
        0,
        { duration: FADE_OUT_MS, easing: Easing.in(Easing.cubic) },
        (finished) => {
          'worklet';
          if (finished) runOnJS(finishLeave)(line, dismissOnly);
        },
      );
    },
    [finishLeave, interactive, leavingLine, opacity],
  );

  const handleChoose = useCallback(
    (line: IntroSpaceChoice) => {
      if (shouldSkipPoleTransition(line, initialLine, initialRole, skipReveal)) {
        beginLeave(null, true);
        return;
      }
      beginLeave(line, false);
    },
    [beginLeave, initialLine, initialRole, skipReveal],
  );

  const handleDismiss = useCallback(() => {
    beginLeave(null, true);
  }, [beginLeave]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const initialCarouselPole = initialLine
    ? productLineToCarouselPole(initialLine, initialRole)
    : undefined;

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
