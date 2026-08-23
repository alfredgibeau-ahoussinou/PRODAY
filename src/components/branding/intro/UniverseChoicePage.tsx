import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import { ProDaySymbol } from '../ProDaySymbol';
import { spacing } from '../../../theme/designTokens';
import { UNIVERSE_ACCENT } from './universeIntroAccents';
import {
  brandVariantForCarouselPole,
  universePoleDisplayName,
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
  /** Réduit parallax pour accessibilité mouvement. */
  reducedMotion?: boolean;
}

/**
 * Slide univers minimaliste — symbole pôle + nom, transitions scale/opacity subtiles.
 */
export const UniverseChoicePage: React.FC<UniverseChoicePageProps> = ({
  line,
  index,
  itemWidth,
  scrollX,
  cinematic = false,
  reducedMotion = false,
}) => {
  const accent = UNIVERSE_ACCENT[line];
  const variant = brandVariantForCarouselPole(line);
  const poleName = universePoleDisplayName(line);
  const symbolSize = cinematic ? 160 : 132;
  const styles = useMemo(
    () => createStyles(itemWidth, cinematic),
    [itemWidth, cinematic],
  );

  const stageStyle = useAnimatedStyle(() => {
    if (itemWidth <= 0) {
      return { opacity: 0, transform: [{ scale: 0.96 }] };
    }
    const page = scrollX.value / itemWidth;
    const offset = page - index;
    const abs = Math.abs(offset);

    if (reducedMotion) {
      const opacity = interpolate(abs, [0, 0.5, 1], [1, 0.78, 0.58], Extrapolation.CLAMP);
      const scale = interpolate(abs, [0, 1], [1, 0.96], Extrapolation.CLAMP);
      return { opacity, transform: [{ scale }] };
    }

    const scale = interpolate(abs, [0, 0.5, 1], [1, 0.96, 0.92], Extrapolation.CLAMP);
    const opacity = interpolate(abs, [0, 0.45, 1], [1, 0.72, 0.48], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }] };
  }, [index, itemWidth, reducedMotion]);

  return (
    <View style={styles.page}>
      <Animated.View style={[styles.stage, stageStyle]}>
        <ProDaySymbol size={symbolSize} variant={variant} tone="white" />
        <Text style={[styles.poleName, { color: accent }]}>{poleName}</Text>
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
    poleName: {
      fontSize: cinematic ? 28 : 24,
      fontWeight: '700',
      letterSpacing: -0.4,
      textAlign: 'center',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
