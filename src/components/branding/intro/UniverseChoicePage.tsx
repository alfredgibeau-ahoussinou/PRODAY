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
  /** Composition tablette / desktop : plus d’air. */
  cinematic?: boolean;
}

/**
 * Slide univers — symbole master + barre accent + wordmark pôle.
 * Stage immersif (pas de carte SaaS).
 */
export const UniverseChoicePage: React.FC<UniverseChoicePageProps> = ({
  line,
  index,
  itemWidth,
  scrollX,
  cinematic = false,
}) => {
  const identity = getCarouselPoleIdentity(line);
  const accent = UNIVERSE_ACCENT[line];
  const variant = brandVariantForCarouselPole(line);
  const iconName = universePoleIcon(line);
  const logoWidth = cinematic
    ? Math.min(itemWidth * 0.55, 220)
    : Math.min(itemWidth * 0.62, 188);
  const styles = useMemo(
    () => createStyles(itemWidth, cinematic),
    [itemWidth, cinematic],
  );

  const stageStyle = useAnimatedStyle(() => {
    if (itemWidth <= 0) {
      return { opacity: 0, transform: [{ scale: 0.92 }, { translateY: 12 }] };
    }
    const page = scrollX.value / itemWidth;
    const offset = page - index;
    const scale = interpolate(offset, [-1, 0, 1], [0.86, 1, 0.86], Extrapolation.CLAMP);
    const opacity = interpolate(
      offset,
      [-1, -0.55, 0, 0.55, 1],
      [0.35, 0.55, 1, 0.55, 0.35],
      Extrapolation.CLAMP,
    );
    const translateY = interpolate(offset, [-1, 0, 1], [18, 0, 18], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }, { translateY }] };
  });

  const glowStyle = useAnimatedStyle(() => {
    if (itemWidth <= 0) return { opacity: 0 };
    const page = scrollX.value / itemWidth;
    const offset = page - index;
    const opacity = interpolate(offset, [-1, 0, 1], [0.06, 0.34, 0.06], Extrapolation.CLAMP);
    const scale = interpolate(offset, [-1, 0, 1], [0.85, 1.08, 0.85], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }] };
  });

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
            layout="stacked"
            showPoleLabel
          />
        </View>

        <View style={[styles.iconBadge, { borderColor: `${accent}55` }]}>
          <Icon name={iconName} size={cinematic ? 26 : 22} color={accent} />
        </View>

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
      paddingHorizontal: cinematic ? spacing.xl : spacing.lg,
      gap: cinematic ? spacing.lg : spacing.md,
    },
    glow: {
      position: 'absolute',
      width: itemWidth * (cinematic ? 0.72 : 0.88),
      height: itemWidth * (cinematic ? 0.72 : 0.88),
      borderRadius: itemWidth,
      top: cinematic ? '6%' : '2%',
    },
    logoWrap: {
      width: '100%',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    iconBadge: {
      width: cinematic ? 52 : 44,
      height: cinematic ? 52 : 44,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      backgroundColor: 'rgba(255,255,255,0.04)',
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
