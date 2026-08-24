import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import { prodayMotion } from '../../../motion';
import { ProDaySymbol } from '../ProDaySymbol';
import { spacing } from '../../../theme/designTokens';
import { UNIVERSE_ACCENT } from './universeIntroAccents';
import { brandVariantForCarouselPole } from './universePoleBrand';

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
  /**
   * Mode stage fixe (tablette) — pas de scrollX, focus piloté par `focused`.
   */
  staticFocus?: boolean;
  focused?: boolean;
}

/**
 * Stage univers — symbole HD teinté pôle uniquement (pas de carte / bordure).
 * Nom + tagline vivent dans le chrome pour une seule accent active.
 */
export const UniverseChoicePage: React.FC<UniverseChoicePageProps> = ({
  line,
  index,
  itemWidth,
  scrollX,
  cinematic = false,
  reducedMotion = false,
  staticFocus = false,
  focused = true,
}) => {
  const accent = UNIVERSE_ACCENT[line];
  const variant = brandVariantForCarouselPole(line);
  const symbolSize = cinematic ? 200 : 148;
  const haloSize = symbolSize + (cinematic ? 96 : 72);
  const styles = useMemo(
    () => createStyles(itemWidth, cinematic),
    [itemWidth, cinematic],
  );

  const staticOpacity = useSharedValue(focused ? 1 : reducedMotion ? 0.55 : 0.42);
  const staticScale = useSharedValue(focused ? 1 : reducedMotion ? 0.97 : 0.9);
  const staticHalo = useSharedValue(focused ? (reducedMotion ? 0.16 : 0.22) : 0.06);

  useEffect(() => {
    if (!staticFocus) return;
    const nextOpacity = focused ? 1 : reducedMotion ? 0.55 : 0.42;
    const nextScale = focused ? 1 : reducedMotion ? 0.97 : 0.9;
    const nextHalo = focused ? (reducedMotion ? 0.16 : 0.22) : 0.06;
    if (reducedMotion) {
      staticOpacity.value = nextOpacity;
      staticScale.value = nextScale;
      staticHalo.value = nextHalo;
      return;
    }
    staticOpacity.value = withTiming(nextOpacity, {
      duration: prodayMotion.duration.slow,
      easing: prodayMotion.easing.out,
    });
    staticScale.value = withSpring(nextScale, prodayMotion.spring.smooth);
    staticHalo.value = withTiming(nextHalo, {
      duration: prodayMotion.duration.normal,
      easing: prodayMotion.easing.out,
    });
  }, [
    focused,
    line,
    reducedMotion,
    staticFocus,
    staticHalo,
    staticOpacity,
    staticScale,
  ]);

  const stageStyle = useAnimatedStyle(() => {
    if (staticFocus) {
      return {
        opacity: staticOpacity.value,
        transform: [{ scale: staticScale.value }],
      };
    }
    if (itemWidth <= 0) {
      return { opacity: 0, transform: [{ scale: 0.96 }] };
    }
    const page = scrollX.value / itemWidth;
    const offset = page - index;
    const abs = Math.abs(offset);

    if (reducedMotion) {
      const opacity = interpolate(abs, [0, 0.5, 1], [1, 0.78, 0.5], Extrapolation.CLAMP);
      const scale = interpolate(abs, [0, 1], [1, 0.96], Extrapolation.CLAMP);
      return { opacity, transform: [{ scale }] };
    }

    // Courbes plus douces — moins de chute d’opacity en mid-swipe.
    const scale = interpolate(abs, [0, 0.65, 1], [1, 0.96, 0.9], Extrapolation.CLAMP);
    const opacity = interpolate(abs, [0, 0.5, 1], [1, 0.68, 0.36], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }] };
  }, [index, itemWidth, reducedMotion, staticFocus]);

  const haloStyle = useAnimatedStyle(() => {
    if (staticFocus) {
      return { opacity: staticHalo.value };
    }
    if (itemWidth <= 0) {
      return { opacity: 0.08 };
    }
    const page = scrollX.value / itemWidth;
    const abs = Math.abs(page - index);
    const opacity = interpolate(abs, [0, 0.5, 1], [0.22, 0.12, 0.05], Extrapolation.CLAMP);
    return { opacity };
  }, [index, itemWidth, staticFocus]);

  return (
    <View
      style={styles.page}
      accessibilityElementsHidden={!focused && staticFocus}
      importantForAccessibility={focused || !staticFocus ? 'yes' : 'no-hide-descendants'}
    >
      <Animated.View style={[styles.stage, stageStyle]}>
        <View style={styles.symbolWrap}>
          <Animated.View
            style={[
              styles.halo,
              {
                width: haloSize,
                height: haloSize,
                borderRadius: haloSize / 2,
                backgroundColor: accent,
              },
              haloStyle,
            ]}
          />
          <ProDaySymbol size={symbolSize} variant={variant} tone="white" />
        </View>
      </Animated.View>
    </View>
  );
};

function createStyles(itemWidth: number, cinematic: boolean) {
  return StyleSheet.create({
    page: {
      width: itemWidth > 0 ? itemWidth : undefined,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stage: {
      width: '100%',
      alignItems: 'center',
      paddingHorizontal: cinematic ? spacing.xl : spacing.md,
      // Remonte le symbole au-dessus du chrome bas (nom + CTA).
      marginBottom: cinematic ? 0 : 96,
    },
    symbolWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    halo: {
      position: 'absolute',
    },
  });
}
