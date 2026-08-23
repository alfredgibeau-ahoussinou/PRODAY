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
  universePoleTagline,
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
 * Slide univers — symbole + nom + micro-tagline, halo discret, carte légère.
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
  const tagline = universePoleTagline(line);
  const symbolSize = cinematic ? 160 : 132;
  const haloSize = symbolSize + (cinematic ? 72 : 56);
  const styles = useMemo(
    () => createStyles(itemWidth, cinematic, accent),
    [itemWidth, cinematic, accent],
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

  const haloStyle = useAnimatedStyle(() => {
    if (itemWidth <= 0) {
      return { opacity: 0.12 };
    }
    const page = scrollX.value / itemWidth;
    const abs = Math.abs(page - index);
    const opacity = interpolate(abs, [0, 0.45, 1], [0.18, 0.14, 0.1], Extrapolation.CLAMP);
    return { opacity };
  }, [index, itemWidth]);

  return (
    <View style={styles.page}>
      <Animated.View style={[styles.stage, stageStyle]}>
        <View style={styles.card}>
          <View style={styles.symbolWrap}>
            <Animated.View
              style={[
                styles.halo,
                { width: haloSize, height: haloSize, borderRadius: haloSize / 2, backgroundColor: accent },
                haloStyle,
              ]}
            />
            <ProDaySymbol size={symbolSize} variant={variant} tone="white" />
          </View>
          <Text style={[styles.poleName, { color: accent }]}>{poleName}</Text>
          <Text style={styles.tagline} numberOfLines={2}>
            {tagline}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

function createStyles(itemWidth: number, cinematic: boolean, accent: string) {
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
    },
    card: {
      width: '100%',
      maxWidth: cinematic ? 380 : 320,
      alignItems: 'center',
      paddingVertical: cinematic ? spacing.xl + spacing.sm : spacing.xl,
      paddingHorizontal: cinematic ? spacing.lg : spacing.md,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: accent + '22',
      backgroundColor: 'rgba(255,255,255,0.03)',
      gap: cinematic ? spacing.md : spacing.sm + 2,
    },
    symbolWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    halo: {
      position: 'absolute',
    },
    poleName: {
      fontSize: cinematic ? 28 : 24,
      fontWeight: '700',
      letterSpacing: -0.4,
      textAlign: 'center',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    tagline: {
      fontSize: cinematic ? 15 : 14,
      fontWeight: '500',
      letterSpacing: 0.1,
      lineHeight: cinematic ? 21 : 19,
      color: 'rgba(255,255,255,0.55)',
      textAlign: 'center',
      maxWidth: 260,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
