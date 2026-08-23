import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import { getCarouselPoleIdentity } from '../../../content/carouselPoleExperience';
import { ProDayLogo } from '../ProDayLogo';
import { Icon } from '../../ui/Icon';
import { spacing } from '../../../theme/designTokens';
import { UNIVERSE_ACCENT } from './universeIntroAccents';
import {
  brandVariantForCarouselPole,
  universePoleIcon,
} from './universePoleBrand';

interface UniverseChoicePageProps {
  line: CarouselPoleId;
  index: number;
  pageWidth: number;
  pageHeight: number;
  scrollX: SharedValue<number>;
  /** Largeur de la slide (peek) — ≠ largeur écran. */
  itemWidth: number;
  /** Composition tablette / desktop : plus d'air. */
  cinematic?: boolean;
  /** Réduit parallax / rotation pour accessibilité mouvement. */
  reducedMotion?: boolean;
}

/**
 * Slide univers — lockup horizontal symbole + PRODAY · POLE, accent pôle fluide.
 */
export const UniverseChoicePage: React.FC<UniverseChoicePageProps> = ({
  line,
  index,
  itemWidth,
  scrollX,
  cinematic = false,
  reducedMotion = false,
}) => {
  const identity = getCarouselPoleIdentity(line);
  const accent = UNIVERSE_ACCENT[line];
  const variant = brandVariantForCarouselPole(line);
  const iconName = universePoleIcon(line);
  const logoWidth = cinematic
    ? Math.min(itemWidth * 0.88, 320)
    : Math.min(itemWidth * 0.92, 268);
  const styles = useMemo(
    () => createStyles(itemWidth, cinematic),
    [itemWidth, cinematic],
  );

  const stageStyle = useAnimatedStyle(() => {
    if (itemWidth <= 0) {
      return { opacity: 0, transform: [{ scale: 0.94 }] };
    }
    const page = scrollX.value / itemWidth;
    const offset = page - index;
    const abs = Math.abs(offset);

    if (reducedMotion) {
      const opacity = interpolate(abs, [0, 0.5, 1], [1, 0.72, 0.5], Extrapolation.CLAMP);
      const scale = interpolate(abs, [0, 1], [1, 0.94], Extrapolation.CLAMP);
      return { opacity, transform: [{ scale }] };
    }

    const scale = interpolate(offset, [-1, 0, 1], [0.84, 1, 0.84], Extrapolation.CLAMP);
    const opacity = interpolate(
      abs,
      [0, 0.35, 0.75, 1],
      [1, 0.9, 0.56, 0.42],
      Extrapolation.CLAMP,
    );
    const translateY = interpolate(offset, [-1, 0, 1], [18, 0, 18], Extrapolation.CLAMP);
    const translateX = interpolate(offset, [-1, 0, 1], [22, 0, -22], Extrapolation.CLAMP);
    const rotateZ = `${interpolate(offset, [-1, 0, 1], [-2, 0, 2], Extrapolation.CLAMP)}deg`;
    return {
      opacity,
      transform: [{ translateX }, { translateY }, { scale }, { rotate: rotateZ }],
    };
  }, [index, itemWidth, reducedMotion]);

  const glowStyle = useAnimatedStyle(() => {
    if (itemWidth <= 0) return { opacity: 0 };
    const page = scrollX.value / itemWidth;
    const offset = page - index;
    const abs = Math.abs(offset);
    const peak = reducedMotion ? 0.32 : 0.42;
    const opacity = interpolate(abs, [0, 0.5, 1], [peak, 0.14, 0.04], Extrapolation.CLAMP);
    const scale = interpolate(abs, [0, 1], [1.1, 0.86], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }] };
  }, [index, itemWidth, reducedMotion]);

  const badgeStyle = useAnimatedStyle(() => {
    if (itemWidth <= 0) return { opacity: 0.6, transform: [{ scale: 0.94 }] };
    const page = scrollX.value / itemWidth;
    const offset = page - index;
    const opacity = interpolate(Math.abs(offset), [0, 0.45, 1], [1, 0.74, 0.48], Extrapolation.CLAMP);
    const scale = interpolate(Math.abs(offset), [0, 1], [1, 0.9], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }] };
  }, [index, itemWidth]);

  return (
    <View style={styles.page}>
      <Animated.View style={[styles.stage, stageStyle]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.glow, { backgroundColor: accent }, glowStyle]}
        />

        <View style={styles.logoWrap}>
          <ProDayLogo
            width={logoWidth}
            variant={variant}
            onDark
            layout="horizontal"
            showPoleLabel
          />
        </View>

        <Animated.View style={[styles.iconBadge, { borderColor: `${accent}66` }, badgeStyle]}>
          <Icon name={iconName} size={cinematic ? 26 : 22} color={accent} />
        </Animated.View>

        <Text style={styles.mission} numberOfLines={cinematic ? 3 : 2}>
          {identity.mission}
        </Text>
      </Animated.View>
    </View>
  );
};

function createStyles(itemWidth: number, cinematic: boolean) {
  return StyleSheet.create({
    page: {
      width: itemWidth,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stage: {
      width: '100%',
      alignItems: 'center',
      paddingHorizontal: cinematic ? spacing.xl : spacing.md,
      gap: cinematic ? spacing.lg : spacing.md,
    },
    glow: {
      position: 'absolute',
      width: itemWidth * (cinematic ? 0.78 : 0.94),
      height: itemWidth * (cinematic ? 0.78 : 0.94),
      borderRadius: itemWidth,
      top: cinematic ? '4%' : '0%',
    },
    logoWrap: {
      width: '100%',
      alignItems: 'center',
      paddingHorizontal: spacing.xs,
    },
    iconBadge: {
      width: cinematic ? 52 : 44,
      height: cinematic ? 52 : 44,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      backgroundColor: 'rgba(255,255,255,0.05)',
    },
    mission: {
      maxWidth: cinematic ? 360 : 280,
      textAlign: 'center',
      fontSize: cinematic ? 16 : 14,
      lineHeight: cinematic ? 24 : 20,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.62)',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
